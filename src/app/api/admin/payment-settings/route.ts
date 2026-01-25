import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Get current payment settings
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminCheck?.is_admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get payment settings
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .single()

    if (error) {
      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          active_gateway: 'stripe',
          updated_at: null,
        })
      }
      throw error
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
      { status: 500 }
    )
  }
}

// POST: Update payment settings
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminCheck?.is_admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { active_gateway } = body as { active_gateway: 'stripe' | 'mercadopago' }

    if (!active_gateway || !['stripe', 'mercadopago'].includes(active_gateway)) {
      return NextResponse.json(
        { error: 'Invalid gateway. Must be "stripe" or "mercadopago"' },
        { status: 400 }
      )
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('payment_settings')
      .select('id')
      .single()

    let result

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('payment_settings')
        .update({
          active_gateway,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('payment_settings')
        .insert({
          active_gateway,
          updated_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error updating payment settings:', error)
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    )
  }
}

