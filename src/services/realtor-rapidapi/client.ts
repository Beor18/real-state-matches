// Realtor.com RapidAPI Client
// Integration with Realtor Data API via RapidAPI
// Documentation: https://rapidapi.com/apidojo/api/realtor

import type { 
  PropertySearchParams, 
  NormalizedProperty, 
  PropertySearchResponse 
} from '@/config/property-providers'

interface RealtorConfig {
  rapidApiKey: string
  apiHost: string
}

// Query object structure (inside the query wrapper)
interface PropertyListQuery {
  // Location parameters
  state_code?: string
  city?: string
  postal_code?: string
  address?: string
  street_name?: string
  
  // Search by radius
  search_location?: {
    radius: number
    location: string
  }
  
  // Status and type
  status?: string[]
  type?: string[]
  
  // Price range (object format)
  list_price?: {
    min?: number
    max?: number
  }
  
  // Property details (object format)
  beds?: {
    min?: number
    max?: number
  }
  baths?: {
    min?: number
    max?: number
  }
  sqft?: {
    min?: number
    max?: number
  }
  lot_sqft?: {
    min?: number
    max?: number
  }
  year_built?: {
    min?: number
    max?: number
  }
  
  // Boolean filters
  foreclosure?: boolean
  new_construction?: boolean
  has_tour?: boolean
  matterport?: boolean
  pending?: boolean
  contingent?: boolean
}

// Full request body structure
interface PropertyListRequest {
  query: PropertyListQuery
  limit: number
  offset: number
  sort?: {
    direction: 'asc' | 'desc'
    field: string
  }
}

// Realtor API property format (from property_list endpoint)
interface RealtorProperty {
  property_id: string
  listing_id?: string
  list_price?: number
  price_reduced_amount?: number
  status?: string
  matterport?: boolean
  virtual_tours?: Array<{
    href?: string
    type?: string
  }>
  primary_photo?: {
    href?: string
  }
  photos?: Array<{
    href?: string
  }>
  description?: {
    name?: string
    beds?: number
    beds_min?: number
    beds_max?: number
    baths?: number
    baths_consolidated?: string
    baths_min?: number
    baths_max?: number
    baths_full?: number
    baths_half?: number
    sqft?: number
    sqft_min?: number
    sqft_max?: number
    lot_sqft?: number
    type?: string
    sub_type?: string
    sold_price?: number
    sold_date?: string
    year_built?: number
  }
  location?: {
    street_view_url?: string
    address?: {
      line?: string
      postal_code?: string
      state?: string
      state_code?: string
      city?: string
      coordinate?: {
        lat?: number
        lon?: number
      }
    }
    county?: {
      name?: string
      fips_code?: string
    }
  }
  open_houses?: Array<{
    start_date?: string
    end_date?: string
  }>
  branding?: Array<{
    type?: string
    name?: string
    photo?: string
  }>
  flags?: {
    is_coming_soon?: boolean
    is_new_listing?: boolean
    is_price_reduced?: boolean
    is_foreclosure?: boolean
    is_new_construction?: boolean
    is_pending?: boolean
    is_contingent?: boolean
  }
  list_date?: string
  advertisers?: Array<{
    type?: string
    fulfillment_id?: string
    name?: string
    builder?: string
  }>
  source?: {
    id?: string
    name?: string
    type?: string
    spec_id?: string
    plan_id?: string
    listing_id?: string
  }
  community?: {
    description?: {
      name?: string
    }
    property_id?: string
    permalink?: string
  }
  permalink?: string
}

interface RealtorSearchResponse {
  data?: {
    home_search?: {
      count?: number
      total?: number
      properties?: RealtorProperty[]
    }
  }
  // Error response format
  errors?: Array<{
    message?: string
    extensions?: Record<string, unknown>
  }>
}

// US State name to code mapping
const STATE_CODE_MAP: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
}

// List of all state names for detection
const STATE_NAMES = new Set(Object.keys(STATE_CODE_MAP))
const STATE_CODES = new Set(Object.values(STATE_CODE_MAP))

class RealtorRapidAPIClient {
  private config: RealtorConfig

  constructor(config: Partial<RealtorConfig>) {
    this.config = {
      rapidApiKey: config.rapidApiKey || '',
      apiHost: config.apiHost || 'realtor-data1.p.rapidapi.com',
    }
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `https://${this.config.apiHost}${endpoint}`
    
    console.log('Realtor API Request:', { url, body: JSON.stringify(body, null, 2) })
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-rapidapi-host': this.config.apiHost,
        'x-rapidapi-key': this.config.rapidApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Realtor API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Check if a string is a US state (name or code)
  private isStateName(value: string): boolean {
    const normalized = value.toLowerCase().trim()
    return STATE_NAMES.has(normalized) || STATE_CODES.has(normalized.toUpperCase())
  }

  // Convert state name to 2-letter code
  private normalizeStateCode(state: string): string {
    const normalized = state.toLowerCase().trim()
    // If already a 2-letter code, return uppercase
    if (normalized.length === 2 && STATE_CODES.has(normalized.toUpperCase())) {
      return normalized.toUpperCase()
    }
    // Look up full state name
    return STATE_CODE_MAP[normalized] || state.toUpperCase()
  }

  // Detect if a location string is a ZIP code
  private isZipCode(value: string): boolean {
    return /^\d{5}(-\d{4})?$/.test(value.trim())
  }

  // Parse location intelligently
  private parseLocation(location?: string, city?: string, state?: string): { 
    state_code?: string
    city?: string 
    postal_code?: string
  } {
    const result: { state_code?: string; city?: string; postal_code?: string } = {}

    // Handle explicit state parameter
    if (state) {
      if (this.isStateName(state)) {
        result.state_code = this.normalizeStateCode(state)
      } else {
        result.city = state // It's actually a city
      }
    }

    // Handle explicit city parameter
    if (city) {
      if (this.isStateName(city)) {
        // City field contains a state name
        result.state_code = this.normalizeStateCode(city)
      } else if (this.isZipCode(city)) {
        result.postal_code = city
      } else {
        result.city = city
      }
    }

    // Handle generic location (from AI analysis)
    if (location) {
      const loc = location.trim()
      
      if (this.isZipCode(loc)) {
        result.postal_code = loc
      } else if (this.isStateName(loc)) {
        result.state_code = this.normalizeStateCode(loc)
      } else {
        // Assume it's a city if not already set
        if (!result.city) {
          result.city = loc
        }
      }
    }

    return result
  }

  // Search for properties for sale
  async searchForSale(params: PropertySearchParams): Promise<PropertySearchResponse> {
    // Parse location intelligently
    const locationInfo = this.parseLocation(
      undefined, // No generic location in PropertySearchParams
      params.city,
      params.state
    )

    // Build query object
    const query: PropertyListQuery = {
      status: ['for_sale'],
    }
    
    // Add location parameters
    if (locationInfo.state_code) {
      query.state_code = locationInfo.state_code
    }
    if (locationInfo.city) {
      query.city = locationInfo.city
    }
    if (locationInfo.postal_code) {
      query.postal_code = locationInfo.postal_code
    }
    if (params.zipCode) {
      query.postal_code = params.zipCode
    }
    
    // Price range (object format)
    if (params.minPrice || params.maxPrice) {
      query.list_price = {}
      if (params.minPrice) query.list_price.min = params.minPrice
      if (params.maxPrice) query.list_price.max = params.maxPrice
    }
    
    // Bedrooms (object format)
    if (params.bedrooms) {
      query.beds = { min: params.bedrooms }
    }
    
    // Bathrooms (object format)
    if (params.bathrooms) {
      query.baths = { min: params.bathrooms }
    }
    
    // Square footage (object format)
    if (params.minSquareFeet || params.maxSquareFeet) {
      query.sqft = {}
      if (params.minSquareFeet) query.sqft.min = params.minSquareFeet
      if (params.maxSquareFeet) query.sqft.max = params.maxSquareFeet
    }
    
    // Property type
    if (params.propertyType) {
      query.type = [this.mapPropertyType(params.propertyType)]
    }

    // Build full request body with query wrapper
    const requestBody: PropertyListRequest = {
      query,
      limit: params.limit || 20,
      offset: params.offset || 0,
      sort: {
        direction: params.sortOrder === 'asc' ? 'asc' : 'desc',
        field: params.sortBy === 'price' ? 'list_price' : 
               params.sortBy === 'squareFeet' ? 'sqft' : 'list_date',
      },
    }

    try {
      const response = await this.request<RealtorSearchResponse>('/property_list/', requestBody)

      // Handle response
      const properties = response.data?.home_search?.properties || []
      const total = response.data?.home_search?.total || properties.length

      console.log('Realtor API Response:', {
        total,
        propertiesCount: properties.length,
        hasData: !!response.data,
        hasHomeSearch: !!response.data?.home_search,
        sampleProperty: properties[0] ? { id: properties[0].property_id, price: properties[0].list_price } : null,
      })

      const normalizedProperties = properties.map(p => this.transformToNormalized(p))

      return {
        success: true,
        properties: normalizedProperties,
        total,
        limit: requestBody.limit,
        offset: requestBody.offset,
        provider: 'realtor_rapidapi',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Realtor API search error:', message)
      return {
        success: false,
        properties: [],
        total: 0,
        limit: requestBody.limit,
        offset: requestBody.offset,
        provider: 'realtor_rapidapi',
        error: message,
      }
    }
  }

  // Search for properties for rent
  async searchForRent(params: PropertySearchParams): Promise<PropertySearchResponse> {
    // Parse location intelligently
    const locationInfo = this.parseLocation(
      undefined,
      params.city,
      params.state
    )

    // Build query object
    const query: PropertyListQuery = {
      status: ['for_rent'],
    }
    
    // Add location parameters
    if (locationInfo.state_code) {
      query.state_code = locationInfo.state_code
    }
    if (locationInfo.city) {
      query.city = locationInfo.city
    }
    if (locationInfo.postal_code) {
      query.postal_code = locationInfo.postal_code
    }
    if (params.zipCode) {
      query.postal_code = params.zipCode
    }
    
    // Price range (object format)
    if (params.minPrice || params.maxPrice) {
      query.list_price = {}
      if (params.minPrice) query.list_price.min = params.minPrice
      if (params.maxPrice) query.list_price.max = params.maxPrice
    }
    
    // Bedrooms (object format)
    if (params.bedrooms) {
      query.beds = { min: params.bedrooms }
    }
    
    // Bathrooms (object format)
    if (params.bathrooms) {
      query.baths = { min: params.bathrooms }
    }

    // Build full request body with query wrapper
    const requestBody: PropertyListRequest = {
      query,
      limit: params.limit || 20,
      offset: params.offset || 0,
      sort: {
        direction: 'desc',
        field: 'list_date',
      },
    }

    try {
      const response = await this.request<RealtorSearchResponse>('/property_list/', requestBody)

      const properties = response.data?.home_search?.properties || []
      const total = response.data?.home_search?.total || properties.length

      const normalizedProperties = properties.map(p => this.transformToNormalized(p))

      return {
        success: true,
        properties: normalizedProperties,
        total,
        limit: requestBody.limit,
        offset: requestBody.offset,
        provider: 'realtor_rapidapi',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Realtor API rent search error:', message)
      return {
        success: false,
        properties: [],
        total: 0,
        limit: requestBody.limit,
        offset: requestBody.offset,
        provider: 'realtor_rapidapi',
        error: message,
      }
    }
  }

  // Unified search method for PropertyProviderClient interface
  async searchNormalized(params: PropertySearchParams): Promise<PropertySearchResponse> {
    // Default to for-sale search
    return this.searchForSale(params)
  }

  // Test connection to the API
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to fetch just 1 property to test connection
      const response = await this.request<RealtorSearchResponse>('/property_list/', {
        query: {
          status: ['for_sale'],
          postal_code: '10022',
        },
        limit: 1,
        offset: 0,
      })
      
      const hasResults = response.data?.home_search?.properties
      
      if (hasResults) {
        const total = response.data?.home_search?.total || 0
        return {
          success: true,
          message: `Conectado exitosamente a Realtor.com API. Total propiedades encontradas: ${total}`,
        }
      }
      
      return {
        success: true,
        message: 'Conexión establecida (sin resultados de prueba)',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión'
      return {
        success: false,
        message,
      }
    }
  }

  // Map internal property type to Realtor API format
  private mapPropertyType(type: string): string {
    const typeMap: Record<string, string> = {
      house: 'single_family',
      single_family: 'single_family',
      condo: 'condo',
      condos: 'condo',
      townhouse: 'townhomes',
      townhomes: 'townhomes',
      apartment: 'apartment',
      multi_family: 'multi_family',
      land: 'land',
      commercial: 'commercial',
      mobile: 'mobile',
      coop: 'coop',
    }
    return typeMap[type.toLowerCase()] || type
  }

  // Transform Realtor property to normalized format
  transformToNormalized(realtorProperty: RealtorProperty): NormalizedProperty {
    // Build address
    const address = realtorProperty.location?.address || {}
    const street = address.line || 'Address not available'

    // Get all images
    const images: string[] = []
    if (realtorProperty.primary_photo?.href) {
      images.push(realtorProperty.primary_photo.href)
    }
    if (realtorProperty.photos) {
      realtorProperty.photos.forEach(photo => {
        if (photo.href && !images.includes(photo.href)) {
          images.push(photo.href)
        }
      })
    }

    // Extract features from flags
    const features: string[] = []
    const flags = realtorProperty.flags || {}
    if (flags.is_new_listing) features.push('New Listing')
    if (flags.is_new_construction) features.push('New Construction')
    if (flags.is_foreclosure) features.push('Foreclosure')
    if (flags.is_price_reduced) features.push('Price Reduced')
    if (realtorProperty.matterport) features.push('Matterport Tour')

    // Get virtual tour URL
    let virtualTourUrl: string | undefined
    if (realtorProperty.virtual_tours && realtorProperty.virtual_tours.length > 0) {
      virtualTourUrl = realtorProperty.virtual_tours[0].href
    }

    // Get agent info from advertisers
    let agent: NormalizedProperty['agent']
    if (realtorProperty.advertisers && realtorProperty.advertisers.length > 0) {
      const advertiser = realtorProperty.advertisers.find(a => a.type === 'seller') || realtorProperty.advertisers[0]
      if (advertiser.name) {
        agent = {
          name: advertiser.name,
          company: realtorProperty.branding?.[0]?.name,
        }
      }
    } else if (realtorProperty.branding && realtorProperty.branding.length > 0) {
      const branding = realtorProperty.branding[0]
      if (branding.name) {
        agent = {
          name: branding.name,
          company: branding.name,
        }
      }
    }

    // Parse bathrooms from baths_consolidated (e.g., "2.5" or "2")
    let bathrooms = 0
    const desc = realtorProperty.description
    if (desc?.baths_consolidated) {
      bathrooms = parseFloat(desc.baths_consolidated) || 0
    } else if (desc?.baths_full !== undefined || desc?.baths_half !== undefined) {
      bathrooms = (desc.baths_full || 0) + ((desc.baths_half || 0) * 0.5)
    }

    // Map status
    const statusMap: Record<string, NormalizedProperty['status']> = {
      'for_sale': 'active',
      'ready_to_build': 'active',
      'pending': 'pending',
      'sold': 'sold',
      'off_market': 'off_market',
    }

    const propertyType = desc?.type || desc?.sub_type || 'unknown'
    const city = address.city || 'Unknown City'

    return {
      id: `realtor-${realtorProperty.property_id}`,
      sourceProvider: 'realtor_rapidapi',
      externalId: realtorProperty.property_id,
      mlsNumber: realtorProperty.listing_id || realtorProperty.source?.listing_id,
      title: `${this.formatPropertyType(propertyType)} in ${city}`,
      description: realtorProperty.community?.description?.name || `${this.formatPropertyType(propertyType)} property available in ${city}, ${address.state_code || ''}`,
      price: realtorProperty.list_price || 0,
      address: {
        street,
        city,
        state: address.state_code || address.state || '',
        zipCode: address.postal_code || '',
        country: 'US',
      },
      coordinates: address.coordinate?.lat && address.coordinate?.lon ? {
        latitude: address.coordinate.lat,
        longitude: address.coordinate.lon,
      } : undefined,
      details: {
        propertyType: propertyType.toLowerCase().replace(/_/g, ' '),
        bedrooms: desc?.beds || desc?.beds_min || 0,
        bathrooms,
        squareFeet: desc?.sqft || desc?.sqft_min || 0,
        lotSize: desc?.lot_sqft,
        yearBuilt: desc?.year_built,
      },
      features,
      amenities: [],
      images,
      virtualTourUrl,
      agent,
      listDate: realtorProperty.list_date || new Date().toISOString(),
      modifiedDate: realtorProperty.list_date || new Date().toISOString(),
      status: statusMap[realtorProperty.status || ''] || (realtorProperty.flags?.is_pending ? 'pending' : 'active'),
    }
  }

  // Format property type for display
  private formatPropertyType(type: string): string {
    const formatMap: Record<string, string> = {
      'single_family': 'Single Family Home',
      'condo': 'Condo',
      'condos': 'Condo',
      'coop': 'Co-op',
      'co_op': 'Co-op',
      'townhomes': 'Townhouse',
      'townhouse': 'Townhouse',
      'apartment': 'Apartment',
      'multi_family': 'Multi-Family',
      'land': 'Land',
      'mobile': 'Mobile Home',
      'commercial': 'Commercial',
    }
    return formatMap[type.toLowerCase()] || type.replace(/_/g, ' ')
  }
}

// Factory function to create client with config
export function createRealtorRapidAPIClient(config: {
  rapidApiKey: string
}): RealtorRapidAPIClient {
  return new RealtorRapidAPIClient({
    rapidApiKey: config.rapidApiKey,
  })
}

export { RealtorRapidAPIClient }
export type { RealtorProperty, RealtorSearchResponse }
