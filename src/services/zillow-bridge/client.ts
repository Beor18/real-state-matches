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
  dataset: string // MLS dataset identifier (e.g., 'stellar', 'actris', 'crmls')
  apiUrl: string
  defaultState?: string       // Default StateOrProvince filter (e.g., 'PR', 'FL')
  defaultMlsStatus?: string   // Default MlsStatus filter (e.g., 'Active', 'Pending')
}

// Bridge Media item with all quality-related fields
interface BridgeMediaItem {
  MediaURL: string
  ResizeMediaURL?: string      // URL for resizable version (high quality)
  MediaCategory?: string       // 'Photo', 'Video', etc.
  ShortDescription?: string
  Order?: number
  ImageHeight?: number         // Image height in pixels
  ImageWidth?: number          // Image width in pixels
  ImageSizeDescription?: string // 'Thumbnail', 'Small', 'Medium', 'Large', 'X-Large', 'Largest'
  MimeType?: string
  MediaType?: string
  PreferredPhotoYN?: boolean   // Indicates if this is the preferred/primary photo
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
  Media?: BridgeMediaItem[]
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
      defaultState: config.defaultState,
      defaultMlsStatus: config.defaultMlsStatus,
    }
  }

  private async request<T>(path: string, queryString?: string, options: RequestInit = {}): Promise<T> {
    // Build URL with access_token as the FIRST query parameter (required by Bridge API)
    // Format: /path?access_token=XXX&$filter=...&$orderby=...
    const tokenParam = `access_token=${this.config.accessToken}`
    const url = queryString
      ? `${this.config.apiUrl}${path}?${tokenParam}&${queryString}`
      : `${this.config.apiUrl}${path}?${tokenParam}`
    
    console.log(`[Bridge API] URL: ${url.replace(/access_token=[^&]+/, 'access_token=***')}`)
    
    const response = await fetch(url, {
      ...options,
      headers: {
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
    
    // StateOrProvince: use param if provided, otherwise fall back to default from admin config
    if (params.state) {
      filters.push(`StateOrProvince eq '${params.state}'`)
    } else if (this.config.defaultState) {
      filters.push(`StateOrProvince eq '${this.config.defaultState}'`)
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
    
    // MlsStatus: use param if provided, otherwise fall back to default from admin config
    if (params.status) {
      const statusMap: Record<string, string> = {
        active: 'Active',
        pending: 'Pending',
        sold: 'Closed',
      }
      filters.push(`MlsStatus eq '${statusMap[params.status] || 'Active'}'`)
    } else if (this.config.defaultMlsStatus) {
      filters.push(`MlsStatus eq '${this.config.defaultMlsStatus}'`)
    } else {
      filters.push("MlsStatus eq 'Active'")
    }
    
    // Map app property types to Stellar MLS OData filter values
    if (params.propertyType) {
      const bridgeTypeMap: Record<string, string> = {
        'house':         "PropertySubType eq 'Single Family Residence'",
        'single_family': "PropertySubType eq 'Single Family Residence'",
        'condo':         "PropertySubType eq 'Condominium'",
        'townhouse':     "PropertySubType eq 'Townhouse'",
        'multi_family':  "PropertySubType eq 'Multi Family'",
        'apartment':     "PropertySubType eq 'Condominium'",
        'land':          "PropertyType eq 'Land'",
        'commercial':    "contains(tolower(PropertyType), 'commercial')",
      }
      const typeFilter = bridgeTypeMap[params.propertyType.toLowerCase()]
      if (typeFilter) {
        filters.push(typeFilter)
      } else {
        // Fallback: generic contains search
        filters.push(`contains(tolower(PropertyType), '${params.propertyType.toLowerCase()}')`)
      }
    }

    // Build OData query string manually to preserve literal '$' in parameter names.
    // URLSearchParams encodes '$' as '%24' which Bridge Data Output API does not recognize.
    const odataParams: string[] = []
    
    if (filters.length > 0) {
      odataParams.push(`$filter=${encodeURIComponent(filters.join(' and '))}`)
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
      odataParams.push(`$orderby=${encodeURIComponent(`${sortField} ${sortDir}`)}`)
    } else {
      odataParams.push(`$orderby=${encodeURIComponent('ModificationTimestamp desc')}`)
    }

    // Pagination
    const limit = params.limit || 20
    const offset = params.offset || 0
    odataParams.push(`$top=${limit}`)
    odataParams.push(`$skip=${offset}`)
    
    // Request count
    odataParams.push('$count=true')

    const queryString = odataParams.join('&')
    const path = `/OData/${this.config.dataset}/Property`

    try {
      console.log(`[Bridge API] Search: ${path}?${queryString}`)

      const response = await this.request<BridgeSearchResponse>(path, queryString)

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
        `/OData/${this.config.dataset}/Property('${listingKey}')`
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
        `/OData/${this.config.dataset}/Property`,
        '$top=1'
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

  // Get the highest quality image URL available from a media item
  private getHighQualityImageUrl(media: BridgeMediaItem): string {
    // Priority 1: Use ResizeMediaURL if available (typically supports high-res)
    if (media.ResizeMediaURL) {
      return media.ResizeMediaURL
    }

    // Priority 2: Use MediaURL directly
    // Apply URL transformations for known CDN patterns to get highest quality
    let url = media.MediaURL

    // Pattern: Some CDNs use size suffixes like _s, _m, _l, _t (thumbnail)
    // Try to get the largest version by removing size suffixes
    const sizePatterns = [
      { pattern: /_t\.(jpg|jpeg|png|webp)$/i, replacement: '.$1' },      // _t = thumbnail
      { pattern: /_s\.(jpg|jpeg|png|webp)$/i, replacement: '.$1' },      // _s = small
      { pattern: /_m\.(jpg|jpeg|png|webp)$/i, replacement: '.$1' },      // _m = medium
      { pattern: /-thumb\.(jpg|jpeg|png|webp)$/i, replacement: '.$1' },  // -thumb
      { pattern: /-small\.(jpg|jpeg|png|webp)$/i, replacement: '.$1' },  // -small
      { pattern: /-medium\.(jpg|jpeg|png|webp)$/i, replacement: '.$1' }, // -medium
    ]

    for (const { pattern, replacement } of sizePatterns) {
      if (pattern.test(url)) {
        url = url.replace(pattern, replacement)
        break
      }
    }

    // Pattern: Some URLs have width/height params - try to maximize them
    // e.g., ?w=200&h=150 -> ?w=1200&h=900 or remove size constraints
    if (url.includes('?')) {
      const urlObj = new URL(url)
      const widthParams = ['w', 'width', 'resize_w']
      const heightParams = ['h', 'height', 'resize_h']
      
      let hasResizeParams = false
      for (const param of widthParams) {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '1200')
          hasResizeParams = true
        }
      }
      for (const param of heightParams) {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '900')
          hasResizeParams = true
        }
      }
      
      if (hasResizeParams) {
        url = urlObj.toString()
      }
    }

    return url
  }

  // Get image quality score for sorting (higher is better)
  private getImageQualityScore(media: BridgeMediaItem): number {
    let score = 0

    // Score based on ImageSizeDescription
    const sizeScores: Record<string, number> = {
      'Largest': 100,
      'X-Large': 90,
      'Large': 80,
      'Medium': 50,
      'Small': 20,
      'Thumbnail': 10,
    }
    if (media.ImageSizeDescription) {
      score += sizeScores[media.ImageSizeDescription] || 50
    }

    // Score based on actual dimensions (prefer larger images)
    if (media.ImageWidth && media.ImageHeight) {
      const pixels = media.ImageWidth * media.ImageHeight
      if (pixels >= 2000000) score += 100      // 2MP+
      else if (pixels >= 1000000) score += 80  // 1MP+
      else if (pixels >= 500000) score += 60   // 0.5MP+
      else if (pixels >= 250000) score += 40   // 0.25MP+
      else score += 20
    }

    // Bonus for ResizeMediaURL (indicates high-quality source)
    if (media.ResizeMediaURL) {
      score += 50
    }

    // Bonus for preferred photo
    if (media.PreferredPhotoYN) {
      score += 200 // Ensure preferred photo appears first
    }

    return score
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

    // Get images from Media array - use MediaURL directly, sorted by Order
    const images: string[] = (bridgeProperty.Media || [])
      .filter(m => m.MediaURL && (!m.MediaCategory || m.MediaCategory === 'Photo'))
      .sort((a, b) => (a.Order || 0) - (b.Order || 0))
      .map(m => m.MediaURL)

    console.log(`[Bridge API] Property ${bridgeProperty.ListingKey}: ${bridgeProperty.Media?.length || 0} media items, ${images.length} images extracted`)

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
      status: statusMap[bridgeProperty.MlsStatus || bridgeProperty.StandardStatus] || 'active',
    }
  }
}

// Factory function to create client with config
export function createZillowBridgeClient(config: {
  accessToken: string
  serverToken: string
  dataset: string
  defaultState?: string
  defaultMlsStatus?: string
}): ZillowBridgeClient {
  return new ZillowBridgeClient({
    accessToken: config.accessToken,
    serverToken: config.serverToken,
    dataset: config.dataset,
    defaultState: config.defaultState,
    defaultMlsStatus: config.defaultMlsStatus,
  })
}

export { ZillowBridgeClient }
export type { BridgeProperty, BridgeSearchResponse, BridgeMediaItem }

