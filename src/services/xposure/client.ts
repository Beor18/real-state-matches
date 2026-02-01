// Xposure MLS Puerto Rico Client
// Integration with local Supabase database for Puerto Rico MLS listings
// Data source: https://puertorico.xposureapp.com

import { createClient } from '@/lib/supabase/server'
import type { 
  PropertySearchParams, 
  NormalizedProperty, 
  PropertySearchResponse 
} from '@/config/property-providers'

// Xposure property format from JSON/database
export interface XposureProperty {
  id: string
  publicKey: string
  uid: string
  xpid: string
  title: string
  type: number
  address: string
  stName: string
  stNum: string
  unit: string
  subdivision: string
  map_area: string
  district: string
  status: string
  statusNum: number
  price_current: string
  price_current_rent: string
  price_sold: string
  bedrooms: string
  bathrooms: string
  sqft_total: string
  lot_sqft: string
  year_built: string
  parking_spaces: string
  lat: number
  lng: number
  thumbnailPhotoURL: string
  pcount: number
  property_icon: string
  is_reported: boolean
  relist: boolean
  change: string
  listing_status_change: string
  occurance: string
  seq: number
  key: string
}

// Database property format
interface DatabaseProperty {
  id: string
  mls_id: string
  idx_source: string
  title: string | null
  description: string | null
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  neighborhood: string | null
  property_type: string
  listing_type: string
  price: number
  bedrooms: number
  bathrooms: number
  square_feet: number
  lot_size: number | null
  year_built: number | null
  amenities: string[] | null
  features: string[] | null
  images: string[] | null
  agent_name: string | null
  agent_email: string | null
  agent_phone: string | null
  agent_company: string | null
  latitude: number | null
  longitude: number | null
  status: string
  featured: boolean
  created_at: string
  updated_at: string
}

// Puerto Rico cities for detection (both with and without accents)
const PUERTO_RICO_CITIES = new Set([
  'san juan', 'aguadilla', 'rincon', 'rincón', 'dorado', 'guaynabo', 'mayaguez', 'mayagüez',
  'ponce', 'carolina', 'bayamon', 'bayamón', 'caguas', 'arecibo', 'fajardo', 'humacao',
  'isabela', 'cabo rojo', 'vega baja', 'vega alta', 'manati', 'manatí', 'toa baja', 'toa alta',
  'trujillo alto', 'guayama', 'yauco', 'coamo', 'hatillo', 'aguada', 'moca', 'añasco', 'anasco',
  'isla verde', 'condado', 'viejo san juan', 'santurce', 'luquillo', 'rio grande', 'río grande',
  'culebra', 'vieques', 'loiza', 'loíza', 'canóvanas', 'canovanas', 'gurabo', 'juncos', 'las piedras'
])

// City name variations mapping (without accents -> with accents, and vice versa)
const CITY_VARIATIONS: Record<string, string[]> = {
  'mayaguez': ['mayagüez', 'mayaguez'],
  'mayagüez': ['mayaguez', 'mayagüez'],
  'rincon': ['rincón', 'rincon'],
  'rincón': ['rincon', 'rincón'],
  'bayamon': ['bayamón', 'bayamon'],
  'bayamón': ['bayamon', 'bayamón'],
  'manati': ['manatí', 'manati'],
  'manatí': ['manati', 'manatí'],
  'anasco': ['añasco', 'anasco'],
  'añasco': ['anasco', 'añasco'],
  'rio grande': ['río grande', 'rio grande'],
  'río grande': ['rio grande', 'río grande'],
  'loiza': ['loíza', 'loiza'],
  'loíza': ['loiza', 'loíza'],
  'canovanas': ['canóvanas', 'canovanas'],
  'canóvanas': ['canovanas', 'canóvanas'],
}

// Normalize text for comparison (remove accents)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim()
}

// Translate property type to Spanish for display
function propertyTypeToSpanish(type: string): string {
  const translations: Record<string, string> = {
    'residential': 'Residencial',
    'apartment': 'Apartamento',
    'house': 'Casa',
    'condo': 'Condominio',
    'land': 'Terreno',
    'commercial': 'Comercial',
    'townhouse': 'Townhouse',
  }
  return translations[type?.toLowerCase()] || 'Propiedad'
}

class XposureClient {
  // Check if search is for Puerto Rico region
  private isPuertoRicoSearch(params: PropertySearchParams): boolean {
    const state = params.state?.toLowerCase().trim()
    const city = params.city?.toLowerCase().trim()
    const normalizedCity = city ? normalizeText(city) : ''
    
    // Check state
    if (state === 'pr' || state === 'puerto rico') {
      return true
    }
    
    // Check if city is a known PR city (with or without accents)
    if (city && PUERTO_RICO_CITIES.has(city)) {
      return true
    }
    
    // Check normalized version of city
    if (normalizedCity) {
      for (const prCity of PUERTO_RICO_CITIES) {
        if (normalizeText(prCity) === normalizedCity) {
          return true
        }
        // Also check if city contains the PR city name
        if (normalizedCity.includes(normalizeText(prCity))) {
          return true
        }
      }
    }
    
    // If no location specified at all, include Xposure results
    if (!state && !city && !params.zipCode) {
      return true
    }
    
    return false
  }

  // Get city search variations for flexible matching
  private getCityVariations(city: string): string[] {
    const normalized = normalizeText(city)
    const variations = new Set<string>([city])
    
    // Add direct variations from mapping
    const lowerCity = city.toLowerCase().trim()
    if (CITY_VARIATIONS[lowerCity]) {
      CITY_VARIATIONS[lowerCity].forEach(v => variations.add(v))
    }
    
    // Also check normalized version
    for (const [key, values] of Object.entries(CITY_VARIATIONS)) {
      if (normalizeText(key) === normalized) {
        values.forEach(v => variations.add(v))
      }
    }
    
    return Array.from(variations)
  }

  // Search properties from Supabase database
  async searchNormalized(params: PropertySearchParams): Promise<PropertySearchResponse> {
    // Only participate in Puerto Rico searches
    if (!this.isPuertoRicoSearch(params)) {
      console.log('Xposure: Skipping search (not Puerto Rico region)')
      return {
        success: true,
        properties: [],
        total: 0,
        limit: params.limit || 20,
        offset: params.offset || 0,
        provider: 'xposure' as const,
      }
    }

    try {
      const supabase = await createClient()
      
      // Build query for Xposure properties
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('idx_source', 'xposure')
      
      // Apply city filter with variations for accent handling
      if (params.city) {
        const cityVariations = this.getCityVariations(params.city)
        console.log(`Xposure: Searching for city "${params.city}" with variations:`, cityVariations)
        
        if (cityVariations.length === 1) {
          query = query.ilike('city', `%${cityVariations[0]}%`)
        } else {
          // Use OR filter for multiple variations
          const orFilter = cityVariations.map(v => `city.ilike.%${v}%`).join(',')
          query = query.or(orFilter)
        }
      }
      
      // Also search in neighborhood if city is specified
      if (params.city) {
        // We'll do a second search including neighborhood later if needed
      }
      
      if (params.state) {
        query = query.ilike('state', `%${params.state}%`)
      }
      if (params.zipCode) {
        query = query.eq('zip_code', params.zipCode)
      }
      if (params.minPrice) {
        query = query.gte('price', params.minPrice)
      }
      if (params.maxPrice) {
        query = query.lte('price', params.maxPrice)
      }
      if (params.bedrooms) {
        query = query.gte('bedrooms', params.bedrooms)
      }
      if (params.bathrooms) {
        query = query.gte('bathrooms', params.bathrooms)
      }
      if (params.minSquareFeet) {
        query = query.gte('square_feet', params.minSquareFeet)
      }
      if (params.maxSquareFeet) {
        query = query.lte('square_feet', params.maxSquareFeet)
      }
      if (params.propertyType) {
        query = query.eq('property_type', params.propertyType)
      }
      if (params.status) {
        query = query.eq('status', params.status)
      }
      
      // Apply sorting - prioritize featured properties
      if (params.sortBy === 'price') {
        query = query.order('featured', { ascending: false })
          .order('price', { ascending: params.sortOrder === 'asc' })
      } else {
        query = query.order('featured', { ascending: false })
          .order('created_at', { ascending: false })
      }
      
      // Apply pagination
      const limit = params.limit || 20
      const offset = params.offset || 0
      query = query.range(offset, offset + limit - 1)
      
      const { data, error, count } = await query

      if (error) {
        console.error('Xposure search error:', error)
        return {
          success: false,
          properties: [],
          total: 0,
          limit,
          offset,
          provider: 'xposure' as const,
          error: error.message,
        }
      }

      const properties = (data || []).map((p: DatabaseProperty) => 
        this.transformDatabaseToNormalized(p)
      )

      console.log(`Xposure: Found ${properties.length} properties (total: ${count}) for city: ${params.city || 'any'}`)

      return {
        success: true,
        properties,
        total: count || properties.length,
        limit,
        offset,
        provider: 'xposure' as const,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Xposure search error:', message)
      return {
        success: false,
        properties: [],
        total: 0,
        limit: params.limit || 20,
        offset: params.offset || 0,
        provider: 'xposure' as const,
        error: message,
      }
    }
  }

  // Test connection to database
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = await createClient()
      
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('idx_source', 'xposure')

      if (error) {
        return {
          success: false,
          message: `Error de conexión: ${error.message}`,
        }
      }

      return {
        success: true,
        message: `Conexión exitosa. ${count || 0} propiedades de Xposure en la base de datos.`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      return {
        success: false,
        message,
      }
    }
  }

  // Transform database property to normalized format
  transformDatabaseToNormalized(dbProperty: DatabaseProperty): NormalizedProperty {
    // Map status
    const statusMap: Record<string, NormalizedProperty['status']> = {
      'active': 'active',
      'activo': 'active',
      'pending': 'pending',
      'pendiente': 'pending',
      'sold': 'sold',
      'vendido': 'sold',
      'off_market': 'off_market',
    }

    // Determine listing type for title
    const isRent = dbProperty.listing_type === 'rent'
    const listingTypeText = isRent ? 'Alquiler' : 'Venta'

    return {
      id: `xposure-${dbProperty.mls_id}`,
      sourceProvider: 'xposure' as const,
      externalId: dbProperty.mls_id,
      mlsNumber: dbProperty.mls_id,
      title: dbProperty.title || `${propertyTypeToSpanish(dbProperty.property_type)} en ${listingTypeText} - ${dbProperty.city}`,
      description: `Propiedad en ${dbProperty.neighborhood || dbProperty.city}, ${dbProperty.state}. ${dbProperty.bedrooms} habitaciones, ${dbProperty.bathrooms} baños.`,
      price: dbProperty.price,
      address: {
        street: dbProperty.address,
        city: dbProperty.city,
        state: dbProperty.state,
        zipCode: dbProperty.zip_code || '',
        country: dbProperty.country || 'PR',
      },
      coordinates: dbProperty.latitude && dbProperty.longitude ? {
        latitude: dbProperty.latitude,
        longitude: dbProperty.longitude,
      } : undefined,
      details: {
        propertyType: dbProperty.property_type,
        bedrooms: dbProperty.bedrooms,
        bathrooms: dbProperty.bathrooms,
        squareFeet: dbProperty.square_feet,
        lotSize: dbProperty.lot_size || undefined,
        yearBuilt: dbProperty.year_built || undefined,
      },
      features: dbProperty.features || [],
      amenities: dbProperty.amenities || [],
      images: dbProperty.images || [],
      agent: dbProperty.agent_name ? {
        name: dbProperty.agent_name,
        email: dbProperty.agent_email || undefined,
        phone: dbProperty.agent_phone || undefined,
        company: dbProperty.agent_company || undefined,
      } : undefined,
      listDate: dbProperty.created_at,
      modifiedDate: dbProperty.updated_at,
      status: statusMap[dbProperty.status.toLowerCase()] || 'active',
    }
  }

  // Transform Xposure JSON property to normalized format (for import script)
  static transformXposureToNormalized(xposureProperty: XposureProperty): NormalizedProperty {
    // Parse price from string like "USD $2,300.00" or "USD $150,000.00"
    const parsePrice = (priceStr: string): number => {
      if (!priceStr) return 0
      const cleaned = priceStr.replace(/[^\d.]/g, '')
      return parseFloat(cleaned) || 0
    }

    // Determine if it's for rent or sale
    const isRent = xposureProperty.title?.toLowerCase().includes('alquiler') || 
                   !!xposureProperty.price_current_rent
    
    const price = isRent 
      ? parsePrice(xposureProperty.price_current_rent)
      : parsePrice(xposureProperty.price_current) || parsePrice(xposureProperty.price_sold)

    // Parse numeric values from strings
    const parseNumber = (str: string): number => {
      if (!str) return 0
      const cleaned = str.replace(/[^\d.]/g, '')
      return parseFloat(cleaned) || 0
    }

    // Map status
    const statusMap: Record<string, NormalizedProperty['status']> = {
      'activo': 'active',
      'active': 'active',
      'pendiente': 'pending',
      'pending': 'pending',
      'vendido': 'sold',
      'sold': 'sold',
    }

    // Decode HTML entities in strings
    const decodeHtml = (str: string): string => {
      if (!str) return ''
      return str
        .replace(/&oacute;/g, 'ó')
        .replace(/&aacute;/g, 'á')
        .replace(/&eacute;/g, 'é')
        .replace(/&iacute;/g, 'í')
        .replace(/&uacute;/g, 'ú')
        .replace(/&ntilde;/g, 'ñ')
        .replace(/&amp;/g, '&')
    }

    // Determine property type from icon
    const propertyTypeFromIcon = (icon: string): string => {
      if (icon.includes('apartment')) return 'apartment'
      if (icon.includes('house')) return 'house'
      if (icon.includes('condo')) return 'condo'
      if (icon.includes('land')) return 'land'
      if (icon.includes('commercial')) return 'commercial'
      return 'residential'
    }

    const city = decodeHtml(xposureProperty.district || 'Puerto Rico')
    const neighborhood = decodeHtml(xposureProperty.map_area || '')
    const propertyType = propertyTypeFromIcon(xposureProperty.property_icon || '')

    return {
      id: `xposure-${xposureProperty.id}`,
      sourceProvider: 'xposure' as const,
      externalId: xposureProperty.id,
      mlsNumber: xposureProperty.publicKey || xposureProperty.uid,
      title: `${propertyTypeToSpanish(propertyType)} en ${city}`,
      description: `Propiedad en ${neighborhood || city}, Puerto Rico. ${xposureProperty.subdivision ? `Urbanización: ${decodeHtml(xposureProperty.subdivision)}` : ''}`,
      price,
      address: {
        street: xposureProperty.address?.trim() || `${xposureProperty.stName} ${xposureProperty.stNum}`.trim(),
        city,
        state: 'PR',
        zipCode: '',
        country: 'PR',
      },
      coordinates: xposureProperty.lat && xposureProperty.lng ? {
        latitude: xposureProperty.lat,
        longitude: xposureProperty.lng,
      } : undefined,
      details: {
        propertyType,
        bedrooms: parseInt(xposureProperty.bedrooms) || 0,
        bathrooms: parseFloat(xposureProperty.bathrooms) || 0,
        squareFeet: parseNumber(xposureProperty.sqft_total),
        lotSize: parseNumber(xposureProperty.lot_sqft) || undefined,
        yearBuilt: parseInt(xposureProperty.year_built) || undefined,
      },
      features: xposureProperty.parking_spaces ? [`${xposureProperty.parking_spaces} estacionamientos`] : [],
      amenities: [],
      images: xposureProperty.thumbnailPhotoURL ? [xposureProperty.thumbnailPhotoURL] : [],
      listDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      status: statusMap[xposureProperty.status?.toLowerCase()] || 'active',
    }
  }
}

// Factory function
export function createXposureClient(): XposureClient {
  return new XposureClient()
}

export { XposureClient }
export type { DatabaseProperty }
