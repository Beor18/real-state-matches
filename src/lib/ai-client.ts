// Dynamic AI Client - Multi-Provider Support
// Reads configuration from Supabase and creates the appropriate AI clients
// Supports querying multiple providers in parallel and synthesizing responses

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_PROVIDERS, AIProvider, AITaskType } from '@/config/ai-providers'
import { createAdminClient } from '@/lib/supabase/server'

export interface AIClientConfig {
  provider: AIProvider
  apiKey: string
  models: Record<string, string>
  config: Record<string, unknown>
  isPrimary?: boolean
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  task?: AITaskType
}

interface ProviderResponse {
  provider: AIProvider
  providerName: string
  response: string
}

// Cached clients (keyed by provider for multi-provider support)
let cachedConfigs: AIClientConfig[] | null = null
let cachedPrimaryConfig: AIClientConfig | null = null
let openaiClients: Map<string, OpenAI> = new Map()
let anthropicClients: Map<string, Anthropic> = new Map()
let googleClients: Map<string, GoogleGenerativeAI> = new Map()

// Legacy single-config cache for backward compatibility
let cachedConfig: AIClientConfig | null = null

// Get active AI config from environment (fallback) or cached DB config
// Returns the primary config (or the first active one)
export function getActiveConfig(): AIClientConfig | null {
  // If we have cached primary config from DB, use it
  if (cachedPrimaryConfig) {
    return cachedPrimaryConfig
  }

  // If we have cached configs, return the primary or first one
  if (cachedConfigs && cachedConfigs.length > 0) {
    const primary = cachedConfigs.find(c => c.isPrimary)
    return primary || cachedConfigs[0]
  }

  // Legacy single config cache
  if (cachedConfig) {
    return cachedConfig
  }

  // Fallback to environment variables
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      models: {
        chat: 'gpt-4o',
        embedding: 'text-embedding-3-small',
        analysis: 'gpt-4o',
        content: 'gpt-4o',
      },
      config: {},
      isPrimary: true,
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: {
        chat: 'claude-3-5-sonnet-20241022',
        analysis: 'claude-3-5-sonnet-20241022',
        content: 'claude-3-5-sonnet-20241022',
      },
      config: {},
      isPrimary: true,
    }
  }

  return null
}

// Set config from database (called by API routes after fetching from Supabase)
// Legacy single-config setter for backward compatibility (used in test connection)
export function setActiveConfig(config: AIClientConfig) {
  cachedConfig = config
  cachedPrimaryConfig = config
}

// Clear all cached configs and clients
export function clearConfigCache() {
  cachedConfig = null
  cachedConfigs = null
  cachedPrimaryConfig = null
  openaiClients.clear()
  anthropicClients.clear()
  googleClients.clear()
}

// Load ALL active AI configurations from Supabase database
export async function loadAllActiveConfigs(): Promise<AIClientConfig[]> {
  if (cachedConfigs) {
    return cachedConfigs
  }

  try {
    const supabase = createAdminClient()

    // Get ALL active AI providers
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('is_active', true)
      .order('is_primary', { ascending: false }) // primary first

    if (error || !data || data.length === 0) {
      console.warn('No active AI providers found in database, falling back to env vars')
      const fallback = getActiveConfig()
      return fallback ? [fallback] : []
    }

    const configs: AIClientConfig[] = data
      .filter(d => d.api_key) // Only include providers with API keys
      .map(d => ({
        provider: d.provider as AIProvider,
        apiKey: d.api_key,
        models: d.models || {},
        config: d.config || {},
        isPrimary: d.is_primary || false,
      }))

    if (configs.length === 0) {
      console.warn('Active AI providers have no API keys configured')
      const fallback = getActiveConfig()
      return fallback ? [fallback] : []
    }

    // Ensure at least one is marked as primary
    if (!configs.some(c => c.isPrimary)) {
      configs[0].isPrimary = true
    }

    cachedConfigs = configs
    cachedPrimaryConfig = configs.find(c => c.isPrimary) || configs[0]

    return configs
  } catch (error) {
    console.error('Error loading AI configs from database:', error)
    const fallback = getActiveConfig()
    return fallback ? [fallback] : []
  }
}

// Load single AI configuration (legacy, loads primary or first active)
export async function loadAIConfigFromDatabase(): Promise<AIClientConfig | null> {
  const configs = await loadAllActiveConfigs()
  if (configs.length === 0) return null
  const primary = configs.find(c => c.isPrimary) || configs[0]
  cachedConfig = primary
  return primary
}

// Ensure AI config is loaded before making API calls
export async function ensureAIConfig(): Promise<void> {
  if (!cachedConfigs) {
    await loadAllActiveConfigs()
  }
}

// Get OpenAI client (keyed by provider to support multiple instances like openai + groq)
function getOpenAIClient(apiKey: string, baseUrl?: string): OpenAI {
  const key = `${apiKey}-${baseUrl || 'default'}`
  let client = openaiClients.get(key)
  if (!client) {
    client = new OpenAI({ apiKey, baseURL: baseUrl })
    openaiClients.set(key, client)
  }
  return client
}

// Get Anthropic client
function getAnthropicClient(apiKey: string): Anthropic {
  let client = anthropicClients.get(apiKey)
  if (!client) {
    client = new Anthropic({ apiKey })
    anthropicClients.set(apiKey, client)
  }
  return client
}

// Get Google AI client
function getGoogleClient(apiKey: string): GoogleGenerativeAI {
  let client = googleClients.get(apiKey)
  if (!client) {
    client = new GoogleGenerativeAI(apiKey)
    googleClients.set(apiKey, client)
  }
  return client
}

// Execute chat completion with a SPECIFIC provider config
export async function chatCompletionWithProvider(
  config: AIClientConfig,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const task = options.task || 'chat'
  const model = options.model || config.models[task] || config.models.chat

  switch (config.provider) {
    case 'openai':
    case 'groq': {
      const baseUrl = config.provider === 'groq'
        ? 'https://api.groq.com/openai/v1'
        : (config.config.baseUrl as string | undefined)

      const client = getOpenAIClient(config.apiKey, baseUrl)

      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      })

      return response.choices[0]?.message?.content || ''
    }

    case 'anthropic': {
      const client = getAnthropicClient(config.apiKey)

      const systemMessage = messages.find(m => m.role === 'system')?.content || ''
      const userMessages = messages.filter(m => m.role !== 'system')

      const response = await client.messages.create({
        model,
        max_tokens: options.maxTokens ?? 2000,
        system: systemMessage,
        messages: userMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      })

      const textBlock = response.content.find(c => c.type === 'text')
      return textBlock?.type === 'text' ? textBlock.text : ''
    }

    case 'google': {
      const client = getGoogleClient(config.apiKey)
      const genModel = client.getGenerativeModel({ model })

      const systemMessage = messages.find(m => m.role === 'system')?.content || ''
      const conversation = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n')

      const fullPrompt = systemMessage
        ? `${systemMessage}\n\n${conversation}`
        : conversation

      const result = await genModel.generateContent(fullPrompt)
      return result.response.text()
    }

    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}

// Synthesize multiple provider responses into one using the primary provider
async function synthesizeResponses(
  primaryConfig: AIClientConfig,
  providerResponses: ProviderResponse[],
  originalMessages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const originalQuery = originalMessages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n')

  const isJsonMode = options.jsonMode === true

  const responsesText = providerResponses
    .map((r, i) => `--- Respuesta de ${r.providerName} ---\n${r.response}`)
    .join('\n\n')

  const synthesisPrompt = isJsonMode
    ? `Tienes las siguientes respuestas de diferentes modelos de IA a la misma consulta. 
Tu tarea es sintetizar UNA SOLA respuesta JSON que combine los mejores elementos, datos más precisos, y detalles más completos de todas las respuestas.

CONSULTA ORIGINAL:
${originalQuery}

RESPUESTAS DE LOS MODELOS:
${responsesText}

INSTRUCCIONES:
- Combina los mejores insights y datos de cada respuesta
- Si hay datos numéricos diferentes, usa el promedio o el más conservador
- Si hay información contradictoria, prioriza la más detallada y específica
- Mantén EXACTAMENTE el mismo formato JSON que las respuestas originales
- NO agregues campos nuevos al JSON, usa la misma estructura
- Responde SOLO con el JSON final, sin explicaciones adicionales`
    : `Tienes las siguientes respuestas de diferentes modelos de IA a la misma consulta.
Tu tarea es sintetizar UNA SOLA respuesta que combine los mejores elementos, datos más precisos, y detalles más completos de todas las respuestas.

CONSULTA ORIGINAL:
${originalQuery}

RESPUESTAS DE LOS MODELOS:
${responsesText}

INSTRUCCIONES:
- Combina los mejores insights de cada respuesta
- Elimina redundancias pero conserva todos los detalles únicos valiosos
- Si hay información contradictoria, prioriza la más detallada y específica
- Mantén el mismo formato y estilo que las respuestas originales
- Responde en español`

  const systemPrompt = originalMessages.find(m => m.role === 'system')?.content || ''

  return chatCompletionWithProvider(
    primaryConfig,
    [
      { role: 'system', content: systemPrompt ? `${systemPrompt}\n\nAdemás, eres un sintetizador experto que combina respuestas de múltiples IAs.` : 'Eres un sintetizador experto que combina respuestas de múltiples IAs para generar la mejor respuesta posible.' },
      { role: 'user', content: synthesisPrompt },
    ],
    {
      ...options,
      maxTokens: (options.maxTokens ?? 2000) + 1000, // Extra tokens for synthesis
    }
  )
}

// Multi-provider chat completion: queries all active providers and synthesizes
export async function chatCompletionMulti(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const configs = await loadAllActiveConfigs()

  if (configs.length === 0) {
    throw new Error('No AI provider configured. Please configure an AI provider in admin settings.')
  }

  // If only 1 provider active, use it directly (no synthesis needed)
  if (configs.length === 1) {
    return chatCompletionWithProvider(configs[0], messages, options)
  }

  // Query ALL active providers in parallel
  console.log(`[Multi-AI] Querying ${configs.length} providers in parallel: ${configs.map(c => c.provider).join(', ')}`)

  const results = await Promise.allSettled(
    configs.map(async (config) => {
      const providerName = AI_PROVIDERS[config.provider]?.name || config.provider
      try {
        const response = await chatCompletionWithProvider(config, messages, options)
        return { provider: config.provider, providerName, response } as ProviderResponse
      } catch (error) {
        console.error(`[Multi-AI] Provider ${providerName} failed:`, error)
        throw error
      }
    })
  )

  // Collect successful responses
  const successfulResponses: ProviderResponse[] = results
    .filter((r): r is PromiseFulfilledResult<ProviderResponse> => r.status === 'fulfilled')
    .map(r => r.value)

  const failedProviders = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')

  console.log(`[Multi-AI] ${successfulResponses.length} succeeded, ${failedProviders.length} failed`)

  if (successfulResponses.length === 0) {
    throw new Error('All AI providers failed. Please check your API keys and provider configurations.')
  }

  // If only one succeeded, return it directly
  if (successfulResponses.length === 1) {
    console.log(`[Multi-AI] Only 1 response available, returning directly from ${successfulResponses[0].providerName}`)
    return successfulResponses[0].response
  }

  // Find the primary config for synthesis
  const primaryConfig = configs.find(c => c.isPrimary) || configs[0]
  console.log(`[Multi-AI] Synthesizing ${successfulResponses.length} responses using ${AI_PROVIDERS[primaryConfig.provider]?.name || primaryConfig.provider}`)

  return synthesizeResponses(primaryConfig, successfulResponses, messages, options)
}

// Unified chat completion function (single provider - backward compatible)
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const config = getActiveConfig()

  if (!config) {
    throw new Error('No AI provider configured. Please configure an AI provider in admin settings.')
  }

  return chatCompletionWithProvider(config, messages, options)
}

// Create embeddings (only supported by some providers - uses primary provider only)
export async function createEmbedding(text: string): Promise<number[]> {
  // Always use primary config for embeddings (can't merge embeddings from different models)
  const configs = await loadAllActiveConfigs()
  const config = configs.find(c => c.isPrimary) || configs[0] || getActiveConfig()

  if (!config) {
    throw new Error('No AI provider configured')
  }

  const providerConfig = AI_PROVIDERS[config.provider]

  if (!providerConfig.supportsEmbeddings) {
    // Try to find any active provider that supports embeddings
    const embeddingProvider = configs.find(c => AI_PROVIDERS[c.provider]?.supportsEmbeddings)
    if (embeddingProvider) {
      return createEmbeddingWithProvider(embeddingProvider, text)
    }
    throw new Error(`No active provider supports embeddings. Enable OpenAI or Google.`)
  }

  return createEmbeddingWithProvider(config, text)
}

// Create embedding with a specific provider
async function createEmbeddingWithProvider(config: AIClientConfig, text: string): Promise<number[]> {
  switch (config.provider) {
    case 'openai': {
      const client = getOpenAIClient(config.apiKey)
      const model = config.models.embedding || 'text-embedding-3-small'

      const response = await client.embeddings.create({
        model,
        input: text,
      })

      return response.data[0].embedding
    }

    case 'google': {
      const client = getGoogleClient(config.apiKey)
      const model = client.getGenerativeModel({ model: config.models.embedding || 'text-embedding-004' })

      const result = await model.embedContent(text)
      return result.embedding.values
    }

    default:
      throw new Error(`Embeddings not supported for provider: ${config.provider}`)
  }
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Test connection to the configured provider
export async function testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
  const config = getActiveConfig()

  if (!config) {
    return { success: false, message: 'No AI provider configured' }
  }

  const startTime = Date.now()

  try {
    const response = await chatCompletionWithProvider(
      config,
      [{ role: 'user', content: 'Say "Hello" in Spanish. Reply with just the word.' }],
      { maxTokens: 10, temperature: 0 }
    )

    const latency = Date.now() - startTime

    if (response.toLowerCase().includes('hola')) {
      return { success: true, message: `Connected to ${AI_PROVIDERS[config.provider].name}`, latency }
    }

    return { success: true, message: `Response received from ${AI_PROVIDERS[config.provider].name}`, latency }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: `Connection failed: ${message}` }
  }
}

// System prompts for different tasks (can be customized per provider)
export const SYSTEM_PROMPTS = {
  lifestyleMatching: `Eres un experto en bienes raíces en Puerto Rico y Latinoamérica. 
Tu objetivo es analizar el estilo de vida ideal de un usuario y encontrar propiedades que se adapten perfectamente a su visión de vida.
Considera factores como: ubicación, amenidades, estilo de vida, presupuesto, y preferencias personales.
Responde siempre en español y de forma empática.`,

  demandPrediction: `Eres un analista experto en el mercado inmobiliario de Puerto Rico y Latinoamérica.
Analizas tendencias de demanda, patrones de migración, y factores socioeconómicos para predecir zonas de alta demanda.
Proporciona análisis basados en datos y tendencias actuales del mercado 2025.
Responde siempre en español con datos concretos.`,

  viralContent: `Eres un experto en marketing inmobiliario y redes sociales.
Creas contenido viral y atractivo para agentes de bienes raíces en Puerto Rico y Latinoamérica.
Tu contenido genera engagement, leads y ventas.
Conoces las tendencias de TikTok, Instagram y Facebook para el mercado hispano.`,

  equityForecast: `Eres un analista financiero especializado en valoración de propiedades.
Proyectas el valor futuro de propiedades basándote en tendencias del mercado, ubicación, y mejoras potenciales.
Proporcionas recomendaciones de remodelación con ROI calculado.
Responde siempre en español con proyecciones conservadoras y realistas.`,

  propertyMatching: `Eres un asesor inmobiliario experto en Puerto Rico que conecta personas con sus hogares ideales.
Evalúas la compatibilidad entre el estilo de vida, propósito y prioridades del usuario con las propiedades disponibles.

PRINCIPIOS DE EVALUACIÓN:
1. Considera el PROPÓSITO del usuario (vivir, invertir, retiro, negocio) para enfocar las recomendaciones
2. Si el propósito es INVERTIR, enfatiza ROI, demanda de alquiler, y potencial de valorización
3. Si el propósito es VIVIR o RETIRO, enfatiza calidad de vida, seguridad, y cercanías
4. SIEMPRE menciona riesgos conocidos (zonas inundables, ruido, etc.) como advertencia
5. Sé ESPECÍFICO con nombres de lugares: escuelas, centros comerciales, hospitales cercanos
6. Conoces bien Puerto Rico: zonas, barrios, y sus características

CONOCIMIENTO DE PUERTO RICO:
- Zonas de riesgo de inundación: Loíza, Cataño, partes de Carolina, Río Piedras bajo
- Zonas premium: Condado, Ocean Park, Dorado, Guaynabo
- Zonas turísticas: Isla Verde, Rincón, Vieques
- Zonas familiares: Guaynabo, Trujillo Alto, Caguas

Responde siempre en español con razones específicas y contextuales.`,
}
