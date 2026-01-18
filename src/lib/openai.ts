import OpenAI from 'openai'

// OpenAI client singleton
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// Default model configurations
export const AI_MODELS = {
  chat: 'gpt-4o',
  chatFast: 'gpt-4o-mini',
  embedding: 'text-embedding-3-small',
} as const

// System prompts for different AI features
export const SYSTEM_PROMPTS = {
  lifestyleAnalysis: `Eres un experto en análisis de estilos de vida para bienes raíces en Puerto Rico y Latinoamérica. 
Tu objetivo es ayudar a los usuarios a encontrar propiedades que se adapten perfectamente a su estilo de vida ideal.
Analiza las descripciones de los usuarios para extraer preferencias clave, prioridades y características deseadas.
Siempre responde en español y en formato JSON cuando se te solicite.`,

  viralContent: `Eres un experto en marketing inmobiliario y creación de contenido viral para redes sociales.
Especializado en el mercado de Puerto Rico y Latinoamérica.
Creas contenido que genera engagement, con hooks irresistibles y call-to-actions efectivos.
Conoces las mejores prácticas de cada plataforma (Instagram, TikTok, Facebook, YouTube, LinkedIn).
Siempre responde en español.`,

  demandPrediction: `Eres un analista experto en mercados inmobiliarios de Puerto Rico y Latinoamérica.
Analizas tendencias de demanda, patrones migratorios, desarrollo de infraestructura y sentimiento del mercado.
Proporcionas predicciones basadas en datos y razones claras para tus análisis.
Siempre responde en español y en formato JSON cuando se te solicite.`,

  propertyMatching: `Eres un experto en matching de propiedades basado en estilos de vida.
Analizas las características de las propiedades y las comparas con los perfiles de usuarios.
Proporcionas scores de compatibilidad y razones detalladas para cada match.
Siempre responde en español y en formato JSON cuando se te solicite.`,
} as const

// Helper type for chat messages
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Generic chat completion helper
export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
  } = {}
): Promise<string> {
  const client = getOpenAIClient()
  
  const response = await client.chat.completions.create({
    model: options.model || AI_MODELS.chat,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2000,
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
  })

  return response.choices[0]?.message?.content || ''
}

// Create embeddings for text
export async function createEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient()
  
  const response = await client.embeddings.create({
    model: AI_MODELS.embedding,
    input: text,
  })

  return response.data[0]?.embedding || []
}

// Calculate cosine similarity between two embedding vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
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


