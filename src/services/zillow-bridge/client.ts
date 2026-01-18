// Zillow Bridge Data Output API Client
// Integration with Bridge Data Output for access to Zillow and MLS data
// Documentation: https://bridgedataoutput.com/docs/platform/

import type { 
  PropertySearchParams, 
  NormalizedProperty, 
  PropertySearchResponse,
  normalizePropertyType 
} from '@/config/property-providers'

interface BridgeConfig {
  accessToken: string
  serverToken: string
  dataset: string // MLS dataset identifier (e.g., 'test', 'actris', 'crmls')
  apiUrl: string
}

// Bridge Data Output property format
interface BridgeProperty {
  ListingId: string
  ListingKey: string
  ListingKeyNumeric?: number
  ListPrice: number
  OriginalListPrice?: number
  ClosePrice?: number
  StandardStatus: string
  MlsStatus?: string
  PropertyType: string
  PropertySubType?: string
  UnparsedAddress?: string
  StreetNumber?: string
  StreetName?: string
  StreetSuffix?: string
  City: string
  StateOrProvince: string
  PostalCode: string
  Country?: string
  Latitude?: number
  Longitude?: number
  BedroomsTotal?: number
  BathroomsTotalInteger?: number
  BathroomsFull?: number
  BathroomsHalf?: number
  LivingArea?: number
  LotSizeSquareFeet?: number
  LotSizeAcres?: number
  YearBuilt?: number
  PublicRemarks?: string
  PrivateRemarks?: string
  Appliances?: string[]
  InteriorFeatures?: string[]
  ExteriorFeatures?: string[]
  CommunityFeatures?: string[]
  Heating?: string[]
  Cooling?: string[]
  ParkingFeatures?: string[]
  PoolFeatures?: string[]
  WaterfrontFeatures?: string[]
  Media?: Array<{
    MediaURL: string
    MediaCategory?: string
    ShortDescription?: string
    Order?: number
  }>
  VirtualTourURLUnbranded?: string
  ListAgentFullName?: string
  ListAgentEmail?: string
  ListAgentDirectPhone?: string
  ListOfficeName?: string
  ListingContractDate?: string
  ModificationTimestamp?: string
  OriginalEntryTimestamp?: string
}

interface BridgeSearchResponse {
  '@odata.context'?: string
  '@odata.count'?: number
  '@odata.nextLink'?: string
  value: BridgeProperty[]
}

class ZillowBridgeClient {
  private config: BridgeConfig

  constructor(config: Partial<BridgeConfig>) {
    this.config = {
      accessToken: config.accessToken || '',
      serverToken: config.serverToken || '',
      dataset: config.dataset || 'test',
      apiUrl: config.apiUrl || 'https://api.bridgedataoutput.com/api/v2',
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Bridge API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Search listings using OData query syntax
  async searchListings(params: PropertySearchParams): Promise<PropertySearchResponse> {
    const filters: string[] = []
    
    // Build OData filter string
    if (params.city) {
      filters.push(`contains(tolower(City), '${params.city.toLowerCase()}')`)
    }
    if (params.state) {
      filters.push(`StateOrProvince eq '${params.state}'`)
    }
    if (params.zipCode) {
      filters.push(`PostalCode eq '${params.zipCode}'`)
    }
    if (params.minPrice) {
      filters.push(`ListPrice ge ${params.minPrice}`)
    }
    if (params.maxPrice) {
      filters.push(`ListPrice le ${params.maxPrice}`)
    }
    if (params.bedrooms) {
      filters.push(`BedroomsTotal ge ${params.bedrooms}`)
    }
    if (params.bathrooms) {
      filters.push(`BathroomsTotalInteger ge ${params.bathrooms}`)
    }
    if (params.minSquareFeet) {
      filters.push(`LivingArea ge ${params.minSquareFeet}`)
    }
    if (params.maxSquareFeet) {
      filters.push(`LivingArea le ${params.maxSquareFeet}`)
    }
    if (params.status) {
      const statusMap: Record<string, string> = {
        active: 'Active',
        pending: 'Pending',
        sold: 'Closed',
      }
      filters.push(`StandardStatus eq '${statusMap[params.status] || 'Active'}'`)
    } else {
      filters.push("StandardStatus eq 'Active'")
    }
    if (params.propertyType) {
      filters.push(`contains(tolower(PropertyType), '${params.propertyType.toLowerCase()}')`)
    }

    const queryParams = new URLSearchParams()
    
    if (filters.length > 0) {
      queryParams.append('$filter', filters.join(' and '))
    }
    
    // Sorting
    if (params.sortBy) {
      const sortFieldMap: Record<string, string> = {
        price: 'ListPrice',
        listDate: 'OriginalEntryTimestamp',
        squareFeet: 'LivingArea',
      }
      const sortField = sortFieldMap[params.sortBy] || 'ListPrice'
      const sortDir = params.sortOrder === 'asc' ? 'asc' : 'desc'
      queryParams.append('$orderby', `${sortField} ${sortDir}`)
    } else {
      queryParams.append('$orderby', 'ModificationTimestamp desc')
    }

    // Pagination
    const limit = params.limit || 20
    const offset = params.offset || 0
    queryParams.append('$top', limit.toString())
    queryParams.append('$skip', offset.toString())
    
    // Request count
    queryParams.append('$count', 'true')
    
    // Expand media
    queryParams.append('$expand', 'Media')

    try {
      const response = await this.request<BridgeSearchResponse>(
        `/OData/${this.config.dataset}/Property?${queryParams.toString()}`
      )

      const properties = response.value.map(p => this.transformToNormalized(p))

      return {
        success: true,
        properties,
        total: response['@odata.count'] || properties.length,
        limit,
        offset,
        provider: 'zillow_bridge',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        properties: [],
        total: 0,
        limit,
        offset,
        provider: 'zillow_bridge',
        error: message,
      }
    }
  }

  // Get single listing by ID
  async getListing(listingKey: string): Promise<NormalizedProperty | null> {
    try {
      const response = await this.request<BridgeProperty>(
        `/OData/${this.config.dataset}/Property('${listingKey}')?$expand=Media`
      )
      return this.transformToNormalized(response)
    } catch (error) {
      console.error('Error fetching Bridge listing:', error)
      return null
    }
  }

  // Test connection to the API
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to fetch just 1 property to test connection
      const response = await this.request<BridgeSearchResponse>(
        `/OData/${this.config.dataset}/Property?$top=1`
      )
      
      if (response.value) {
        return {
          success: true,
          message: `Conectado exitosamente. Dataset: ${this.config.dataset}`,
        }
      }
      
      return {
        success: false,
        message: 'Respuesta inesperada del servidor',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión'
      return {
        success: false,
        message,
      }
    }
  }

  // Alias for PropertyProviderClient interface compatibility
  searchNormalized(params: PropertySearchParams): Promise<PropertySearchResponse> {
    return this.searchListings(params)
  }

  // Transform Bridge property to normalized format
  transformToNormalized(bridgeProperty: BridgeProperty): NormalizedProperty {
    // Build full address
    const addressParts = [
      bridgeProperty.StreetNumber,
      bridgeProperty.StreetName,
      bridgeProperty.StreetSuffix,
    ].filter(Boolean)
    
    const street = bridgeProperty.UnparsedAddress || addressParts.join(' ') || 'Address not available'

    // Combine all features
    const allFeatures = [
      ...(bridgeProperty.InteriorFeatures || []),
      ...(bridgeProperty.ExteriorFeatures || []),
      ...(bridgeProperty.Appliances || []),
    ]

    // Amenities from community and other features
    const amenities = [
      ...(bridgeProperty.CommunityFeatures || []),
      ...(bridgeProperty.PoolFeatures || []),
      ...(bridgeProperty.ParkingFeatures || []),
      ...(bridgeProperty.WaterfrontFeatures || []),
    ]

    // Get images sorted by order
    const images = (bridgeProperty.Media || [])
      .filter(m => m.MediaURL && m.MediaCategory === 'Photo')
      .sort((a, b) => (a.Order || 0) - (b.Order || 0))
      .map(m => m.MediaURL)

    // Calculate total bathrooms
    const bathrooms = (bridgeProperty.BathroomsFull || 0) + 
                     ((bridgeProperty.BathroomsHalf || 0) * 0.5) ||
                     bridgeProperty.BathroomsTotalInteger || 0

    // Map status
    const statusMap: Record<string, NormalizedProperty['status']> = {
      'Active': 'active',
      'Pending': 'pending',
      'Closed': 'sold',
      'Withdrawn': 'off_market',
      'Expired': 'off_market',
      'Canceled': 'off_market',
    }

    return {
      id: `bridge-${bridgeProperty.ListingKey}`,
      sourceProvider: 'zillow_bridge',
      externalId: bridgeProperty.ListingKey,
      mlsNumber: bridgeProperty.ListingId,
      title: `${bridgeProperty.PropertyType || 'Property'} in ${bridgeProperty.City}`,
      description: bridgeProperty.PublicRemarks || 'No description available',
      price: bridgeProperty.ListPrice || 0,
      address: {
        street,
        city: bridgeProperty.City || '',
        state: bridgeProperty.StateOrProvince || '',
        zipCode: bridgeProperty.PostalCode || '',
        country: bridgeProperty.Country || 'US',
      },
      coordinates: bridgeProperty.Latitude && bridgeProperty.Longitude ? {
        latitude: bridgeProperty.Latitude,
        longitude: bridgeProperty.Longitude,
      } : undefined,
      details: {
        propertyType: bridgeProperty.PropertyType?.toLowerCase() || 'unknown',
        bedrooms: bridgeProperty.BedroomsTotal || 0,
        bathrooms,
        squareFeet: bridgeProperty.LivingArea || 0,
        lotSize: bridgeProperty.LotSizeSquareFeet || undefined,
        yearBuilt: bridgeProperty.YearBuilt || undefined,
      },
      features: allFeatures,
      amenities,
      images,
      virtualTourUrl: bridgeProperty.VirtualTourURLUnbranded || undefined,
      agent: bridgeProperty.ListAgentFullName ? {
        name: bridgeProperty.ListAgentFullName,
        email: bridgeProperty.ListAgentEmail || undefined,
        phone: bridgeProperty.ListAgentDirectPhone || undefined,
        company: bridgeProperty.ListOfficeName || undefined,
      } : undefined,
      listDate: bridgeProperty.OriginalEntryTimestamp || new Date().toISOString(),
      modifiedDate: bridgeProperty.ModificationTimestamp || new Date().toISOString(),
      status: statusMap[bridgeProperty.StandardStatus] || 'active',
    }
  }
}

// Factory function to create client with config
export function createZillowBridgeClient(config: {
  accessToken: string
  serverToken: string
  dataset: string
}): ZillowBridgeClient {
  return new ZillowBridgeClient({
    accessToken: config.accessToken,
    serverToken: config.serverToken,
    dataset: config.dataset,
  })
}

export { ZillowBridgeClient }
export type { BridgeProperty, BridgeSearchResponse }

