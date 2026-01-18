// Dynamic AI Client
// Reads configuration from Supabase and creates the appropriate AI client

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

// Cached clients
let cachedConfig: AIClientConfig | null = null
let openaiClient: OpenAI | null = null
let anthropicClient: Anthropic | null = null
let googleClient: GoogleGenerativeAI | null = null

// Get active AI config from environment (fallback) or cached DB config
export function getActiveConfig(): AIClientConfig | null {
  // If we have cached config from DB, use it
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
    }
  }

  return null
}

// Set config from database (called by API routes after fetching from Supabase)
export function setActiveConfig(config: AIClientConfig) {
  cachedConfig = config
  // Clear cached clients so they're recreated with new config
  openaiClient = null
  anthropicClient = null
  googleClient = null
}

// Clear cached config
export function clearConfigCache() {
  cachedConfig = null
  openaiClient = null
  anthropicClient = null
  googleClient = null
}

// Load AI configuration from Supabase database
// This function uses the admin client to bypass RLS and read the active AI config
export async function loadAIConfigFromDatabase(): Promise<AIClientConfig | null> {
  // If we already have cached config, return it
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    const supabase = createAdminClient()
    
    // Get the active AI provider
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (error || !data) {
      console.warn('No active AI provider found in database, falling back to env vars')
      return getActiveConfig() // Falls back to env vars
    }

    if (!data.api_key) {
      console.warn('Active AI provider has no API key configured')
      return getActiveConfig() // Falls back to env vars
    }

    // Create the config and cache it
    const config: AIClientConfig = {
      provider: data.provider as AIProvider,
      apiKey: data.api_key,
      models: data.models || {},
      config: data.config || {},
    }

    setActiveConfig(config)
    return config
  } catch (error) {
    console.error('Error loading AI config from database:', error)
    // Fall back to environment variables
    return getActiveConfig()
  }
}

// Ensure AI config is loaded before making API calls
export async function ensureAIConfig(): Promise<void> {
  if (!cachedConfig) {
    await loadAIConfigFromDatabase()
  }
}

// Get OpenAI client
function getOpenAIClient(apiKey: string, baseUrl?: string): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    })
  }
  return openaiClient
}

// Get Anthropic client
function getAnthropicClient(apiKey: string): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey,
    })
  }
  return anthropicClient
}

// Get Google AI client
function getGoogleClient(apiKey: string): GoogleGenerativeAI {
  if (!googleClient) {
    googleClient = new GoogleGenerativeAI(apiKey)
  }
  return googleClient
}

// Unified chat completion function
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const config = getActiveConfig()
  
  if (!config) {
    throw new Error('No AI provider configured. Please configure an AI provider in admin settings.')
  }

  const task = options.task || 'chat'
  const model = options.model || config.models[task] || config.models.chat
  const providerConfig = AI_PROVIDERS[config.provider]

  switch (config.provider) {
    case 'openai':
    case 'groq': {
      // Groq uses OpenAI-compatible API
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
      
      // Separate system message from user messages
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
      
      // Combine messages into a single prompt
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

// Create embeddings (only supported by some providers)
export async function createEmbedding(text: string): Promise<number[]> {
  const config = getActiveConfig()
  
  if (!config) {
    throw new Error('No AI provider configured')
  }

  const providerConfig = AI_PROVIDERS[config.provider]
  
  if (!providerConfig.supportsEmbeddings) {
    throw new Error(`Provider ${config.provider} does not support embeddings`)
  }

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
    const response = await chatCompletion(
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

  propertyMatching: `Eres un asesor inmobiliario experto que conecta personas con sus hogares ideales.
Evalúas la compatibilidad entre el estilo de vida de un usuario y las propiedades disponibles.
Consideras factores prácticos y emocionales en tus recomendaciones.
Responde siempre en español de forma clara y estructurada.`,
}

