import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('propertyId')

    // Mock data for MVP
    const mockForecast = {
      id: propertyId || '1',
      title: 'Villa Costera Moderna',
      address: 'Calle del Sol, Dorado',
      currentValue: 485000,
      predictedValue1Y: 543200,
      predictedValue3Y: 620800,
      predictedValue5Y: 783500,
      predictedValue10Y: 1242000,
      confidence: 87,
      equityData: [
        { year: 'Ahora', propertyValue: 485000, equity: 339500, loanBalance: 145500 },
        { year: 'Año 1', propertyValue: 543200, equity: 380240, loanBalance: 162960 },
        { year: 'Año 3', propertyValue: 620800, equity: 434560, loanBalance: 186240 },
        { year: 'Año 5', propertyValue: 783500, equity: 548450, loanBalance: 235050 },
        { year: 'Año 10', propertyValue: 1242000, equity: 869400, loanBalance: 372600 }
      ],
      remodelTips: [
        {
          name: 'Instalación de Piscina Infinita',
          description: 'Piscina infinita con vista al mar, aumentará significativamente el valor de la propiedad en zona turística',
          estimatedCost: 85000,
          estimatedRoi: 120,
          priority: 'high',
          timeframe: '6-8 meses'
        },
        {
          name: 'Renovación de Cocina Gourmet',
          description: 'Cocina de lujo con isleta central y electrodomésticos de alta gama',
          estimatedCost: 45000,
          estimatedRoi: 85,
          priority: 'medium',
          timeframe: '3-4 meses'
        },
        {
          name: 'Sistema de Energía Solar',
          description: 'Paneles solares completos con batería de respaldo',
          estimatedCost: 25000,
          estimatedRoi: 95,
          priority: 'medium',
          timeframe: '2-3 meses'
        }
      ],
      zoningInfo: {
        currentZone: 'Residencial R-2',
        allowedUses: ['Vivienda unifamiliar', 'Vivienda bifamiliar', 'Bed & Breakfast'],
        developmentOpportunities: [
          'Posibilidad de convertir a B&B con permisos',
          'Densificación permitida hasta 2 unidades',
          'Alojamiento turístico con licencia municipal'
        ],
        restrictions: [
          'Altura máxima de 2 pisos',
          'Distancia mínima de 3 metros del límite',
          'No permite uso comercial mayor'
        ]
      }
    }

    return NextResponse.json({
      success: true,
      forecast: mockForecast,
      meta: {
        generatedAt: new Date().toISOString(),
        propertyId: propertyId || 'default'
      }
    })
  } catch (error) {
    console.error('Error fetching equity forecast:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch equity forecast'
      },
      { status: 500 }
    )
  }
}
