import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const propertyType = searchParams.get('propertyType')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Mock data for MVP
    const mockPredictions = [
      {
        id: '1',
        name: 'Dorado',
        city: 'Dorado',
        demandScore: 92,
        demandTrend: 'increasing',
        avgPrice: 450000,
        predictedGrowth1Y: 12,
        predictedGrowth3Y: 28,
        isHotZone: true,
        isUndervalued: true,
        migrationTrend: 'influx',
        fanbaseSentiment: 0.85,
        keyFactors: [
          'Expansión del corredor turístico',
          'Nuevo centro comercial en desarrollo',
          'Interés creciente de inversores internacionales'
        ]
      },
      {
        id: '2',
        name: 'Condado',
        city: 'San Juan',
        demandScore: 88,
        demandTrend: 'increasing',
        avgPrice: 680000,
        predictedGrowth1Y: 9,
        predictedGrowth3Y: 22,
        isHotZone: true,
        isUndervalued: false,
        migrationTrend: 'stable',
        fanbaseSentiment: 0.72,
        keyFactors: [
          'Vibrante vida nocturna',
          'Cerca de playas de prestigio',
          'Alta demanda de alquileres turísticos'
        ]
      },
      {
        id: '3',
        name: 'Río Piedras',
        city: 'San Juan',
        demandScore: 75,
        demandTrend: 'increasing',
        avgPrice: 220000,
        predictedGrowth1Y: 15,
        predictedGrowth3Y: 35,
        isHotZone: true,
        isUndervalued: true,
        migrationTrend: 'influx',
        fanbaseSentiment: 0.65,
        keyFactors: [
          'Cerca de la UPR',
          'Gentrificación en proceso',
          'Proyectos de renovación urbana'
        ]
      }
    ]

    let filteredPredictions = mockPredictions

    if (city) {
      filteredPredictions = filteredPredictions.filter(p =>
        p.city.toLowerCase().includes(city.toLowerCase())
      )
    }

    if (propertyType) {
      filteredPredictions = filteredPredictions.filter(p =>
        p.name.toLowerCase().includes(propertyType.toLowerCase())
      )
    }

    filteredPredictions = filteredPredictions.slice(0, limit)

    return NextResponse.json({
      success: true,
      predictions: filteredPredictions,
      meta: {
        total: mockPredictions.length,
        returned: filteredPredictions.length,
        city: city || 'all',
        propertyType: propertyType || 'all'
      }
    })
  } catch (error) {
    console.error('Error fetching demand predictions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch demand predictions'
      },
      { status: 500 }
    )
  }
}
