import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Helper to verify admin access
async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { authorized: false, error: 'Unauthorized', status: 401 }
  }

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'admin') {
    return { authorized: false, error: 'Forbidden - Admin access required', status: 403 }
  }

  return { authorized: true, error: null, status: 200 }
}

// GET /api/admin/plans - List all plans
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { authorized, error, status } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true'

    let query = supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: plans, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching plans:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      plans: plans || [],
    })
  } catch (error) {
    console.error('Error in plans API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/plans - Create new plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { authorized, error, status } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const body = await request.json()
    const {
      plan_key,
      name,
      description,
      price_monthly,
      price_yearly,
      stripe_price_monthly,
      stripe_price_yearly,
      features,
      is_active = true,
      sort_order = 0,
    } = body

    // Validate required fields
    if (!plan_key || !name || price_monthly === undefined || price_yearly === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: plan_key, name, price_monthly, price_yearly' },
        { status: 400 }
      )
    }

    // Check if plan_key already exists
    const { data: existing } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('plan_key', plan_key)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Plan with key '${plan_key}' already exists` },
        { status: 400 }
      )
    }

    const { data: newPlan, error: insertError } = await supabase
      .from('subscription_plans')
      .insert({
        plan_key,
        name,
        description,
        price_monthly,
        price_yearly,
        stripe_price_monthly,
        stripe_price_yearly,
        features: features || [],
        is_active,
        sort_order,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating plan:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      plan: newPlan,
    })
  } catch (error) {
    console.error('Error in plans API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/plans - Update plan
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { authorized, error, status } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.created_at
    delete updateData.updated_at

    const { data: updatedPlan, error: updateError } = await supabase
      .from('subscription_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating plan:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
    })
  } catch (error) {
    console.error('Error in plans API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/plans - Deactivate plan (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { authorized, error, status } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const planId = request.nextUrl.searchParams.get('id')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Check if there are active subscriptions using this plan
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('plan_key')
      .eq('id', planId)
      .single()

    if (plan) {
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('plan_type', plan.plan_key)
        .eq('status', 'active')

      if (activeSubscriptions && activeSubscriptions > 0) {
        return NextResponse.json(
          { error: `Cannot delete plan with ${activeSubscriptions} active subscriptions` },
          { status: 400 }
        )
      }
    }

    // Soft delete - just deactivate
    const { error: deleteError } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('id', planId)

    if (deleteError) {
      console.error('Error deleting plan:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Plan deactivated successfully',
    })
  } catch (error) {
    console.error('Error in plans API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

