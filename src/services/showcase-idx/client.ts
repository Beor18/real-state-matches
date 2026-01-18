// Showcase IDX API Client
// Integration with Showcase IDX for real MLS property data

import type { Property } from '@/types/database'
import type { 
  PropertySearchParams, 
  NormalizedProperty, 
  PropertySearchResponse 
} from '@/config/property-providers'

interface ShowcaseIDXConfig {
  apiKey: string
  apiUrl: string
}

interface ShowcaseIDXProperty {
  listingId: string
  mlsNumber: string
  status: string
  price: number
  address: {
    streetAddress: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  details: {
    propertyType: string
    bedrooms: number
    bathrooms: number
    squareFeet: number
    lotSize?: number
    yearBuilt?: number
  }
  description: string
  features: string[]
  amenities: string[]
  photos: Array<{
    url: string
    caption?: string
  }>
  virtualTour?: string
  video?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  agent: {
    name: string
    email: string
    phone: string
    company: string
  }
  listDate: string
  modifiedDate: string
}

interface ShowcaseIDXSearchParams {
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  status?: 'active' | 'pending' | 'sold'
  limit?: number
  offset?: number
  sortBy?: 'price' | 'listDate' | 'modifiedDate'
  sortOrder?: 'asc' | 'desc'
}

interface ShowcaseIDXSearchResponse {
  total: number
  limit: number
  offset: number
  listings: ShowcaseIDXProperty[]
}

class ShowcaseIDXClient {
  private config: ShowcaseIDXConfig

  constructor(config?: Partial<ShowcaseIDXConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.SHOWCASE_IDX_API_KEY || '',
      apiUrl: config?.apiUrl || process.env.SHOWCASE_IDX_API_URL || 'https://api.showcaseidx.com/v2',
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Showcase IDX API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Search listings
  async searchListings(params: ShowcaseIDXSearchParams): Promise<ShowcaseIDXSearchResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.city) queryParams.append('city', params.city)
    if (params.state) queryParams.append('state', params.state)
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString())
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString())
    if (params.propertyType) queryParams.append('propertyType', params.propertyType)
    if (params.bedrooms) queryParams.append('bedrooms', params.bedrooms.toString())
    if (params.bathrooms) queryParams.append('bathrooms', params.bathrooms.toString())
    if (params.status) queryParams.append('status', params.status)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    return this.request<ShowcaseIDXSearchResponse>(`/listings?${queryParams.toString()}`)
  }

  // Get single listing by ID
  async getListing(listingId: string): Promise<ShowcaseIDXProperty> {
    return this.request<ShowcaseIDXProperty>(`/listings/${listingId}`)
  }

  // Get featured listings
  async getFeaturedListings(limit: number = 10): Promise<ShowcaseIDXSearchResponse> {
    return this.searchListings({
      status: 'active',
      sortBy: 'listDate',
      sortOrder: 'desc',
      limit,
    })
  }

  // Search with normalized params and response (for PropertyClient interface)
  async searchNormalized(params: PropertySearchParams): Promise<PropertySearchResponse> {
    try {
      const response = await this.searchListings({
        city: params.city,
        state: params.state,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        propertyType: params.propertyType,
        bedrooms: params.bedrooms,
        bathrooms: params.bathrooms,
        status: params.status,
        limit: params.limit,
        offset: params.offset,
        sortBy: params.sortBy === 'squareFeet' ? 'listDate' : params.sortBy,
        sortOrder: params.sortOrder,
      })

      const properties = response.listings.map(p => this.transformToNormalized(p))

      return {
        success: true,
        properties,
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        provider: 'showcase_idx',
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        properties: [],
        total: 0,
        limit: params.limit || 20,
        offset: params.offset || 0,
        provider: 'showcase_idx',
        error: message,
      }
    }
  }

  // Test connection to the API
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.searchListings({ limit: 1, status: 'active' })
      
      if (response.listings) {
        return {
          success: true,
          message: `Conectado exitosamente. ${response.total} propiedades disponibles.`,
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

  // Transform to NormalizedProperty format
  transformToNormalized(idxProperty: ShowcaseIDXProperty): NormalizedProperty {
    const statusMap: Record<string, NormalizedProperty['status']> = {
      'active': 'active',
      'pending': 'pending',
      'sold': 'sold',
      'off_market': 'off_market',
    }

    return {
      id: `idx-${idxProperty.listingId}`,
      sourceProvider: 'showcase_idx',
      externalId: idxProperty.listingId,
      mlsNumber: idxProperty.mlsNumber,
      title: `${idxProperty.details.propertyType} en ${idxProperty.address.city}`,
      description: idxProperty.description,
      price: idxProperty.price,
      address: {
        street: idxProperty.address.streetAddress,
        city: idxProperty.address.city,
        state: idxProperty.address.state,
        zipCode: idxProperty.address.zipCode,
        country: idxProperty.address.country || 'US',
      },
      coordinates: idxProperty.coordinates ? {
        latitude: idxProperty.coordinates.latitude,
        longitude: idxProperty.coordinates.longitude,
      } : undefined,
      details: {
        propertyType: idxProperty.details.propertyType.toLowerCase(),
        bedrooms: idxProperty.details.bedrooms,
        bathrooms: idxProperty.details.bathrooms,
        squareFeet: idxProperty.details.squareFeet,
        lotSize: idxProperty.details.lotSize,
        yearBuilt: idxProperty.details.yearBuilt,
      },
      features: idxProperty.features,
      amenities: idxProperty.amenities,
      images: idxProperty.photos.map(p => p.url),
      virtualTourUrl: idxProperty.virtualTour,
      videoUrl: idxProperty.video,
      agent: {
        name: idxProperty.agent.name,
        email: idxProperty.agent.email,
        phone: idxProperty.agent.phone,
        company: idxProperty.agent.company,
      },
      listDate: idxProperty.listDate,
      modifiedDate: idxProperty.modifiedDate,
      status: statusMap[idxProperty.status.toLowerCase()] || 'active',
    }
  }

  // Convert Showcase IDX property to our database format
  transformToProperty(idxProperty: ShowcaseIDXProperty): Omit<Property, 'id' | 'created_at' | 'updated_at'> {
    return {
      mls_id: idxProperty.mlsNumber,
      idx_source: 'showcase_idx',
      title: `${idxProperty.details.propertyType} en ${idxProperty.address.city}`,
      description: idxProperty.description,
      address: idxProperty.address.streetAddress,
      city: idxProperty.address.city,
      state: idxProperty.address.state,
      zip_code: idxProperty.address.zipCode,
      country: idxProperty.address.country || 'US',
      property_type: idxProperty.details.propertyType.toLowerCase(),
      listing_type: 'sale',
      price: idxProperty.price,
      bedrooms: idxProperty.details.bedrooms,
      bathrooms: idxProperty.details.bathrooms,
      square_feet: idxProperty.details.squareFeet,
      lot_size: idxProperty.details.lotSize || null,
      year_built: idxProperty.details.yearBuilt || null,
      amenities: idxProperty.amenities,
      features: idxProperty.features,
      images: idxProperty.photos.map(p => p.url),
      virtual_tour_url: idxProperty.virtualTour || null,
      video_url: idxProperty.video || null,
      latitude: idxProperty.coordinates?.latitude || null,
      longitude: idxProperty.coordinates?.longitude || null,
      neighborhood: null,
      agent_name: idxProperty.agent.name,
      agent_email: idxProperty.agent.email,
      agent_phone: idxProperty.agent.phone,
      agent_company: idxProperty.agent.company,
      status: idxProperty.status.toLowerCase() as 'active' | 'pending' | 'sold' | 'off_market',
      featured: false,
      embedding: null,
    }
  }
}

// Singleton instance (uses env vars)
let showcaseIDXClient: ShowcaseIDXClient | null = null

export function getShowcaseIDXClient(): ShowcaseIDXClient {
  if (!showcaseIDXClient) {
    showcaseIDXClient = new ShowcaseIDXClient()
  }
  return showcaseIDXClient
}

// Factory function to create client with custom config
export function createShowcaseIDXClient(config: { apiKey: string }): ShowcaseIDXClient {
  return new ShowcaseIDXClient({ apiKey: config.apiKey })
}

export { ShowcaseIDXClient }
export type { ShowcaseIDXProperty, ShowcaseIDXSearchParams, ShowcaseIDXSearchResponse }

// Mock data for development/testing when API is not available
export const MOCK_IDX_PROPERTIES: ShowcaseIDXProperty[] = [
  {
    listingId: 'mock-1',
    mlsNumber: 'MLS-2025-001',
    status: 'active',
    price: 485000,
    address: {
      streetAddress: '123 Calle del Sol',
      city: 'Dorado',
      state: 'PR',
      zipCode: '00646',
      country: 'PR',
    },
    details: {
      propertyType: 'House',
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 2400,
      lotSize: 5000,
      yearBuilt: 2018,
    },
    description: 'Hermosa villa moderna con vista al mar en la exclusiva zona de Dorado. Cocina gourmet, pisos de mármol, y amplia terraza con piscina infinity. Perfecta para quienes buscan lujo y tranquilidad cerca de la playa.',
    features: ['Piscina Infinity', 'Cocina Gourmet', 'Pisos de Mármol', 'Sistema de Sonido', 'Generador'],
    amenities: ['Vista al Mar', 'Piscina', 'Terraza', 'Parqueo 3 autos', 'Seguridad 24/7'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800' },
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800' },
    ],
    virtualTour: 'https://tour.showcaseidx.com/mock-1',
    coordinates: { latitude: 18.4589, longitude: -66.2679 },
    agent: {
      name: 'María González',
      email: 'maria@realestate-pr.com',
      phone: '787-555-0101',
      company: 'Elite Properties PR',
    },
    listDate: '2025-01-10',
    modifiedDate: '2025-01-15',
  },
  {
    listingId: 'mock-2',
    mlsNumber: 'MLS-2025-002',
    status: 'active',
    price: 625000,
    address: {
      streetAddress: '456 Avenida Ashford',
      city: 'San Juan',
      state: 'PR',
      zipCode: '00907',
      country: 'PR',
    },
    details: {
      propertyType: 'Condo',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1800,
      yearBuilt: 2020,
    },
    description: 'Espectacular penthouse en el corazón de Condado con vistas panorámicas al océano Atlántico. Acabados de lujo, gimnasio privado en el edificio, y acceso directo a la playa. Ideal para profesionales o inversión en Airbnb.',
    features: ['Acabados de Lujo', 'Balcón Amplio', 'Cocina Moderna', 'Closets Grandes', 'AC Central'],
    amenities: ['Vista al Mar', 'Gimnasio', 'Piscina', 'Seguridad 24/7', 'Lobby con Conserje'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800' },
    ],
    coordinates: { latitude: 18.4519, longitude: -66.0749 },
    agent: {
      name: 'Carlos Rivera',
      email: 'carlos@luxurypr.com',
      phone: '787-555-0202',
      company: 'Luxury Condado Realty',
    },
    listDate: '2025-01-08',
    modifiedDate: '2025-01-14',
  },
  {
    listingId: 'mock-3',
    mlsNumber: 'MLS-2025-003',
    status: 'active',
    price: 375000,
    address: {
      streetAddress: '789 Calle Principal',
      city: 'Guaynabo',
      state: 'PR',
      zipCode: '00969',
      country: 'PR',
    },
    details: {
      propertyType: 'House',
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2800,
      lotSize: 8000,
      yearBuilt: 2015,
    },
    description: 'Residencia familiar en urbanización privada con excelentes escuelas cercanas. Amplio jardín, terraza techada, y vecindario tranquilo. Perfecta para familias que buscan espacio y seguridad.',
    features: ['Jardín Amplio', 'Terraza Techada', 'Cuarto de Lavado', 'Closets Walk-in', 'Marquesina 2 autos'],
    amenities: ['Jardín', 'Parqueo', 'Cerca de Escuelas', 'Zona Segura', 'Control de Acceso'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800' },
    ],
    coordinates: { latitude: 18.3589, longitude: -66.1107 },
    agent: {
      name: 'Ana Martínez',
      email: 'ana@familyhomes-pr.com',
      phone: '787-555-0303',
      company: 'Family Homes PR',
    },
    listDate: '2025-01-05',
    modifiedDate: '2025-01-12',
  },
  {
    listingId: 'mock-4',
    mlsNumber: 'MLS-2025-004',
    status: 'active',
    price: 195000,
    address: {
      streetAddress: '321 Calle Universidad',
      city: 'San Juan',
      state: 'PR',
      zipCode: '00925',
      country: 'PR',
    },
    details: {
      propertyType: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 950,
      yearBuilt: 2010,
    },
    description: 'Apartamento moderno cerca de la UPR, ideal para inversión con alto potencial de renta. Zona en gentrificación con proyectos de renovación urbana próximos. Excelente oportunidad de valorización.',
    features: ['Remodelado', 'Cocina Moderna', 'Balcón', 'Laundry en el Piso', 'Internet incluido'],
    amenities: ['Cerca de UPR', 'Transporte Público', 'Área Comercial', 'Parqueo Visitantes'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800' },
    ],
    coordinates: { latitude: 18.4030, longitude: -66.0509 },
    agent: {
      name: 'José López',
      email: 'jose@investpr.com',
      phone: '787-555-0404',
      company: 'Investment Properties PR',
    },
    listDate: '2025-01-12',
    modifiedDate: '2025-01-16',
  },
  {
    listingId: 'mock-5',
    mlsNumber: 'MLS-2025-005',
    status: 'active',
    price: 850000,
    address: {
      streetAddress: '555 Ocean Drive',
      city: 'Rincón',
      state: 'PR',
      zipCode: '00677',
      country: 'PR',
    },
    details: {
      propertyType: 'House',
      bedrooms: 4,
      bathrooms: 4,
      squareFeet: 3500,
      lotSize: 12000,
      yearBuilt: 2022,
    },
    description: 'Casa de playa de ensueño en Rincón, la capital del surf de Puerto Rico. Diseño tropical moderno con materiales sostenibles, paneles solares, y acceso privado a la playa. Perfecta para retiro o Airbnb de lujo.',
    features: ['Paneles Solares', 'Diseño Sostenible', 'Acceso Playa', 'Cocina Exterior', 'Jacuzzi'],
    amenities: ['Frente a la Playa', 'Piscina', 'Terraza Sunset', 'Parqueo 4 autos', 'Generador Tesla'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
    ],
    virtualTour: 'https://tour.showcaseidx.com/mock-5',
    coordinates: { latitude: 18.3405, longitude: -67.2500 },
    agent: {
      name: 'Sofía Rodríguez',
      email: 'sofia@beachproperties-pr.com',
      phone: '787-555-0505',
      company: 'Beach Properties PR',
    },
    listDate: '2025-01-01',
    modifiedDate: '2025-01-15',
  },
]


