// Property Data Providers Configuration
// Defines all supported property data providers for real estate listings

import { Home, Building, MapPin, Globe } from 'lucide-react'

export type PropertyProvider = 'showcase_idx' | 'zillow_bridge' | 'realtor_rapidapi'

export interface PropertyProviderField {
  key: string
  label: string
  type: 'text' | 'password' | 'select'
  required: boolean
  placeholder?: string
  description?: string
  options?: { value: string; label: string }[]
}

export interface PropertyProviderConfig {
  id: PropertyProvider
  name: string
  description: string
  website: string
  docsUrl: string
  icon: typeof Home
  baseUrl: string
  fields: PropertyProviderField[]
  supportedRegions: string[]
  features: string[]
}

// Common property search parameters across all providers
export interface PropertySearchParams {
  city?: string
  state?: string
  zipCode?: string
  minPrice?: number
  maxPrice?: number
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  minSquareFeet?: number
  maxSquareFeet?: number
  status?: 'active' | 'pending' | 'sold'
  limit?: number
  offset?: number
  sortBy?: 'price' | 'listDate' | 'squareFeet'
  sortOrder?: 'asc' | 'desc'
}

// Normalized property format from any provider
export interface NormalizedProperty {
  id: string
  sourceProvider: PropertyProvider
  externalId: string
  mlsNumber?: string
  title: string
  description: string
  price: number
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  details: {
    propertyType: string
    bedrooms: number
    bathrooms: number
    squareFeet: number
    lotSize?: number
    yearBuilt?: number
  }
  features: string[]
  amenities: string[]
  images: string[]
  virtualTourUrl?: string
  videoUrl?: string
  agent?: {
    name: string
    email?: string
    phone?: string
    company?: string
  }
  listDate: string
  modifiedDate: string
  status: 'active' | 'pending' | 'sold' | 'off_market'
}

export interface PropertySearchResponse {
  success: boolean
  properties: NormalizedProperty[]
  total: number
  limit: number
  offset: number
  provider: PropertyProvider
  error?: string
}

// All supported property providers
export const PROPERTY_PROVIDERS: Record<PropertyProvider, PropertyProviderConfig> = {
  showcase_idx: {
    id: 'showcase_idx',
    name: 'Showcase IDX',
    description: 'Acceso directo a datos MLS con integración IDX. Ideal para agentes y brokers con membresía MLS.',
    website: 'https://showcaseidx.com',
    docsUrl: 'https://showcaseidx.com/docs/api',
    icon: Home,
    baseUrl: 'https://api.showcaseidx.com/v2',
    supportedRegions: ['US', 'CA'],
    features: [
      'Datos MLS en tiempo real',
      'Fotos de alta resolución',
      'Tours virtuales',
      'Información de agentes',
      'Historial de precios',
    ],
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-xxxxxxxxxxxxxxxx',
        description: 'Obtén tu API key desde el dashboard de Showcase IDX',
      },
    ],
  },
  zillow_bridge: {
    id: 'zillow_bridge',
    name: 'Zillow (Bridge Data Output)',
    description: 'Acceso a datos de Zillow y múltiples MLS a través de Bridge Data Output. Requiere suscripción a MLS específico.',
    website: 'https://www.zillowgroup.com/developers/',
    docsUrl: 'https://bridgedataoutput.com/docs/platform/',
    icon: Building,
    baseUrl: 'https://api.bridgedataoutput.com/api/v2',
    supportedRegions: ['US'],
    features: [
      'Datos de Zillow y múltiples MLS',
      'Zestimates (estimaciones de valor)',
      'Datos de vecindarios',
      'Historial de ventas',
      'Datos demográficos',
    ],
    fields: [
      {
        key: 'api_key',
        label: 'Access Token',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        description: 'Token de acceso de Bridge Data Output',
      },
      {
        key: 'server_token',
        label: 'Server Token',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        description: 'Token del servidor para autenticación',
      },
      {
        key: 'dataset',
        label: 'Dataset (MLS)',
        type: 'text',
        required: true,
        placeholder: 'test, actris, crmls...',
        description: 'Identificador del MLS al que tienes acceso',
      },
    ],
  },
  realtor_rapidapi: {
    id: 'realtor_rapidapi',
    name: 'Realtor.com (RapidAPI)',
    description: 'Acceso a datos de Realtor.com a través de RapidAPI. Datos actualizados de propiedades en venta y alquiler en todo Estados Unidos.',
    website: 'https://rapidapi.com/apidojo/api/realtor',
    docsUrl: 'https://rapidapi.com/apidojo/api/realtor/details',
    icon: Globe,
    baseUrl: 'https://realtor-data1.p.rapidapi.com',
    supportedRegions: ['US'],
    features: [
      'Propiedades en venta y alquiler',
      'Datos de Realtor.com actualizados',
      'Autocompletado de ubicaciones',
      'Detalles completos de propiedades',
      'Fotos de alta resolución',
      'Información de agentes',
    ],
    fields: [
      {
        key: 'rapidapi_key',
        label: 'RapidAPI Key',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Tu API Key de RapidAPI para acceder a Realtor Data',
      },
    ],
  },
}

// Get all provider IDs
export const getAllProviderIds = (): PropertyProvider[] => {
  return Object.keys(PROPERTY_PROVIDERS) as PropertyProvider[]
}

// Get provider config
export const getProviderConfig = (providerId: PropertyProvider): PropertyProviderConfig | undefined => {
  return PROPERTY_PROVIDERS[providerId]
}

// Mask sensitive values for display
export const maskApiKey = (value: string): string => {
  if (!value || value.length < 12) return '••••••••'
  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}

// Property type mappings for normalization
export const PROPERTY_TYPE_MAP: Record<string, string> = {
  'single family': 'house',
  'single-family': 'house',
  'singlefamily': 'house',
  'house': 'house',
  'condo': 'condo',
  'condominium': 'condo',
  'apartment': 'apartment',
  'townhouse': 'townhouse',
  'townhome': 'townhouse',
  'multi-family': 'multi_family',
  'multifamily': 'multi_family',
  'land': 'land',
  'lot': 'land',
  'commercial': 'commercial',
}

// Normalize property type from various providers
export const normalizePropertyType = (type: string): string => {
  const normalized = type.toLowerCase().trim()
  return PROPERTY_TYPE_MAP[normalized] || normalized
}

