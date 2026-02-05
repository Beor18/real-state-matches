/**
 * Property Enrichment Service
 * 
 * This service is designed to enrich property data with additional contextual information.
 * Currently uses known data about Puerto Rico areas.
 * 
 * FUTURE INTEGRATIONS:
 * - Google Places API for nearby schools, commercial centers, hospitals
 * - FEMA Flood Maps API for flood zone information
 * - Census data for demographic information
 * - Real estate market data for investment metrics
 */

// Types for enriched property data
export interface FloodZoneInfo {
  isFloodZone: boolean
  riskLevel: 'high' | 'moderate' | 'low' | 'unknown'
  source: 'fema' | 'local' | 'inferred'
  notes?: string
}

export interface NearbyPlace {
  name: string
  type: 'school' | 'mall' | 'supermarket' | 'hospital' | 'restaurant' | 'beach' | 'park'
  distance?: number // in miles
  subtype?: string // e.g., 'elementary', 'high school', etc.
}

export interface InvestmentMetrics {
  pricePerSqFt: number
  areaAveragePricePerSqFt?: number
  demandScore?: number // 0-100
  appreciationPotential: 'high' | 'moderate' | 'low' | 'unknown'
  rentalDemand?: 'high' | 'moderate' | 'low'
  notes?: string
}

export interface AreaCharacteristics {
  type: 'urban' | 'suburban' | 'rural' | 'coastal' | 'tourist' | 'mixed'
  safety: 'high' | 'moderate' | 'low' | 'unknown'
  trafficLevel: 'high' | 'moderate' | 'low' | 'unknown'
  walkability: 'high' | 'moderate' | 'low' | 'unknown'
}

export interface EnrichedPropertyData {
  floodZone?: FloodZoneInfo
  nearbySchools?: NearbyPlace[]
  nearbyCommercial?: NearbyPlace[]
  nearbyHealthcare?: NearbyPlace[]
  investmentMetrics?: InvestmentMetrics
  areaCharacteristics?: AreaCharacteristics
}

// Known data about Puerto Rico areas
const PR_FLOOD_ZONES: Record<string, { risk: 'high' | 'moderate' | 'low'; notes: string }> = {
  'loiza': { risk: 'high', notes: 'Zona costera con historial de inundaciones' },
  'loíza': { risk: 'high', notes: 'Zona costera con historial de inundaciones' },
  'cataño': { risk: 'high', notes: 'Zona baja cerca de la bahía' },
  'catano': { risk: 'high', notes: 'Zona baja cerca de la bahía' },
  'canovanas': { risk: 'moderate', notes: 'Algunas áreas bajas propensas a inundación' },
  'canóvanas': { risk: 'moderate', notes: 'Algunas áreas bajas propensas a inundación' },
  'fajardo': { risk: 'moderate', notes: 'Zonas costeras con riesgo moderado' },
  'rio piedras': { risk: 'moderate', notes: 'Áreas bajas cerca del río' },
  'río piedras': { risk: 'moderate', notes: 'Áreas bajas cerca del río' },
  'caimito': { risk: 'moderate', notes: 'Zona con historial de inundaciones' },
}

const PR_PREMIUM_AREAS = [
  'condado', 'ocean park', 'dorado', 'dorado beach', 
  'palmas del mar', 'guaynabo', 'miramar', 'viejo san juan'
]

const PR_TOURIST_AREAS = [
  'isla verde', 'condado', 'rincon', 'rincón', 'vieques', 
  'culebra', 'luquillo', 'fajardo', 'ocean park'
]

const PR_FAMILY_AREAS = [
  'guaynabo', 'trujillo alto', 'caguas', 'bayamon', 'bayamón',
  'carolina', 'toa baja', 'toa alta', 'dorado'
]

// Known commercial centers by area
const PR_COMMERCIAL_CENTERS: Record<string, NearbyPlace[]> = {
  'san juan': [
    { name: 'Plaza Las Américas', type: 'mall' },
    { name: 'Mall of San Juan', type: 'mall' },
  ],
  'carolina': [
    { name: 'Plaza Carolina', type: 'mall' },
    { name: 'Los Colobos Mall', type: 'mall' },
  ],
  'bayamon': [
    { name: 'Plaza del Sol', type: 'mall' },
    { name: 'Walmart Bayamón', type: 'supermarket' },
  ],
  'bayamón': [
    { name: 'Plaza del Sol', type: 'mall' },
    { name: 'Walmart Bayamón', type: 'supermarket' },
  ],
  'guaynabo': [
    { name: 'San Patricio Plaza', type: 'mall' },
    { name: 'Plaza Guaynabo', type: 'mall' },
  ],
  'caguas': [
    { name: 'Las Catalinas Mall', type: 'mall' },
    { name: 'Plaza Centro Caguas', type: 'mall' },
  ],
  'ponce': [
    { name: 'Plaza del Caribe', type: 'mall' },
    { name: 'Plaza Las Delicias', type: 'mall' },
  ],
  'mayaguez': [
    { name: 'Mayagüez Mall', type: 'mall' },
  ],
  'mayagüez': [
    { name: 'Mayagüez Mall', type: 'mall' },
  ],
}

// Known hospitals by area
const PR_HOSPITALS: Record<string, NearbyPlace[]> = {
  'san juan': [
    { name: 'Hospital Auxilio Mutuo', type: 'hospital' },
    { name: 'Centro Médico', type: 'hospital' },
    { name: 'Hospital Pavía Santurce', type: 'hospital' },
  ],
  'carolina': [
    { name: 'Hospital HIMA San Pablo Carolina', type: 'hospital' },
  ],
  'bayamon': [
    { name: 'Hospital HIMA San Pablo Bayamón', type: 'hospital' },
    { name: 'Hospital Menonita Caguas', type: 'hospital' },
  ],
  'caguas': [
    { name: 'Hospital HIMA San Pablo Caguas', type: 'hospital' },
  ],
  'ponce': [
    { name: 'Hospital Damas', type: 'hospital' },
    { name: 'Hospital San Cristóbal', type: 'hospital' },
  ],
}

/**
 * Infer contextual data from location
 * This is the current implementation using known PR data
 */
function inferContextFromLocation(
  city: string, 
  neighborhood?: string
): EnrichedPropertyData {
  const cityLower = city.toLowerCase().trim()
  const neighborhoodLower = neighborhood?.toLowerCase().trim() || ''
  const result: EnrichedPropertyData = {}

  // Check flood zone
  const floodInfo = PR_FLOOD_ZONES[cityLower] || PR_FLOOD_ZONES[neighborhoodLower]
  if (floodInfo) {
    result.floodZone = {
      isFloodZone: floodInfo.risk !== 'low',
      riskLevel: floodInfo.risk,
      source: 'inferred',
      notes: floodInfo.notes,
    }
  }

  // Get nearby commercial centers
  const commercialCenters = PR_COMMERCIAL_CENTERS[cityLower]
  if (commercialCenters) {
    result.nearbyCommercial = commercialCenters
  }

  // Get nearby hospitals
  const hospitals = PR_HOSPITALS[cityLower]
  if (hospitals) {
    result.nearbyHealthcare = hospitals
  }

  // Determine area characteristics
  const isPremium = PR_PREMIUM_AREAS.some(area => 
    cityLower.includes(area) || neighborhoodLower.includes(area)
  )
  const isTourist = PR_TOURIST_AREAS.some(area => 
    cityLower.includes(area) || neighborhoodLower.includes(area)
  )
  const isFamily = PR_FAMILY_AREAS.some(area => 
    cityLower.includes(area) || neighborhoodLower.includes(area)
  )

  if (isPremium || isTourist || isFamily) {
    result.areaCharacteristics = {
      type: isTourist ? 'tourist' : isPremium ? 'urban' : 'suburban',
      safety: isPremium || isFamily ? 'high' : 'moderate',
      trafficLevel: isPremium || isTourist ? 'high' : 'moderate',
      walkability: isPremium || isTourist ? 'high' : 'moderate',
    }
  }

  // Investment metrics for tourist areas
  if (isTourist) {
    result.investmentMetrics = {
      pricePerSqFt: 0, // Will be calculated from actual data
      appreciationPotential: 'high',
      rentalDemand: 'high',
      notes: 'Alta demanda de alquiler vacacional',
    }
  } else if (isPremium) {
    result.investmentMetrics = {
      pricePerSqFt: 0,
      appreciationPotential: 'moderate',
      rentalDemand: 'moderate',
      notes: 'Zona premium con valores estables',
    }
  }

  return result
}

/**
 * Enrich property data with contextual information
 * 
 * @param city - City name
 * @param neighborhood - Optional neighborhood name
 * @param coordinates - Optional coordinates for future API integration
 * @returns Enriched property data
 */
export async function enrichPropertyData(
  city: string,
  neighborhood?: string,
  coordinates?: { latitude: number; longitude: number }
): Promise<EnrichedPropertyData> {
  // TODO: When APIs are integrated, use coordinates to fetch real data
  // For now, use inferred data from known PR information
  
  if (coordinates) {
    // Future: Call Google Places API, FEMA API, etc.
    console.log(`[Property Enrichment] Coordinates available: ${coordinates.latitude}, ${coordinates.longitude}`)
    console.log('[Property Enrichment] TODO: Integrate with external APIs for real data')
  }

  return inferContextFromLocation(city, neighborhood)
}

/**
 * Check if a location is in a known flood zone
 */
export function isFloodZone(city: string, neighborhood?: string): boolean {
  const cityLower = city.toLowerCase().trim()
  const neighborhoodLower = neighborhood?.toLowerCase().trim() || ''
  
  return !!(PR_FLOOD_ZONES[cityLower] || PR_FLOOD_ZONES[neighborhoodLower])
}

/**
 * Get flood zone risk level
 */
export function getFloodRisk(city: string, neighborhood?: string): 'high' | 'moderate' | 'low' | 'unknown' {
  const cityLower = city.toLowerCase().trim()
  const neighborhoodLower = neighborhood?.toLowerCase().trim() || ''
  
  const info = PR_FLOOD_ZONES[cityLower] || PR_FLOOD_ZONES[neighborhoodLower]
  return info?.risk || 'unknown'
}

/**
 * Check if an area is premium/high value
 */
export function isPremiumArea(city: string, neighborhood?: string): boolean {
  const cityLower = city.toLowerCase().trim()
  const neighborhoodLower = neighborhood?.toLowerCase().trim() || ''
  
  return PR_PREMIUM_AREAS.some(area => 
    cityLower.includes(area) || neighborhoodLower.includes(area)
  )
}

/**
 * Check if an area has high tourist demand
 */
export function isTouristArea(city: string, neighborhood?: string): boolean {
  const cityLower = city.toLowerCase().trim()
  const neighborhoodLower = neighborhood?.toLowerCase().trim() || ''
  
  return PR_TOURIST_AREAS.some(area => 
    cityLower.includes(area) || neighborhoodLower.includes(area)
  )
}

export default {
  enrichPropertyData,
  isFloodZone,
  getFloodRisk,
  isPremiumArea,
  isTouristArea,
}
