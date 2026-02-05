import { NextRequest, NextResponse } from 'next/server'

// Nominatim API response types
interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  country?: string
  country_code?: string
  suburb?: string
  neighbourhood?: string
  road?: string
  postcode?: string
}

interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
  type: string
  class: string
  address?: NominatimAddress
  boundingbox?: string[]
}

export interface LocationSuggestion {
  id: string
  name: string
  fullName: string
  city?: string
  state?: string
  type?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

// Rate limiting: track last request time
let lastRequestTime = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Rate limiting: ensure at least 1 second between requests
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest))
    }
    lastRequestTime = Date.now()

    // Build Nominatim API URL - append "Puerto Rico" to query for better results
    // Note: Puerto Rico has country_code "us", not "pr", so we add it to the query
    const searchQuery = query.toLowerCase().includes('puerto rico') 
      ? query 
      : `${query}, Puerto Rico`
    
    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      limit: String(limit + 10), // Request more to filter
      addressdetails: '1',
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'Accept-Language': 'es',
          'User-Agent': 'SmarlinRealEstate/1.0 (https://smarlin.com)',
        },
      }
    )

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Error al buscar ubicaciones', suggestions: [] },
        { status: 500 }
      )
    }

    const allResults: NominatimResult[] = await response.json()
    
    // Filter to only Puerto Rico results
    const data = allResults.filter(result => {
      const address = result.address || {}
      return address.state === 'Puerto Rico' || 
             result.display_name.includes('Puerto Rico')
    })

    // Format results
    const suggestions: LocationSuggestion[] = data
      .map((result): LocationSuggestion => {
        const address = result.address || {}
        
        // Get the primary name
        const primaryName = address.city || address.town || address.village || 
                           address.municipality || address.suburb || 
                           address.neighbourhood || result.display_name.split(',')[0]
        
        // Build a cleaner display name
        const parts: string[] = []
        if (primaryName) parts.push(primaryName)
        if (address.municipality && address.municipality !== primaryName) {
          parts.push(address.municipality)
        }
        if (address.county && address.county !== primaryName && address.county !== address.municipality) {
          parts.push(address.county)
        }
        
        const fullName = parts.length > 0 ? parts.join(', ') : result.display_name

        return {
          id: `${result.osm_type}-${result.osm_id}`,
          name: primaryName || result.display_name.split(',')[0],
          fullName,
          city: address.city || address.town || address.municipality,
          state: address.state,
          type: result.type,
          coordinates: {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          },
        }
      })
      .slice(0, limit)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Geocode API error:', error)
    return NextResponse.json(
      { error: 'Error interno', suggestions: [] },
      { status: 500 }
    )
  }
}
