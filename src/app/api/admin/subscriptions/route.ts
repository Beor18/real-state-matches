import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

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

// GET /api/admin/subscriptions - List subscriptions with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { authorized, error, status } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const statusFilter = searchParams.get('status')
    const planFilter = searchParams.get('plan')
    const typeFilter = searchParams.get('type') // 'stripe', 'manual', or null
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build query - use explicit FK to avoid ambiguity with granted_by
    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        users:user_id (
          id,
          email,
          name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (planFilter && planFilter !== 'all') {
      query = query.eq('plan_type', planFilter)
    }

    if (typeFilter === 'stripe') {
      query = query.not('stripe_subscription_id', 'is', null)
    } else if (typeFilter === 'manual') {
      query = query.eq('is_manual', true)
    }

    const { data: subscriptions, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Filter by search if provided (client-side for now)
    let filteredSubscriptions = subscriptions || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredSubscriptions = filteredSubscriptions.filter((sub: any) => 
        sub.users?.email?.toLowerCase().includes(searchLower) ||
        sub.users?.full_name?.toLowerCase().includes(searchLower)
      )
    }

    // Calculate stats
    const { data: statsData } = await supabase
      .from('subscriptions')
      .select('plan_type, price, interval, status')
      .eq('status', 'active')

    let totalActive = 0
    let mrrEstimate = 0
    const planCounts: Record<string, number> = { starter: 0, pro: 0, vip: 0 }

    if (statsData) {
      totalActive = statsData.length
      for (const sub of statsData) {
        planCounts[sub.plan_type] = (planCounts[sub.plan_type] || 0) + 1
        if (sub.interval === 'yearly') {
          mrrEstimate += sub.price / 12
        } else {
          mrrEstimate += sub.price
        }
      }
    }

    return NextResponse.json({
      success: true,
      subscriptions: filteredSubscriptions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: {
        totalActive,
        mrrEstimate: Math.round(mrrEstimate * 100) / 100,
        byPlan: planCounts,
      },
    })
  } catch (error) {
    console.error('Error in subscriptions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/subscriptions - Cancel a subscription
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { authorized, userId, error, status } = await verifyAdmin(supabase)
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const subscriptionId = request.nextUrl.searchParams.get('id')
    const cancelImmediately = request.nextUrl.searchParams.get('immediately') === 'true'

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    // Get the subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // If it's a Stripe subscription, cancel it there too
    if (subscription.stripe_subscription_id) {
      try {
        if (cancelImmediately) {
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
        } else {
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
          })
        }
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError)
        // Continue with DB update even if Stripe fails
      }
    }

    // Update subscription in database
    const updateData: any = cancelImmediately
      ? { status: 'canceled' }
      : { cancel_at_period_end: true }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: cancelImmediately
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of the current period',
    })
  } catch (error) {
    console.error('Error in subscriptions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

