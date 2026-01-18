// AI Providers Configuration
// Defines all supported AI providers, their models, and capabilities

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq'

export type AITaskType = 'chat' | 'embedding' | 'analysis' | 'content'

export interface AIModel {
  id: string
  name: string
  description: string
  contextWindow: number
  supportsJson?: boolean
  supportsVision?: boolean
  costPer1kTokens?: number // in USD
}

export interface AIProviderConfig {
  id: AIProvider
  name: string
  description: string
  website: string
  docsUrl: string
  apiKeyPrefix: string // e.g., "sk-" for OpenAI
  apiKeyPlaceholder: string
  baseUrl: string
  models: Record<AITaskType, AIModel[]>
  defaultModels: Record<AITaskType, string>
  supportsEmbeddings: boolean
  supportsStreaming: boolean
}

// All supported AI providers
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4 Turbo y modelos de embeddings de última generación',
    website: 'https://openai.com',
    docsUrl: 'https://platform.openai.com/docs',
    apiKeyPrefix: 'sk-',
    apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.openai.com/v1',
    supportsEmbeddings: true,
    supportsStreaming: true,
    models: {
      chat: [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Modelo más capaz y rápido', contextWindow: 128000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.005 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Versión económica de GPT-4o', contextWindow: 128000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.00015 },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'GPT-4 optimizado para velocidad', contextWindow: 128000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.01 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Rápido y económico', contextWindow: 16385, supportsJson: true, costPer1kTokens: 0.0005 },
      ],
      embedding: [
        { id: 'text-embedding-3-large', name: 'Embedding 3 Large', description: 'Embeddings de alta dimensión', contextWindow: 8191, costPer1kTokens: 0.00013 },
        { id: 'text-embedding-3-small', name: 'Embedding 3 Small', description: 'Embeddings eficientes', contextWindow: 8191, costPer1kTokens: 0.00002 },
      ],
      analysis: [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Mejor para análisis complejos', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.005 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Análisis rápido y económico', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.00015 },
      ],
      content: [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Ideal para generación de contenido', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.005 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Contenido rápido y económico', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.00015 },
      ],
    },
    defaultModels: {
      chat: 'gpt-4o',
      embedding: 'text-embedding-3-small',
      analysis: 'gpt-4o',
      content: 'gpt-4o',
    },
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Claude 3.5 Sonnet y Claude 3 Opus - modelos seguros y capaces',
    website: 'https://anthropic.com',
    docsUrl: 'https://docs.anthropic.com',
    apiKeyPrefix: 'sk-ant-',
    apiKeyPlaceholder: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.anthropic.com',
    supportsEmbeddings: false,
    supportsStreaming: true,
    models: {
      chat: [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'El más inteligente de Anthropic', contextWindow: 200000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.003 },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Rápido y económico', contextWindow: 200000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.0008 },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Máximo rendimiento', contextWindow: 200000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.015 },
      ],
      embedding: [],
      analysis: [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Excelente para análisis', contextWindow: 200000, supportsJson: true, costPer1kTokens: 0.003 },
      ],
      content: [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Ideal para contenido creativo', contextWindow: 200000, supportsJson: true, costPer1kTokens: 0.003 },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Contenido rápido', contextWindow: 200000, supportsJson: true, costPer1kTokens: 0.0008 },
      ],
    },
    defaultModels: {
      chat: 'claude-3-5-sonnet-20241022',
      embedding: '',
      analysis: 'claude-3-5-sonnet-20241022',
      content: 'claude-3-5-sonnet-20241022',
    },
  },
  google: {
    id: 'google',
    name: 'Google AI (Gemini)',
    description: 'Gemini Pro y Flash - modelos multimodales de Google',
    website: 'https://ai.google.dev',
    docsUrl: 'https://ai.google.dev/docs',
    apiKeyPrefix: 'AI',
    apiKeyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    supportsEmbeddings: true,
    supportsStreaming: true,
    models: {
      chat: [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Modelo más capaz de Google', contextWindow: 2000000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.00125 },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Rápido y eficiente', contextWindow: 1000000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.000075 },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Última versión experimental', contextWindow: 1000000, supportsJson: true, supportsVision: true, costPer1kTokens: 0.0001 },
      ],
      embedding: [
        { id: 'text-embedding-004', name: 'Text Embedding 004', description: 'Embeddings de Google', contextWindow: 2048, costPer1kTokens: 0.00001 },
      ],
      analysis: [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Análisis con contexto largo', contextWindow: 2000000, supportsJson: true, costPer1kTokens: 0.00125 },
      ],
      content: [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Generación rápida', contextWindow: 1000000, supportsJson: true, costPer1kTokens: 0.000075 },
      ],
    },
    defaultModels: {
      chat: 'gemini-1.5-pro',
      embedding: 'text-embedding-004',
      analysis: 'gemini-1.5-pro',
      content: 'gemini-1.5-flash',
    },
  },
  groq: {
    id: 'groq',
    name: 'Groq (Fast Inference)',
    description: 'Inferencia ultrarrápida con modelos Llama y Mixtral',
    website: 'https://groq.com',
    docsUrl: 'https://console.groq.com/docs',
    apiKeyPrefix: 'gsk_',
    apiKeyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.groq.com/openai/v1',
    supportsEmbeddings: false,
    supportsStreaming: true,
    models: {
      chat: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Modelo grande y versátil', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.00059 },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Ultra rápido', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.00005 },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Modelo MoE eficiente', contextWindow: 32768, supportsJson: true, costPer1kTokens: 0.00024 },
      ],
      embedding: [],
      analysis: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Análisis rápido', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.00059 },
      ],
      content: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Contenido rápido', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.00059 },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Ultra rápido', contextWindow: 128000, supportsJson: true, costPer1kTokens: 0.00005 },
      ],
    },
    defaultModels: {
      chat: 'llama-3.3-70b-versatile',
      embedding: '',
      analysis: 'llama-3.3-70b-versatile',
      content: 'llama-3.3-70b-versatile',
    },
  },
}

// Get all provider IDs
export const getAllProviderIds = (): AIProvider[] => {
  return Object.keys(AI_PROVIDERS) as AIProvider[]
}

// Get provider config
export const getProviderConfig = (providerId: AIProvider): AIProviderConfig | undefined => {
  return AI_PROVIDERS[providerId]
}

// Get models for a specific task
export const getModelsForTask = (providerId: AIProvider, task: AITaskType): AIModel[] => {
  const provider = AI_PROVIDERS[providerId]
  return provider?.models[task] || []
}

// Validate API key format
export const validateApiKeyFormat = (providerId: AIProvider, apiKey: string): boolean => {
  const provider = AI_PROVIDERS[providerId]
  if (!provider) return false
  return apiKey.startsWith(provider.apiKeyPrefix) && apiKey.length > 20
}

// Mask API key for display
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 12) return '••••••••'
  return `${apiKey.slice(0, 7)}••••${apiKey.slice(-4)}`
}

// Task types with metadata
export const AI_TASKS: Record<AITaskType, { name: string; description: string; icon: string }> = {
  chat: {
    name: 'Chat / Conversación',
    description: 'Interacciones generales y respuestas conversacionales',
    icon: 'MessageSquare',
  },
  embedding: {
    name: 'Embeddings',
    description: 'Vectorización de texto para búsqueda semántica',
    icon: 'Layers',
  },
  analysis: {
    name: 'Análisis',
    description: 'Análisis de datos, predicciones y evaluaciones',
    icon: 'BarChart3',
  },
  content: {
    name: 'Generación de Contenido',
    description: 'Creación de textos, posts y material de marketing',
    icon: 'Sparkles',
  },
}

