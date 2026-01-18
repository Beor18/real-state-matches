import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setActiveConfig, testConnection, clearConfigCache } from '@/lib/ai-client'
import { AIProvider } from '@/config/ai-providers'

// GET - Fetch all AI settings
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch AI settings
    const { data: settings, error } = await supabase
      .from('ai_settings')
      .select('*')
      .order('provider')

    if (error) {
      throw error
    }

    // Mask API keys for response
    const maskedSettings = settings?.map(s => ({
      ...s,
      api_key: s.api_key ? maskApiKey(s.api_key) : null,
      has_key: !!s.api_key,
    }))

    return NextResponse.json({ success: true, settings: maskedSettings })
  } catch (error) {
    console.error('Error fetching AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
      { status: 500 }
    )
  }
}

// POST - Update AI settings (activate provider, set API key, update models)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { provider, api_key, models, is_active } = body as {
      provider: AIProvider
      api_key?: string
      models?: Record<string, string>
      is_active?: boolean
    }

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    if (api_key !== undefined) {
      updateData.api_key = api_key || null
    }

    if (models !== undefined) {
      updateData.models = models
    }

    if (is_active !== undefined) {
      // If activating this provider, deactivate others
      if (is_active) {
        await supabase
          .from('ai_settings')
          .update({ is_active: false })
          .neq('provider', provider)
      }
      updateData.is_active = is_active
    }

    // Update the provider settings
    const { data, error } = await supabase
      .from('ai_settings')
      .update(updateData)
      .eq('provider', provider)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Clear cached config so it's reloaded
    clearConfigCache()

    return NextResponse.json({ 
      success: true, 
      settings: {
        ...data,
        api_key: data.api_key ? maskApiKey(data.api_key) : null,
        has_key: !!data.api_key,
      }
    })
  } catch (error) {
    console.error('Error updating AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to update AI settings' },
      { status: 500 }
    )
  }
}

// PUT - Test connection to a provider
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { provider
 } = body as { provider: AIProvider }

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    // Fetch the provider's config from DB
    const { data: settings, error } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('provider', provider)
      .single()

    if (error || !settings) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (!settings.api_key) {
      return NextResponse.json({ 
        success: false, 
        message: 'API key not configured for this provider' 
      })
    }

    // Temporarily set this config for testing
    setActiveConfig({
      provider: settings.provider as AIProvider,
      apiKey: settings.api_key,
      models: settings.models as Record<string, string>,
      config: settings.config as Record<string, unknown>,
    })

    // Test the connection
    const result = await testConnection()

    // Clear the temporary config
    clearConfigCache()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error testing AI connection:', error)
    clearConfigCache()
    return NextResponse.json(
      { success: false, message: 'Connection test failed' },
      { status: 500 }
    )
  }
}

// Helper to mask API key
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) return '••••••••'
  return `${apiKey.slice(0, 7)}••••${apiKey.slice(-4)}`
}

