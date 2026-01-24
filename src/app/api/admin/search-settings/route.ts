import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Search settings interface
export interface SearchSettings {
  id: string
  max_properties_total: number
  max_properties_per_provider: number | null
  max_properties_for_ai: number
  min_properties_per_provider: number
  updated_at: string
  updated_by: string | null
  created_at: string
}

// Helper to check admin access
async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { authorized: false, error: 'No autenticado', supabase: null }
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbUser?.role !== 'admin') {
    return { authorized: false, error: 'Acceso de administrador requerido', supabase: null }
  }

  return { authorized: true, userId: user.id, supabase }
}

// GET - Fetch current search settings
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Search settings are public readable
    const { data: settings, error } = await supabase
      .from('search_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          settings: {
            max_properties_total: 60,
            max_properties_per_provider: null,
            max_properties_for_ai: 60,
            min_properties_per_provider: 5,
          },
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Error fetching search settings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración de búsqueda' },
      { status: 500 }
    )
  }
}

// POST - Update search settings
export async function POST(request: NextRequest) {
  try {
    const access = await checkAdminAccess()
    if (!access.authorized || !access.supabase) {
      return NextResponse.json({ error: access.error }, { status: 401 })
    }

    const body = await request.json()
    const { 
      max_properties_total, 
      max_properties_per_provider, 
      max_properties_for_ai,
      min_properties_per_provider 
    } = body

    const supabase = access.supabase

    // Validate inputs
    if (max_properties_total !== undefined) {
      if (typeof max_properties_total !== 'number' || max_properties_total < 10 || max_properties_total > 200) {
        return NextResponse.json(
          { success: false, error: 'max_properties_total debe estar entre 10 y 200' },
          { status: 400 }
        )
      }
    }

    if (max_properties_per_provider !== undefined && max_properties_per_provider !== null) {
      if (typeof max_properties_per_provider !== 'number' || max_properties_per_provider < 5 || max_properties_per_provider > 100) {
        return NextResponse.json(
          { success: false, error: 'max_properties_per_provider debe estar entre 5 y 100' },
          { status: 400 }
        )
      }
    }

    if (max_properties_for_ai !== undefined) {
      if (typeof max_properties_for_ai !== 'number' || max_properties_for_ai < 10 || max_properties_for_ai > 200) {
        return NextResponse.json(
          { success: false, error: 'max_properties_for_ai debe estar entre 10 y 200' },
          { status: 400 }
        )
      }
    }

    if (min_properties_per_provider !== undefined) {
      if (typeof min_properties_per_provider !== 'number' || min_properties_per_provider < 1 || min_properties_per_provider > 50) {
        return NextResponse.json(
          { success: false, error: 'min_properties_per_provider debe estar entre 1 y 50' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_by: access.userId,
      updated_at: new Date().toISOString(),
    }

    if (max_properties_total !== undefined) {
      updateData.max_properties_total = max_properties_total
    }
    if (max_properties_per_provider !== undefined) {
      updateData.max_properties_per_provider = max_properties_per_provider
    }
    if (max_properties_for_ai !== undefined) {
      updateData.max_properties_for_ai = max_properties_for_ai
    }
    if (min_properties_per_provider !== undefined) {
      updateData.min_properties_per_provider = min_properties_per_provider
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('search_settings')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('search_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from('search_settings')
        .insert({
          ...updateData,
          max_properties_total: max_properties_total ?? 60,
          max_properties_for_ai: max_properties_for_ai ?? 60,
          min_properties_per_provider: min_properties_per_provider ?? 5,
        })
        .select()
        .single()
    }

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({
      success: true,
      settings: result.data,
      message: 'Configuración actualizada correctamente',
    })
  } catch (error) {
    console.error('Error updating search settings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración de búsqueda' },
      { status: 500 }
    )
  }
}

