// AI Services - Dynamic Multi-Provider Support
// Uses the configured AI provider from admin settings

import { chatCompletion, createEmbedding, cosineSimilarity, SYSTEM_PROMPTS } from '@/lib/ai-client'

export interface LifestyleMatchProfile {
  idealLifeDescription: string
  priorities: string
  budget?: number
  location?: string
  preferredPropertyTypes?: string[]
  // Contextual fields for enriched matching
  purpose?: 'vivir' | 'retiro' | 'invertir' | 'negocio' | 'no_seguro'
  timeline?: 'inmediato' | 'pronto' | 'explorando'
  mainPriority?: 'tranquilidad' | 'social' | 'crecimiento' | 'estabilidad' | 'flexibilidad'
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
  // Contextual fields for enriched matching
  coordinates?: { latitude: number; longitude: number }
  neighborhood?: string
  mapArea?: string
  yearBuilt?: number
}

// Suggested location extracted from lifestyle analysis
export interface SuggestedLocation {
  city?: string
  state?: string
  country?: string
  postalCode?: string
  region?: 'puerto_rico' | 'us_mainland' | 'other'
}

// Lifestyle Profile Analysis Service
export async function analyzeLifestyleProfile(
  profile: LifestyleMatchProfile
): Promise<{
  keywords: string[]
  summary: string
  lifestyleType: string
  suggestedLocation?: SuggestedLocation  // Deprecated: use suggestedLocations instead
  suggestedLocations: SuggestedLocation[]  // Array of all detected locations
  embedding?: number[]
}> {
  const prompt = `
Analiza este perfil de estilo de vida para búsqueda de propiedades:

Descripción de vida ideal: "${profile.idealLifeDescription}"
Prioridades: ${profile.priorities}
Presupuesto: ${profile.budget ? `$${profile.budget.toLocaleString('en-US')}` : 'No especificado'}
Ubicación preferida por el usuario: ${profile.location || 'No especificada'}
Tipos de propiedad: ${profile.preferredPropertyTypes?.join(', ') || 'No especificados'}

Por favor:
1. Extrae las palabras clave más importantes (5-10)
2. Resume las preferencias principales (2-3 frases)
3. Identifica el tipo de estilo de vida (urbano, costero, familiar, rural, profesional, etc.)
4. IMPORTANTE: Extrae TODAS las ubicaciones mencionadas en la descripción de vida ideal.
   - Busca nombres de ciudades, estados, países, o regiones
   - El usuario puede mencionar MÚLTIPLES ubicaciones (ej: "Austin, Texas y también Puerto Rico")
   - Devuelve un array con TODAS las ubicaciones detectadas

Responde en formato JSON:
{
  "keywords": ["palabra1", "palabra2", ...],
  "summary": "resumen breve",
  "lifestyleType": "tipo de estilo de vida",
  "suggestedLocations": [
    {
      "city": "nombre de ciudad o null",
      "state": "código de estado de 2 letras (ej: TX, FL, CA, NY, PR)",
      "country": "US o PR",
      "region": "puerto_rico" o "us_mainland" o "other"
    }
  ]
}

NOTAS MUY IMPORTANTES sobre suggestedLocations:
- Devuelve un ARRAY con TODAS las ubicaciones mencionadas
- Si el usuario menciona "Austin, Texas y Aguadilla, Puerto Rico", devuelve DOS objetos en el array
- Para Puerto Rico: state="PR", country="PR", region="puerto_rico"
- Para ciudades de USA continental: region="us_mainland"
- Ciudades de Puerto Rico comunes: San Juan, Aguadilla, Rincón, Dorado, Guaynabo, Mayagüez, Ponce, Carolina, Bayamón, Caguas
- Si no hay ubicación clara, devuelve un array vacío []
- Incluye TODAS las ubicaciones, no solo la primera

Ejemplos:
- "Quiero vivir cerca del mar en Puerto Rico" -> [{"state": "PR", "country": "PR", "region": "puerto_rico"}]
- "Austin Texas o Miami Florida" -> [{"city": "Austin", "state": "TX", "region": "us_mainland"}, {"city": "Miami", "state": "FL", "region": "us_mainland"}]
- "Aguadilla PR y también Nueva York" -> [{"city": "Aguadilla", "state": "PR", "region": "puerto_rico"}, {"city": "New York", "state": "NY", "region": "us_mainland"}]
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

    // Parse suggested locations (array)
    const suggestedLocations: SuggestedLocation[] = []
    
    // Handle new array format
    if (Array.isArray(parsed.suggestedLocations)) {
      for (const loc of parsed.suggestedLocations) {
        if (loc && typeof loc === 'object' && (loc.city || loc.state || loc.country)) {
          suggestedLocations.push({
            city: loc.city || undefined,
            state: loc.state || undefined,
            country: loc.country || 'US',
            postalCode: loc.postalCode || undefined,
            region: loc.region || (loc.state === 'PR' ? 'puerto_rico' : 'us_mainland'),
          })
        }
      }
    }
    // Backward compatibility: handle old singular format
    else if (parsed.suggestedLocation && typeof parsed.suggestedLocation === 'object') {
      const loc = parsed.suggestedLocation
      if (loc.city || loc.state || loc.country || loc.postalCode) {
        suggestedLocations.push({
          city: loc.city || undefined,
          state: loc.state || undefined,
          country: loc.country || 'US',
          postalCode: loc.postalCode || undefined,
          region: loc.state === 'PR' ? 'puerto_rico' : 'us_mainland',
        })
      }
    }

    // First location for backward compatibility
    const suggestedLocation = suggestedLocations.length > 0 ? suggestedLocations[0] : undefined

    console.log(`AI extracted ${suggestedLocations.length} locations:`, suggestedLocations)

    return {
      keywords: parsed.keywords || [],
      summary: parsed.summary || profile.idealLifeDescription.slice(0, 200),
      lifestyleType: parsed.lifestyleType || 'general',
      suggestedLocation,  // Backward compatibility
      suggestedLocations,  // New array format
      embedding
    }
  } catch (error) {
    console.error('Error analyzing lifestyle profile:', error)
    throw new Error('Failed to analyze lifestyle profile')
  }
}

// Helper function to get purpose label in Spanish
function getPurposeLabel(purpose?: string): string {
  const labels: Record<string, string> = {
    'vivir': 'Vivir / Residencia principal',
    'retiro': 'Retiro / Jubilación',
    'invertir': 'Inversión inmobiliaria',
    'negocio': 'Establecer un negocio',
    'no_seguro': 'Explorando opciones',
  }
  return labels[purpose || ''] || 'No especificado'
}

// Helper function to get priority label in Spanish
function getPriorityLabel(priority?: string): string {
  const labels: Record<string, string> = {
    'tranquilidad': 'Tranquilidad y paz',
    'social': 'Cercanía y vida social',
    'crecimiento': 'Oportunidad de crecimiento',
    'estabilidad': 'Estabilidad a largo plazo',
    'flexibilidad': 'Flexibilidad',
  }
  return labels[priority || ''] || 'No especificada'
}

// Helper function to get timeline label in Spanish
function getTimelineLabel(timeline?: string): string {
  const labels: Record<string, string> = {
    'inmediato': 'Inmediato (0-3 meses)',
    'pronto': 'Pronto (3-6 meses)',
    'explorando': 'Explorando (6+ meses)',
  }
  return labels[timeline || ''] || 'No especificado'
}

// Helper function to get contextual instructions based on purpose and priority
function getContextualInstructions(purpose?: string, priority?: string): string {
  const instructions: string[] = []

  // Instructions based on purpose
  if (purpose === 'invertir') {
    instructions.push(`
INSTRUCCIONES PARA INVERSIÓN:
- Menciona el potencial de valorización del área
- Indica si es zona con alta demanda de alquiler (turístico o largo plazo)
- Menciona si hay desarrollos o proyectos cercanos que aumenten valor
- Indica si el precio por pie cuadrado es competitivo para el área
- Evalúa el ROI potencial basado en alquileres del mercado`)
  }

  if (purpose === 'vivir' || purpose === 'retiro') {
    instructions.push(`
INSTRUCCIONES PARA RESIDENCIA:
- Evalúa la tranquilidad y seguridad del área
- Menciona si es comunidad cerrada (gated community)
- Si hay riesgos conocidos (zonas inundables, ruido, tráfico), mencionarlos claramente
- Evalúa acceso a servicios médicos si es para retiro`)
  }

  if (purpose === 'negocio') {
    instructions.push(`
INSTRUCCIONES PARA NEGOCIO:
- Evalúa el flujo de tráfico y visibilidad comercial
- Menciona cercanía a centros comerciales o zonas de alto tráfico
- Indica si la zona es comercial o residencial`)
  }

  // Instructions based on priority
  if (priority === 'social') {
    instructions.push(`
INSTRUCCIONES PARA CERCANÍA SOCIAL:
- Menciona cercanías ESPECÍFICAS con nombres:
  * Escuelas cercanas (ej: "Cerca del Colegio San Ignacio", "A 10 min del Colegio Nuestra Señora")
  * Centros comerciales (ej: "A 5 min de Plaza Las Américas", "Cerca de Plaza Carolina")
  * Supermercados (ej: "Walmart a 3 min", "Pueblo Supermarket cercano")
  * Hospitales (ej: "Hospital Auxilio Mutuo a 10 min")
  * Restaurantes y vida nocturna si aplica`)
  }

  if (priority === 'tranquilidad') {
    instructions.push(`
INSTRUCCIONES PARA TRANQUILIDAD:
- Evalúa si es zona residencial tranquila
- Menciona si hay comunidad cerrada (gated)
- Indica distancia de zonas ruidosas o comerciales
- Evalúa privacidad y densidad de vecinos`)
  }

  if (priority === 'crecimiento') {
    instructions.push(`
INSTRUCCIONES PARA CRECIMIENTO:
- Evalúa proyección de valorización del área
- Menciona desarrollos urbanos o proyectos planificados
- Indica tendencia de precios en la zona`)
  }

  // Always include Puerto Rico context
  instructions.push(`
INFORMACIÓN CONTEXTUAL DE PUERTO RICO (usar si aplica):
- Zonas conocidas por riesgo de inundación: Loíza, partes bajas de Carolina, Río Piedras bajo, Cataño, Caimito
- Zonas premium/alto valor: Condado, Ocean Park, Dorado Beach, Palmas del Mar, Guaynabo
- Zonas con alta demanda turística: Isla Verde, Condado, Rincón, Vieques, Culebra
- Zonas familiares tranquilas: Guaynabo, Trujillo Alto, Caguas
- Si la propiedad está en zona con riesgo de inundación conocido, SIEMPRE mencionarlo
- Menciona escuelas, centros comerciales u hospitales cercanos si conoces la zona`)

  return instructions.join('\n')
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
  // Get contextual labels and instructions
  const purposeLabel = getPurposeLabel(profile.purpose)
  const priorityLabel = getPriorityLabel(profile.mainPriority)
  const timelineLabel = getTimelineLabel(profile.timeline)
  const contextualInstructions = getContextualInstructions(profile.purpose, profile.mainPriority)

  const prompt = `
Analiza la compatibilidad entre este perfil de usuario y las siguientes propiedades.

PERFIL DEL USUARIO:
- Vida ideal: "${profile.idealLifeDescription}"
- Propósito: ${purposeLabel}
- Prioridad principal: ${priorityLabel}
- Timeline de compra: ${timelineLabel}
- Prioridades adicionales: ${profile.priorities || 'No especificadas'}
- Presupuesto: ${profile.budget ? `$${profile.budget.toLocaleString('en-US')}` : 'Flexible'}
- Ubicación preferida: ${profile.location || 'Cualquiera en Puerto Rico'}

${contextualInstructions}

PROPIEDADES DISPONIBLES:
${properties.map((p, i) => `
${i + 1}. ID: ${p.id}
   - Título: ${p.title}
   - Ubicación: ${p.address}, ${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ''}
   - Precio: $${p.price.toLocaleString('en-US')}
   - Habitaciones: ${p.bedrooms || 'N/A'}, Baños: ${p.bathrooms || 'N/A'}
   - Pies cuadrados: ${p.squareFeet || 'N/A'}
   - Año construcción: ${p.yearBuilt || 'N/A'}
   - Amenidades: ${p.amenities.slice(0, 8).join(', ')}
   - Descripción: ${p.description.slice(0, 300)}...
`).join('\n')}

INSTRUCCIONES DE EVALUACIÓN:
1. matchScore (0-100): Qué tan bien se adapta al estilo de vida Y propósito del usuario
2. matchReasons: 4-6 razones ESPECÍFICAS y CONTEXTUALES:
   - Sé específico: menciona nombres de lugares, distancias, características concretas
   - Si es para inversión, menciona datos de ROI o demanda
   - Si es para vivir, menciona calidad de vida y cercanías
   - Si hay riesgos (inundación, ruido), mencionarlos como advertencia
   - Incluye al menos una razón sobre la ubicación/vecindario
3. lifestyleFit: "excellent" (90+), "good" (70-89), "fair" (50-69), "poor" (<50)

Responde en formato JSON:
{
  "matches": [
    {
      "propertyId": "id",
      "matchScore": 95,
      "matchReasons": ["razón específica 1", "razón específica 2", ...],
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
- Valor actual: $${currentValue.toLocaleString('en-US')}
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


