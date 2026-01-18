import { NextRequest, NextResponse } from 'next/server'
import { analyzeDemand } from '@/services/ai/openai-services'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') || 'San Juan'
    const timeRange = searchParams.get('timeRange') || '1 año'
    const propertyTypes = searchParams.get('propertyTypes')?.split(',') || []

    // Analyze demand using OpenAI
    const demandAnalysis = await analyzeDemand({
      city,
      timeRange,
      propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
    })

    return NextResponse.json({
      success: true,
      analysis: {
        city,
        timeRange,
        demandScore: demandAnalysis.demandScore,
        trend: demandAnalysis.trend,
        insights: demandAnalysis.insights,
        recommendations: demandAnalysis.recommendations,
        hotZones: demandAnalysis.hotZones,
      },
      meta: {
        analyzedAt: new Date().toISOString(),
        model: 'gpt-4o',
      },
    })
  } catch (error) {
    console.error('Error analyzing demand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze demand' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { city, timeRange, propertyTypes } = body

    if (!city) {
      return NextResponse.json(
        { success: false, error: 'city is required' },
        { status: 400 }
      )
    }

    // Analyze demand using OpenAI
    const demandAnalysis = await analyzeDemand({
      city,
      timeRange: timeRange || '1 año',
      propertyTypes,
    })

    return NextResponse.json({
      success: true,
      analysis: {
        city,
        timeRange: timeRange || '1 año',
        demandScore: demandAnalysis.demandScore,
        trend: demandAnalysis.trend,
        insights: demandAnalysis.insights,
        recommendations: demandAnalysis.recommendations,
        hotZones: demandAnalysis.hotZones,
      },
      meta: {
        analyzedAt: new Date().toISOString(),
        model: 'gpt-4o',
      },
    })
  } catch (error) {
    console.error('Error analyzing demand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze demand' },
      { status: 500 }
    )
  }
}


