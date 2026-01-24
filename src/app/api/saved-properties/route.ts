import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Interface for saved property data
interface SavedPropertyData {
  id: string
  sourceProvider: string
  externalId: string
  title: string
  description: string
  price: number
  address: string
  city: string
  state: string
  zipCode: string
  bedrooms: number
  bathrooms: number
  squareFeet: number
  yearBuilt?: number
  propertyType: string
  features: string[]
  amenities: string[]
  images: string[]
  virtualTourUrl?: string
  agent?: {
    name: string
    email?: string
    phone?: string
    company?: string
  }
  matchScore?: number
  matchReasons?: string[]
  lifestyleFit?: string
}

// GET - List user's saved properties
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Fetch saved properties
    const { data: savedProperties, error } = await supabase
      .from('saved_properties')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      savedProperties: savedProperties || [],
      total: savedProperties?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching saved properties:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener propiedades guardadas' },
      { status: 500 }
    )
  }
}

// POST - Save a property
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { property, notes } = body as { property: SavedPropertyData; notes?: string }

    if (!property || !property.id) {
      return NextResponse.json(
        { success: false, error: 'Datos de propiedad requeridos' },
        { status: 400 }
      )
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_properties')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', property.id)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Propiedad ya está guardada',
        savedProperty: existing,
        alreadySaved: true,
      })
    }

    // Save the property
    const { data: savedProperty, error } = await supabase
      .from('saved_properties')
      .insert({
        user_id: user.id,
        property_id: property.id,
        source_provider: property.sourceProvider,
        external_id: property.externalId,
        property_data: property,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Propiedad guardada correctamente',
      savedProperty,
    })
  } catch (error) {
    console.error('Error saving property:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar propiedad' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a saved property by property_id
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'propertyId requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('saved_properties')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', propertyId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Propiedad eliminada de guardados',
    })
  } catch (error) {
    console.error('Error deleting saved property:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar propiedad' },
      { status: 500 }
    )
  }
}

