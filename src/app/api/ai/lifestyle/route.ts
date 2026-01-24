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
    const { idealLifeDescription, priorities, budget, location, preferredPropertyTypes } = body

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

    // Determine search location with fallback priority:
    // 1. User-provided location from form
    // 2. AI-extracted location from lifestyle description
    // 3. Default fallback location (New York for broad coverage)
    const DEFAULT_LOCATION = { city: 'New York', state: 'NY' }
    
    let searchCity: string | undefined
    let searchState: string | undefined
    let searchZipCode: string | undefined
    let locationSource = 'default'

    if (location && location.trim()) {
      // User provided explicit location
      searchCity = location.trim()
      locationSource = 'user'
    } else if (profileAnalysis.suggestedLocation) {
      // AI extracted location from description
      const suggested = profileAnalysis.suggestedLocation
      searchCity = suggested.city
      searchState = suggested.state
      searchZipCode = suggested.postalCode
      locationSource = 'ai_extracted'
      console.log('Using AI-extracted location:', suggested)
    } else {
      // Fallback to default location
      searchCity = DEFAULT_LOCATION.city
      searchState = DEFAULT_LOCATION.state
      locationSource = 'default'
      console.log('No location found, using default:', DEFAULT_LOCATION)
    }

    console.log('Search location resolved:', { searchCity, searchState, searchZipCode, locationSource })

    // Get properties from active providers (limit is calculated dynamically based on search_settings)
    const propertyResult = await searchPropertiesFromProviders({
      city: searchCity,
      state: searchState,
      zipCode: searchZipCode,
      minPrice: budget ? budget * 0.7 : undefined,
      maxPrice: budget ? budget * 1.3 : undefined,
      propertyType: preferredPropertyTypes?.[0],
      status: 'active',
    })

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
      matches = matchResult.matches.map(match => {
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
      }).filter(Boolean).sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0))
    }

    // Build the effective location for saving
    const effectiveLocation = searchCity || location || ''
    const preferredCities: string[] = []
    if (effectiveLocation) preferredCities.push(effectiveLocation)
    if (profileAnalysis.suggestedLocation?.city && !preferredCities.includes(profileAnalysis.suggestedLocation.city)) {
      preferredCities.push(profileAnalysis.suggestedLocation.city)
    }

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
        suggestedLocation: profileAnalysis.suggestedLocation,
        priorities,
        budget,
        location: effectiveLocation, // The actual location used for search
        locationSource, // Where the location came from
        preferredPropertyTypes,
      },
      providers: providerInfo,
      meta: {
        total: matches.length,
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
