import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeLifestyleProfile, matchPropertiesWithProfile } from '@/services/ai/openai-services'
import { searchPropertiesFromProviders, hasActiveProviders } from '@/lib/property-client'
import { loadAIConfigFromDatabase } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated (optional for basic analysis)
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { idealLifeDescription, priorities, budget, location, preferredPropertyTypes, propertyType, listingType } = body

    if (!idealLifeDescription) {
      return NextResponse.json(
        { success: false, error: 'idealLifeDescription is required' },
        { status: 400 }
      )
    }

    // Check if we have any property providers configured
    const hasProviders = await hasActiveProviders()
    
    if (!hasProviders) {
      return NextResponse.json({
        success: false,
        error: 'No hay proveedores de propiedades configurados. Un administrador debe configurar al menos un proveedor de datos (Showcase IDX, Zillow, etc.) para habilitar la búsqueda.',
        code: 'NO_PROVIDERS',
        matches: [],
        profile: null,
        meta: {
          total: 0,
          analyzedAt: new Date().toISOString(),
        },
      })
    }

    // Load AI configuration from database before using AI services
    const aiConfig = await loadAIConfigFromDatabase()
    
    if (!aiConfig) {
      return NextResponse.json({
        success: false,
        error: 'No hay proveedor de IA configurado. Un administrador debe configurar un proveedor de IA (OpenAI, Anthropic, etc.) en la sección de configuración.',
        code: 'NO_AI_PROVIDER',
        matches: [],
        profile: null,
        meta: {
          total: 0,
          analyzedAt: new Date().toISOString(),
        },
      })
    }

    // Analyze the lifestyle profile
    const profileAnalysis = await analyzeLifestyleProfile({
      idealLifeDescription,
      priorities: priorities || '',
      budget,
      location,
      preferredPropertyTypes,
    })

    // Build list of all locations to search
    // Sources: AI-extracted locations + user-provided location
    interface SearchLocation {
      city?: string
      state?: string
      zipCode?: string
      source: string
    }
    
    const searchLocations: SearchLocation[] = []
    
    // Add AI-extracted locations (can be multiple)
    if (profileAnalysis.suggestedLocations && profileAnalysis.suggestedLocations.length > 0) {
      for (const loc of profileAnalysis.suggestedLocations) {
        searchLocations.push({
          city: loc.city,
          state: loc.state,
          zipCode: loc.postalCode,
          source: 'ai_extracted',
        })
      }
      console.log(`AI extracted ${profileAnalysis.suggestedLocations.length} locations:`, profileAnalysis.suggestedLocations)
    }
    
    // Add user-provided location if not already covered
    if (location && location.trim()) {
      const userLoc = location.trim().toLowerCase()
      const alreadyIncluded = searchLocations.some(
        loc => loc.city?.toLowerCase() === userLoc || loc.state?.toLowerCase() === userLoc
      )
      if (!alreadyIncluded) {
        searchLocations.push({
          city: location.trim(),
          source: 'user',
        })
      }
    }
    
    // If no locations found, use default (Puerto Rico for Xposure integration)
    if (searchLocations.length === 0) {
      searchLocations.push({
        city: undefined,
        state: 'PR',
        source: 'default',
      })
      console.log('No locations found, using default: Puerto Rico')
    }
    
    console.log(`Searching in ${searchLocations.length} location(s):`, searchLocations)

    // Search properties for each location in parallel
    // Budget is a MAXIMUM, so we search from 0 to budget (not a central range)
    const locationResults = await Promise.all(
      searchLocations.map(async (loc) => {
        console.log(`Searching properties in: ${loc.city || ''} ${loc.state || ''} (source: ${loc.source}), budget max: $${budget}, propertyType: ${propertyType || 'any'}, listingType: ${listingType || 'any'}`)
        return searchPropertiesFromProviders({
          city: loc.city,
          state: loc.state,
          zipCode: loc.zipCode,
          minPrice: undefined, // No minimum - search all prices up to budget
          maxPrice: budget || undefined, // Budget is the maximum
          propertyType: propertyType || preferredPropertyTypes?.[0],
          listingType: listingType || undefined,
          status: 'active',
        })
      })
    )
    
    // Combine results from all locations
    const combinedProperties: typeof locationResults[0]['properties'] = []
    const combinedTotalByProvider: Record<string, number> = {}
    const combinedErrors: Record<string, string> = {}
    const combinedProvidersQueried = new Set<string>()
    let searchSettings = locationResults[0]?.searchSettings
    
    for (const result of locationResults) {
      // Add properties (avoid duplicates by ID)
      for (const prop of result.properties) {
        if (!combinedProperties.find(p => p.id === prop.id)) {
          combinedProperties.push(prop)
        }
      }
      
      // Merge totals
      for (const [provider, total] of Object.entries(result.totalByProvider)) {
        combinedTotalByProvider[provider] = (combinedTotalByProvider[provider] || 0) + total
      }
      
      // Merge errors
      Object.assign(combinedErrors, result.errors)
      
      // Merge providers queried
      result.providersQueried.forEach(p => combinedProvidersQueried.add(p))
      
      // Use first search settings
      if (!searchSettings) searchSettings = result.searchSettings
    }
    
    console.log(`Combined ${combinedProperties.length} properties from ${searchLocations.length} location searches`)
    console.log(`Providers queried: ${Array.from(combinedProvidersQueried).join(', ')}`)
    console.log(`Properties by provider:`, combinedTotalByProvider)

    // Create combined property result
    const propertyResult = {
      success: combinedProperties.length > 0 || Object.keys(combinedErrors).length === 0,
      properties: combinedProperties,
      totalByProvider: combinedTotalByProvider,
      errors: combinedErrors,
      providersQueried: Array.from(combinedProvidersQueried) as any[],
      searchSettings: searchSettings!,
    }

    let matches: any[] = []
    let providerInfo = {
      providersQueried: propertyResult.providersQueried,
      totalByProvider: propertyResult.totalByProvider,
      errors: propertyResult.errors,
    }

    if (propertyResult.properties.length > 0) {
      // Limit properties sent to AI based on search settings
      const maxForAI = propertyResult.searchSettings.max_properties_for_ai
      const propertiesForAI = propertyResult.properties.slice(0, maxForAI)
      
      console.log(`Sending ${propertiesForAI.length} properties to AI (max: ${maxForAI}, total available: ${propertyResult.properties.length})`)
      
      // Match properties with profile using AI
      const matchResult = await matchPropertiesWithProfile(
        { idealLifeDescription, priorities: priorities || '', budget, location, preferredPropertyTypes },
        propertiesForAI.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          address: p.address.street,
          city: p.address.city,
          amenities: p.amenities,
          features: p.features,
          price: p.price,
          bedrooms: p.details.bedrooms || undefined,
          bathrooms: p.details.bathrooms || undefined,
          squareFeet: p.details.squareFeet || undefined,
        }))
      )

      // Combine match scores with property data
      const allMatches = matchResult.matches.map(match => {
        const property = propertyResult.properties.find((p) => p.id === match.propertyId)
        if (!property) return null
        
        return {
          id: property.id,
          sourceProvider: property.sourceProvider,
          externalId: property.externalId,
          mlsNumber: property.mlsNumber,
          title: property.title,
          description: property.description,
          price: property.price,
          address: property.address.street,
          city: property.address.city,
          state: property.address.state,
          zipCode: property.address.zipCode,
          bedrooms: property.details.bedrooms,
          bathrooms: property.details.bathrooms,
          squareFeet: property.details.squareFeet,
          yearBuilt: property.details.yearBuilt,
          propertyType: property.details.propertyType,
          features: property.features,
          amenities: property.amenities,
          images: property.images,
          virtualTourUrl: property.virtualTourUrl,
          agent: property.agent,
          listDate: property.listDate,
          status: property.status,
          // AI matching data
          matchScore: match.matchScore,
          matchReasons: match.matchReasons,
          lifestyleFit: match.lifestyleFit,
        }
      }).filter(Boolean)
      
      // Prioritize Xposure (Puerto Rico MLS) properties
      // Separate Xposure properties and sort each group by match score
      const xposureMatches = allMatches
        .filter(m => m?.sourceProvider === 'xposure')
        .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0))
      
      const otherMatches = allMatches
        .filter(m => m?.sourceProvider !== 'xposure')
        .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0))
      
      // Ensure at least 5 Xposure properties are prioritized at the top
      // Then add other properties sorted by match score
      const prioritizedXposure = xposureMatches.slice(0, 5)
      const remainingXposure = xposureMatches.slice(5)
      
      // Combine: prioritized Xposure first, then others sorted by score
      const remainingCombined = [...remainingXposure, ...otherMatches]
        .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0))
      
      matches = [...prioritizedXposure, ...remainingCombined]
      
      console.log(`Prioritized ${prioritizedXposure.length} Xposure properties, ${remainingCombined.length} other properties`)
    }

    // Build the effective locations for saving
    const preferredCities: string[] = []
    
    // Add all searched locations
    for (const loc of searchLocations) {
      if (loc.city && !preferredCities.includes(loc.city)) {
        preferredCities.push(loc.city)
      }
    }
    
    // Add AI-suggested cities
    for (const loc of profileAnalysis.suggestedLocations || []) {
      if (loc.city && !preferredCities.includes(loc.city)) {
        preferredCities.push(loc.city)
      }
    }
    
    const effectiveLocation = preferredCities.join(', ') || location || ''
    const locationSource = searchLocations.length > 1 ? 'multi_location' : searchLocations[0]?.source || 'default'

    // If user is authenticated, save their lifestyle profile
    if (user && profileAnalysis) {
      const { error: profileError } = await supabase
        .from('lifestyle_profiles')
        .upsert({
          user_id: user.id,
          ideal_life_description: idealLifeDescription,
          lifestyle_keywords: profileAnalysis.keywords,
          preferred_property_types: preferredPropertyTypes || [],
          preferred_cities: preferredCities,
          budget_min: budget ? budget * 0.8 : null,
          budget_max: budget ? budget * 1.2 : null,
          lifestyle_priorities: priorities ? priorities.split(',').map((p: string) => p.trim()) : [],
          embedding: profileAnalysis.embedding ? JSON.stringify(profileAnalysis.embedding) : null,
        } as any, {
          onConflict: 'user_id',
        })

      if (profileError) {
        console.error('Error saving lifestyle profile:', profileError)
      }
    }

    return NextResponse.json({
      success: true,
      matches,
      profile: {
        idealLifeDescription,
        keywords: profileAnalysis.keywords,
        summary: profileAnalysis.summary,
        lifestyleType: profileAnalysis.lifestyleType,
        suggestedLocation: profileAnalysis.suggestedLocation, // Backward compatibility
        suggestedLocations: profileAnalysis.suggestedLocations, // All detected locations
        priorities,
        budget,
        location: effectiveLocation, // The actual locations used for search
        locationSource, // 'user', 'ai_extracted', 'multi_location', or 'default'
        searchedLocations: searchLocations.length, // Number of locations searched
        preferredPropertyTypes,
      },
      providers: providerInfo,
      meta: {
        total: matches.length,
        locationsSearched: searchLocations.length,
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error processing lifestyle match:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar la búsqueda de estilo de vida' },
      { status: 500 }
    )
  }
}
