// Property Client Factory
// Provides unified access to property data from multiple providers
// Reads configuration from database and instantiates appropriate clients

import { createClient } from '@/lib/supabase/server'
import { 
  type PropertyProvider, 
  type PropertySearchParams, 
  type PropertySearchResponse,
  type NormalizedProperty,
  PROPERTY_PROVIDERS 
} from '@/config/property-providers'
import { createShowcaseIDXClient, MOCK_IDX_PROPERTIES, ShowcaseIDXClient } from '@/services/showcase-idx/client'
import { createZillowBridgeClient, ZillowBridgeClient } from '@/services/zillow-bridge/client'
import { createRealtorRapidAPIClient } from '@/services/realtor-rapidapi/client'

// Database type for provider settings
interface ProviderSettings {
  id: string
  provider_key: PropertyProvider
  name: string
  enabled: boolean
  api_key: string | null
  api_secret: string | null
  additional_config: Record<string, string> | null
  priority: number
}

// Unified property provider interface
interface PropertyProviderClient {
  searchNormalized(params: PropertySearchParams): Promise<PropertySearchResponse>
  testConnection(): Promise<{ success: boolean; message: string }>
}

// Get provider settings from database
async function getProviderSettings(): Promise<ProviderSettings[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('property_provider_settings')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching provider settings:', error)
      return []
    }

    return (data || []) as ProviderSettings[]
  } catch (error) {
    console.error('Error in getProviderSettings:', error)
    return []
  }
}

// Get all provider settings (including disabled) for admin
export async function getAllProviderSettings(): Promise<ProviderSettings[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('property_provider_settings')
      .select('*')
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching all provider settings:', error)
      return []
    }

    return (data || []) as ProviderSettings[]
  } catch (error) {
    console.error('Error in getAllProviderSettings:', error)
    return []
  }
}

// Create a provider client from settings
function createProviderClient(settings: ProviderSettings): PropertyProviderClient | null {
  if (!settings.api_key) {
    console.warn(`Provider ${settings.provider_key} has no API key configured`)
    return null
  }

  switch (settings.provider_key) {
    case 'showcase_idx':
      return createShowcaseIDXClient({ apiKey: settings.api_key })
    
    case 'zillow_bridge':
      // Check for server_token in api_secret column OR in additional_config (fallback)
      const serverToken = settings.api_secret || settings.additional_config?.server_token
      if (!serverToken || !settings.additional_config?.dataset) {
        console.warn('Zillow Bridge requires server_token and dataset configuration')
        return null
      }
      return createZillowBridgeClient({
        accessToken: settings.api_key,
        serverToken: serverToken,
        dataset: settings.additional_config.dataset,
      })
    
    case 'realtor_rapidapi':
      // Get RapidAPI key from api_key or additional_config
      const rapidApiKey = settings.api_key || settings.additional_config?.rapidapi_key
      if (!rapidApiKey) {
        console.warn('Realtor RapidAPI requires rapidapi_key configuration')
        return null
      }
      return createRealtorRapidAPIClient({
        rapidApiKey: rapidApiKey,
      })
    
    default:
      console.warn(`Unknown provider: ${settings.provider_key}`)
      return null
  }
}

// Get all active provider clients
export async function getActivePropertyClients(): Promise<{
  clients: Array<{ provider: PropertyProvider; client: PropertyProviderClient }>
  providers: PropertyProvider[]
}> {
  const settings = await getProviderSettings()
  
  const clients: Array<{ provider: PropertyProvider; client: PropertyProviderClient }> = []
  
  for (const setting of settings) {
    const client = createProviderClient(setting)
    if (client) {
      clients.push({ provider: setting.provider_key, client })
    }
  }

  return {
    clients,
    providers: clients.map(c => c.provider),
  }
}

// Search properties across all active providers
export async function searchPropertiesFromProviders(
  params: PropertySearchParams
): Promise<{
  success: boolean
  properties: NormalizedProperty[]
  totalByProvider: Record<string, number>
  errors: Record<string, string>
  providersQueried: PropertyProvider[]
}> {
  const { clients } = await getActivePropertyClients()
  
  if (clients.length === 0) {
    return {
      success: false,
      properties: [],
      totalByProvider: {},
      errors: { general: 'No hay proveedores de propiedades configurados o activos' },
      providersQueried: [],
    }
  }

  const results = await Promise.allSettled(
    clients.map(async ({ provider, client }) => {
      const response = await client.searchNormalized(params)
      return { provider, response }
    })
  )

  const allProperties: NormalizedProperty[] = []
  const totalByProvider: Record<string, number> = {}
  const errors: Record<string, string> = {}
  const providersQueried: PropertyProvider[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { provider, response } = result.value
      providersQueried.push(provider)
      
      if (response.success) {
        allProperties.push(...response.properties)
        totalByProvider[provider] = response.total
      } else {
        errors[provider] = response.error || 'Unknown error'
      }
    } else {
      // Promise rejected
      console.error('Provider search failed:', result.reason)
    }
  }

  // Sort by price (could be made configurable)
  allProperties.sort((a, b) => {
    if (params.sortBy === 'price') {
      return params.sortOrder === 'asc' ? a.price - b.price : b.price - a.price
    }
    // Default: newest first
    return new Date(b.listDate).getTime() - new Date(a.listDate).getTime()
  })

  return {
    success: allProperties.length > 0 || Object.keys(errors).length === 0,
    properties: allProperties,
    totalByProvider,
    errors,
    providersQueried,
  }
}

// Test connection for a specific provider
export async function testProviderConnection(
  providerKey: PropertyProvider,
  config: {
    apiKey: string
    apiSecret?: string
    additionalConfig?: Record<string, string>
  }
): Promise<{ success: boolean; message: string }> {
  let client: PropertyProviderClient | null = null

  switch (providerKey) {
    case 'showcase_idx':
      client = createShowcaseIDXClient({ apiKey: config.apiKey })
      break
    
    case 'zillow_bridge':
      if (!config.apiSecret || !config.additionalConfig?.dataset) {
        return {
          success: false,
          message: 'Falta server_token o dataset para Zillow Bridge',
        }
      }
      client = createZillowBridgeClient({
        accessToken: config.apiKey,
        serverToken: config.apiSecret,
        dataset: config.additionalConfig.dataset,
      })
      break
    
    case 'realtor_rapidapi':
      if (!config.apiKey) {
        return {
          success: false,
          message: 'Falta RapidAPI Key para Realtor.com',
        }
      }
      client = createRealtorRapidAPIClient({
        rapidApiKey: config.apiKey,
      })
      break
    
    default:
      return {
        success: false,
        message: `Proveedor desconocido: ${providerKey}`,
      }
  }

  if (!client) {
    return {
      success: false,
      message: 'No se pudo crear el cliente',
    }
  }

  return client.testConnection()
}

// Get mock/demo properties when no providers are configured
// This is useful for development and demo purposes
export function getMockProperties(): NormalizedProperty[] {
  const showcaseClient = new ShowcaseIDXClient()
  return MOCK_IDX_PROPERTIES.map(p => showcaseClient.transformToNormalized(p))
}

// Check if any providers are configured
export async function hasActiveProviders(): Promise<boolean> {
  const settings = await getProviderSettings()
  return settings.some(s => s.enabled && s.api_key)
}

// Get provider status summary for admin dashboard
export async function getProviderStatusSummary(): Promise<{
  totalProviders: number
  activeProviders: number
  providers: Array<{
    key: PropertyProvider
    name: string
    enabled: boolean
    configured: boolean
    lastSync?: string
  }>
}> {
  const settings = await getAllProviderSettings()
  
  const providers = Object.keys(PROPERTY_PROVIDERS).map(key => {
    const providerKey = key as PropertyProvider
    const setting = settings.find(s => s.provider_key === providerKey)
    const providerConfig = PROPERTY_PROVIDERS[providerKey]
    
    return {
      key: providerKey,
      name: providerConfig.name,
      enabled: setting?.enabled ?? false,
      configured: !!(setting?.api_key),
      lastSync: undefined, // Could be populated from setting.last_sync_at
    }
  })

  return {
    totalProviders: providers.length,
    activeProviders: providers.filter(p => p.enabled && p.configured).length,
    providers,
  }
}

