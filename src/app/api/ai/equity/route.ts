import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEquityForecast } from '@/services/ai/openai-services'
import type { Property, PropertyPrediction } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'propertyId is required' },
        { status: 400 }
      )
    }

    // Get property from database
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single() as { data: Property | null; error: any }

    if (propertyError || !property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if we have a recent prediction
    const { data: existingPrediction } = await supabase
      .from('property_predictions')
      .select('*')
      .eq('property_id', propertyId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .single() as { data: PropertyPrediction | null; error: any }

    if (existingPrediction) {
      return NextResponse.json({
        success: true,
        forecast: {
          property: {
            id: property.id,
            title: property.title,
            address: property.address,
            city: property.city,
            currentValue: property.price,
          },
          predictions: {
            value1Y: existingPrediction.predicted_value_1y,
            value3Y: existingPrediction.predicted_value_3y,
            value5Y: existingPrediction.predicted_value_5y,
            value10Y: existingPrediction.predicted_value_10y,
            confidenceLevel: existingPrediction.confidence_level,
          },
          remodelTips: existingPrediction.remodel_tips,
          zoningInfo: existingPrediction.zoning_info,
          developmentOpportunities: existingPrediction.development_opportunities,
          isHotZone: existingPrediction.is_hot_zone,
          isUndervalued: existingPrediction.is_undervalued,
        },
        meta: {
          cached: true,
          analyzedAt: existingPrediction.created_at,
        },
      })
    }

    // Generate new forecast using OpenAI
    const forecast = await generateEquityForecast(
      {
        id: property.id,
        title: property.title,
        description: property.description,
        address: property.address,
        city: property.city,
          amenities: Array.isArray(property.amenities) ? property.amenities as string[] : [],
          features: Array.isArray(property.features) ? property.features as string[] : [],
        price: property.price,
        bedrooms: property.bedrooms || undefined,
        bathrooms: property.bathrooms || undefined,
        squareFeet: property.square_feet || undefined,
      },
      property.price
    )

    // Save prediction to database
    const predictionData = {
      property_id: propertyId,
      demand_score: 75,
      demand_trend: 'increasing' as const,
      current_value: property.price,
      predicted_value_1y: forecast.predictedValue1Y,
      predicted_value_3y: forecast.predictedValue3Y,
      predicted_value_5y: forecast.predictedValue5Y,
      predicted_value_10y: forecast.predictedValue10Y,
      confidence_level: forecast.confidenceLevel,
      remodel_tips: forecast.remodelTips,
      zoning_info: forecast.zoningInfo,
      development_opportunities: forecast.developmentOpportunities.join(', '),
      is_hot_zone: property.city.toLowerCase().includes('dorado') || property.city.toLowerCase().includes('condado'),
      is_undervalued: forecast.predictedValue1Y > property.price * 1.1,
    }

    await supabase.from('property_predictions').insert(predictionData as any)

    return NextResponse.json({
      success: true,
      forecast: {
        property: {
          id: property.id,
          title: property.title,
          address: property.address,
          city: property.city,
          currentValue: property.price,
        },
        predictions: {
          value1Y: forecast.predictedValue1Y,
          value3Y: forecast.predictedValue3Y,
          value5Y: forecast.predictedValue5Y,
          value10Y: forecast.predictedValue10Y,
          confidenceLevel: forecast.confidenceLevel,
        },
        remodelTips: forecast.remodelTips,
        zoningInfo: forecast.zoningInfo,
        developmentOpportunities: forecast.developmentOpportunities,
        isHotZone: predictionData.is_hot_zone,
        isUndervalued: predictionData.is_undervalued,
      },
      meta: {
        cached: false,
        analyzedAt: new Date().toISOString(),
        model: 'gpt-4o',
      },
    })
  } catch (error) {
    console.error('Error generating equity forecast:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate equity forecast' },
      { status: 500 }
    )
  }
}

