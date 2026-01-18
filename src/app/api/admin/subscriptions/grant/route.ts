import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Helper to verify admin access
async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { authorized: false, userId: null, error: 'Unauthorized', status: 401 }
  }

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'admin') {
    return { authorized: false, userId: null, error: 'Forbidden - Admin access required', status: 403 }
  }

  return { authorized: true, userId: user.id, error: null, status: 200 }
}

// POST /api/admin/subscriptions/grant - Grant a plan to a user without payment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { authorized, userId: adminId, error, status } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const body = await request.json()
    const {
      user_id,
      plan_key,
      duration_days,
      notes,
    } = body

    // Validate required fields
    if (!user_id || !plan_key || !duration_days) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, plan_key, duration_days' },
        { status: 400 }
      )
    }

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_key', plan_key)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 })
    }

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', user_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, plan_type, status')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      return NextResponse.json(
        { 
          error: `User already has an active ${existingSub.plan_type} subscription`,
          existingSubscription: existingSub,
        },
        { status: 400 }
      )
    }

    // Calculate dates
    const now = new Date()
    const endDate = new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000)

    // Create the manual subscription
    const subscriptionData = {
      user_id,
      plan_type: plan_key,
      plan_name: plan.name,
      price: 0, // Manual grants are free
      interval: 'monthly', // Default for manual
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
      is_manual: true,
      granted_by: adminId,
      notes: notes || `Granted by admin on ${now.toLocaleDateString()}`,
    }

    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating subscription:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Update user's VIP status if applicable
    if (plan_key === 'vip') {
      await supabase
        .from('users')
        .update({ is_vip: true })
        .eq('id', user_id)
    }

    return NextResponse.json({
      success: true,
      subscription: newSubscription,
      message: `Successfully granted ${plan.name} plan to user for ${duration_days} days`,
    })
  } catch (error) {
    console.error('Error in grant API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

