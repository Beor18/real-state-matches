import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testProviderConnection } from '@/lib/property-client'
import { type PropertyProvider, PROPERTY_PROVIDERS } from '@/config/property-providers'

// Helper to check admin access
async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { authorized: false, error: 'No autenticado', supabase: null }
  }

  // Use the same client to check role (RLS will apply)
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

// GET - List all property provider settings
export async function GET() {
  try {
    const access = await checkAdminAccess()
    if (!access.authorized || !access.supabase) {
      return NextResponse.json({ error: access.error }, { status: 401 })
    }

    const supabase = access.supabase
    
    const { data: settings, error } = await supabase
      .from('property_provider_settings')
      .select('*')
      .order('priority', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    // Merge with provider configs for complete data
    const providers = Object.entries(PROPERTY_PROVIDERS).map(([key, config]) => {
      const setting = settings?.find(s => s.provider_key === key)
      
      return {
        key,
        name: config.name,
        description: config.description,
        website: config.website,
        docsUrl: config.docsUrl,
        fields: config.fields,
        features: config.features,
        supportedRegions: config.supportedRegions,
        // Settings from database
        enabled: setting?.enabled ?? false,
        hasApiKey: !!setting?.api_key,
        hasApiSecret: !!setting?.api_secret,
        additionalConfig: setting?.additional_config || {},
        priority: setting?.priority ?? 99,
        lastSyncAt: setting?.last_sync_at,
        lastSyncStatus: setting?.last_sync_status,
      }
    })

    return NextResponse.json({
      success: true,
      providers,
    })
  } catch (error) {
    console.error('Error fetching property providers:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener proveedores' },
      { status: 500 }
    )
  }
}

// POST - Update provider settings or test connection
export async function POST(request: NextRequest) {
  try {
    const access = await checkAdminAccess()
    if (!access.authorized || !access.supabase) {
      return NextResponse.json({ error: access.error }, { status: 401 })
    }

    const body = await request.json()
    const { action, providerKey, ...data } = body

    if (!providerKey || !PROPERTY_PROVIDERS[providerKey as PropertyProvider]) {
      return NextResponse.json(
        { success: false, error: 'Proveedor inválido' },
        { status: 400 }
      )
    }

    const supabase = access.supabase

    // Test connection action
    if (action === 'test') {
      const result = await testProviderConnection(
        providerKey as PropertyProvider,
        {
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
          additionalConfig: data.additionalConfig,
        }
      )

      return NextResponse.json({
        success: result.success,
        message: result.message,
      })
    }

    // Update settings action
    if (action === 'update') {
      const updateData: Record<string, unknown> = {
        provider_key: providerKey,
        name: PROPERTY_PROVIDERS[providerKey as PropertyProvider].name,
        updated_at: new Date().toISOString(),
      }

      if (typeof data.enabled === 'boolean') {
        updateData.enabled = data.enabled
      }

      if (data.apiKey !== undefined) {
        updateData.api_key = data.apiKey || null
      }

      if (data.apiSecret !== undefined) {
        updateData.api_secret = data.apiSecret || null
      }

      if (data.additionalConfig !== undefined) {
        updateData.additional_config = data.additionalConfig
      }

      if (typeof data.priority === 'number') {
        updateData.priority = data.priority
      }

      const { error } = await supabase
        .from('property_provider_settings')
        .upsert(updateData, {
          onConflict: 'provider_key',
        })

      if (error) {
        throw new Error(error.message)
      }

      return NextResponse.json({
        success: true,
        message: 'Configuración actualizada',
      })
    }

    // Toggle enabled/disabled
    if (action === 'toggle') {
      // First get current state
      const { data: current } = await supabase
        .from('property_provider_settings')
        .select('enabled')
        .eq('provider_key', providerKey)
        .single()

      const newEnabled = !(current?.enabled ?? false)

      const { error } = await supabase
        .from('property_provider_settings')
        .upsert({
          provider_key: providerKey,
          name: PROPERTY_PROVIDERS[providerKey as PropertyProvider].name,
          enabled: newEnabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'provider_key',
        })

      if (error) {
        throw new Error(error.message)
      }

      return NextResponse.json({
        success: true,
        enabled: newEnabled,
        message: newEnabled ? 'Proveedor activado' : 'Proveedor desactivado',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating property provider:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar proveedor' },
      { status: 500 }
    )
  }
}

