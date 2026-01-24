// AI Services - Dynamic Multi-Provider Support
// Uses the configured AI provider from admin settings

import { chatCompletion, createEmbedding, cosineSimilarity, SYSTEM_PROMPTS } from '@/lib/ai-client'

export interface LifestyleMatchProfile {
  idealLifeDescription: string
  priorities: string
  budget?: number
  location?: string
  preferredPropertyTypes?: string[]
}

export interface ViralContentRequest {
  contentType: 'post' | 'story' | 'video_script' | 'live_script'
  prompt: string
  targetAudience?: string
  platform?: string
}

export interface DemandAnalysisRequest {
  city: string
  timeRange: string
  propertyTypes?: string[]
}

export interface PropertyData {
  id: string
  title: string
  description: string
  address: string
  city: string
  amenities: string[]
  features: string[]
  price: number
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
}

// Suggested location extracted from lifestyle analysis
export interface SuggestedLocation {
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

// Lifestyle Profile Analysis Service
export async function analyzeLifestyleProfile(
  profile: LifestyleMatchProfile
): Promise<{
  keywords: string[]
  summary: string
  lifestyleType: string
  suggestedLocation?: SuggestedLocation
  embedding?: number[]
}> {
  const prompt = `
Analiza este perfil de estilo de vida para búsqueda de propiedades:

Descripción de vida ideal: "${profile.idealLifeDescription}"
Prioridades: ${profile.priorities}
Presupuesto: ${profile.budget ? `$${profile.budget.toLocaleString()}` : 'No especificado'}
Ubicación preferida por el usuario: ${profile.location || 'No especificada'}
Tipos de propiedad: ${profile.preferredPropertyTypes?.join(', ') || 'No especificados'}

Por favor:
1. Extrae las palabras clave más importantes (5-10)
2. Resume las preferencias principales (2-3 frases)
3. Identifica el tipo de estilo de vida (urbano, costero, familiar, rural, profesional, etc.)
4. IMPORTANTE: Extrae cualquier ubicación mencionada en la descripción de vida ideal.
   - Busca nombres de ciudades, estados, países, o regiones
   - Ejemplos: "Miami", "Texas", "Nueva York", "California", "Puerto Rico", "Florida"
   - Si no hay ubicación mencionada, devuelve null para suggestedLocation

Responde en formato JSON:
{
  "keywords": ["palabra1", "palabra2", ...],
  "summary": "resumen breve",
  "lifestyleType": "tipo de estilo de vida",
  "suggestedLocation": {
    "city": "nombre de ciudad o null",
    "state": "código de estado de 2 letras (ej: TX, FL, CA, NY) o nombre completo",
    "country": "US o código de país"
  }
}

NOTAS sobre suggestedLocation:
- Si el usuario menciona un estado como "Texas" o "Florida", ponlo en "state" con código de 2 letras (TX, FL)
- Si menciona una ciudad como "Miami" o "Austin", ponlo en "city" y el estado correspondiente en "state"
- Si no hay ubicación clara, devuelve null para suggestedLocation
- Prioriza la ubicación que el usuario menciona en su descripción de vida ideal
`

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPTS.lifestyleMatching },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.7, jsonMode: true }
    )

    const parsed = JSON.parse(response)

    // Create embedding for semantic matching
    const embeddingText = `${profile.idealLifeDescription} ${profile.priorities} ${parsed.keywords.join(' ')}`
    const embedding = await createEmbedding(embeddingText)

    // Parse suggested location
    let suggestedLocation: SuggestedLocation | undefined
    if (parsed.suggestedLocation && typeof parsed.suggestedLocation === 'object') {
      const loc = parsed.suggestedLocation
      // Only include if at least one field is present
      if (loc.city || loc.state || loc.country || loc.postalCode) {
        suggestedLocation = {
          city: loc.city || undefined,
          state: loc.state || undefined,
          country: loc.country || 'US',
          postalCode: loc.postalCode || undefined,
        }
      }
    }

    return {
      keywords: parsed.keywords || [],
      summary: parsed.summary || profile.idealLifeDescription.slice(0, 200),
      lifestyleType: parsed.lifestyleType || 'general',
      suggestedLocation,
      embedding
    }
  } catch (error) {
    console.error('Error analyzing lifestyle profile:', error)
    throw new Error('Failed to analyze lifestyle profile')
  }
}

// Property Matching Service
export async function matchPropertiesWithProfile(
  profile: LifestyleMatchProfile,
  properties: PropertyData[]
): Promise<{
  matches: Array<{
    propertyId: string
    matchScore: number
    matchReasons: string[]
    lifestyleFit: 'excellent' | 'good' | 'fair' | 'poor'
  }>
}> {
  const prompt = `
Analiza la compatibilidad entre este perfil de usuario y las siguientes propiedades.

PERFIL DEL USUARIO:
- Vida ideal: "${profile.idealLifeDescription}"
- Prioridades: ${profile.priorities}
- Presupuesto: ${profile.budget ? `$${profile.budget.toLocaleString()}` : 'Flexible'}
- Ubicación: ${profile.location || 'Cualquiera'}

PROPIEDADES DISPONIBLES:
${properties.map((p, i) => `
${i + 1}. ID: ${p.id}
   - Título: ${p.title}
   - Ubicación: ${p.address}, ${p.city}
   - Precio: $${p.price.toLocaleString()}
   - Habitaciones: ${p.bedrooms || 'N/A'}, Baños: ${p.bathrooms || 'N/A'}
   - Amenidades: ${p.amenities.slice(0, 5).join(', ')}
   - Descripción: ${p.description.slice(0, 200)}...
`).join('\n')}

Para cada propiedad, evalúa:
1. matchScore (0-100): Qué tan bien se adapta al estilo de vida del usuario
2. matchReasons: 3-5 razones específicas por las que esta propiedad es buena para este usuario
3. lifestyleFit: "excellent" (90+), "good" (70-89), "fair" (50-69), "poor" (<50)

Responde en formato JSON:
{
  "matches": [
    {
      "propertyId": "id",
      "matchScore": 95,
      "matchReasons": ["razón 1", "razón 2", ...],
      "lifestyleFit": "excellent"
    }
  ]
}
`

  try {
    console.log(`Matching ${properties.length} properties with AI...`)
    
    const response = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPTS.propertyMatching },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.6, maxTokens: 8000, jsonMode: true }
    )

    const parsed = JSON.parse(response)
    const matches = parsed.matches || []
    
    console.log(`AI returned ${matches.length} matches from ${properties.length} properties`)
    
    // Log distribution by source provider (from property ID prefix)
    const bySource: Record<string, number> = {}
    matches.forEach((m: { propertyId: string }) => {
      const source = m.propertyId.split('-')[0] || 'unknown'
      bySource[source] = (bySource[source] || 0) + 1
    })
    console.log('Matches by source:', bySource)
    
    return { matches }
  } catch (error) {
    console.error('Error matching properties:', error)
    throw new Error('Failed to match properties')
  }
}

// Viral Content Generation Service
export async function generateViralContent(
  request: ViralContentRequest
): Promise<{
  content: string
  hook: string
  hashtags: string[]
  viralScore: number
  tips: string[]
}> {
  const platformInstructions: Record<string, string> = {
    instagram: 'Usa emojis, hashtags, y un tono vibrante. Longitud: 150-300 caracteres.',
    facebook: 'Tono más profesional pero accesible. Incluye call-to-action claro.',
    tiktok: 'Corto, rápido, con hooks inmediatos. Menciona tendencias actuales.',
    youtube: 'Estructura clara con intro, contenido, y CTA. Longitud: 500-1000 palabras.',
    linkedin: 'Tono profesional. Incluye datos y insights de mercado.',
  }

  const typeInstructions: Record<string, string> = {
    post: 'Crea un post completo con introducción, puntos clave, y CTA.',
    story: 'Crea una secuencia de 3-4 stories con texto corto y emojis.',
    video_script: 'Crea un script de video corto (30-60 segundos) con indicaciones visuales.',
    live_script: 'Crea un guion completo para un live de 30 minutos con secciones y tiempos.',
  }

  const prompt = `
Genera contenido viral sobre: "${request.prompt}"

Tipo de contenido: ${request.contentType}
Plataforma: ${request.platform || 'instagram'}
Audiencia objetivo: ${request.targetAudience || 'Inversionistas inmobiliarios en Puerto Rico'}

Instrucciones específicas:
- Plataforma: ${platformInstructions[request.platform || 'instagram']}
- Tipo: ${typeInstructions[request.contentType]}

Genera contenido que:
1. Tenga un hook/encabezado irresistible
2. Proporcione valor único y práctico
3. Incluya estadísticas o datos relevantes del mercado
4. Tenga un call-to-action claro y específico
5. Sea optimizado para el algoritmo de la plataforma

Responde en formato JSON:
{
  "content": "contenido completo",
  "hook": "encabezado hook (primeras 10-15 palabras)",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "viralScore": 85,
  "tips": ["tip para maximizar engagement 1", "tip 2", ...]
}
`

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPTS.viralContent },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.8, maxTokens: 2000, jsonMode: true }
    )

    const parsed = JSON.parse(response)

    return {
      content: parsed.content || '',
      hook: parsed.hook || '',
      hashtags: parsed.hashtags || ['#BienesRaices', '#RealEstate', '#Inversion'],
      viralScore: parsed.viralScore || 70,
      tips: parsed.tips || []
    }
  } catch (error) {
    console.error('Error generating viral content:', error)
    throw new Error('Failed to generate viral content')
  }
}

// Demand Prediction Service
export async function analyzeDemand(
  request: DemandAnalysisRequest
): Promise<{
  demandScore: number
  trend: 'increasing' | 'stable' | 'decreasing'
  insights: string[]
  recommendations: string[]
  hotZones: Array<{
    name: string
    score: number
    reason: string
  }>
}> {
  const prompt = `
Analiza la demanda inmobiliaria para: ${request.city}

Contexto:
- Ubicación: ${request.city}, Puerto Rico/Latam
- Rango de tiempo: ${request.timeRange}
- Tipos de propiedad: ${request.propertyTypes?.join(', ') || 'Todos'}

Considera factores como:
- Tendencias actuales del mercado inmobiliario 2025
- Patrones de migración (especialmente desde EE.UU. a Puerto Rico)
- Desarrollo de infraestructura y proyectos gubernamentales
- Precios y disponibilidad de inventario
- Incentivos fiscales (Ley 60, etc.)
- Demanda de Airbnb y alquileres a corto plazo

Genera un análisis con:
1. Score de demanda (0-100)
2. Tendencia (increasing/stable/decreasing)
3. 3-5 insights clave sobre el mercado
4. 3 recomendaciones para inversores
5. Zonas hot dentro de la ciudad/región

Responde en formato JSON:
{
  "demandScore": 85,
  "trend": "increasing",
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "hotZones": [
    {"name": "zona1", "score": 90, "reason": "razón"}
  ]
}
`

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPTS.demandPrediction },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.6, maxTokens: 2000, jsonMode: true }
    )

    const parsed = JSON.parse(response)

    return {
      demandScore: parsed.demandScore || 50,
      trend: parsed.trend || 'stable',
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || [],
      hotZones: parsed.hotZones || []
    }
  } catch (error) {
    console.error('Error analyzing demand:', error)
    throw new Error('Failed to analyze demand')
  }
}

// Equity Forecast Service
export async function generateEquityForecast(
  property: PropertyData,
  currentValue: number
): Promise<{
  predictedValue1Y: number
  predictedValue3Y: number
  predictedValue5Y: number
  predictedValue10Y: number
  confidenceLevel: number
  remodelTips: Array<{
    improvement: string
    cost: number
    addedValue: number
    roi: number
  }>
  zoningInfo: string
  developmentOpportunities: string[]
}> {
  const prompt = `
Analiza y proyecta el valor de esta propiedad:

PROPIEDAD:
- Título: ${property.title}
- Ubicación: ${property.address}, ${property.city}
- Valor actual: $${currentValue.toLocaleString()}
- Tipo: ${property.bedrooms} hab, ${property.bathrooms} baños, ${property.squareFeet || 'N/A'} sqft
- Amenidades: ${property.amenities.join(', ')}
- Descripción: ${property.description.slice(0, 300)}

Genera proyecciones de plusvalía considerando:
- Tendencias del mercado en ${property.city}
- Desarrollo de infraestructura cercana
- Patrones históricos de valorización en PR
- Demanda de la zona
- Potencial de mejoras

Incluye también:
- Recomendaciones de remodelación con ROI estimado
- Información de zonificación
- Oportunidades de desarrollo

Responde en formato JSON:
{
  "predictedValue1Y": 520000,
  "predictedValue3Y": 580000,
  "predictedValue5Y": 680000,
  "predictedValue10Y": 850000,
  "confidenceLevel": 82,
  "remodelTips": [
    {"improvement": "Renovación de cocina", "cost": 25000, "addedValue": 45000, "roi": 80}
  ],
  "zoningInfo": "Residencial R-4, permite construcción de ADU",
  "developmentOpportunities": ["oportunidad 1", "oportunidad 2"]
}
`

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPTS.demandPrediction },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.6, maxTokens: 2000, jsonMode: true }
    )

    const parsed = JSON.parse(response)

    return {
      predictedValue1Y: parsed.predictedValue1Y || currentValue * 1.08,
      predictedValue3Y: parsed.predictedValue3Y || currentValue * 1.25,
      predictedValue5Y: parsed.predictedValue5Y || currentValue * 1.45,
      predictedValue10Y: parsed.predictedValue10Y || currentValue * 2,
      confidenceLevel: parsed.confidenceLevel || 75,
      remodelTips: parsed.remodelTips || [],
      zoningInfo: parsed.zoningInfo || 'No disponible',
      developmentOpportunities: parsed.developmentOpportunities || []
    }
  } catch (error) {
    console.error('Error generating equity forecast:', error)
    throw new Error('Failed to generate equity forecast')
  }
}

// Helper function to calculate semantic similarity between profiles
export async function calculateProfileSimilarity(
  profileEmbedding: number[],
  propertyEmbedding: number[]
): Promise<number> {
  return cosineSimilarity(profileEmbedding, propertyEmbedding)
}

// Create property embedding for matching
export async function createPropertyEmbedding(property: PropertyData): Promise<number[]> {
  const text = `
    ${property.title} ${property.description}
    Ubicación: ${property.city}, ${property.address}
    Amenidades: ${property.amenities.join(', ')}
    Características: ${property.features.join(', ')}
    ${property.bedrooms} habitaciones ${property.bathrooms} baños
  `
  return createEmbedding(text)
}


