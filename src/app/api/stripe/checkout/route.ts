import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, getOrCreateStripeCustomer, getPriceId, type PlanType, type BillingInterval } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId, interval = 'monthly' } = body as { planId: PlanType; interval?: BillingInterval }

    if (!planId || !['starter', 'pro', 'vip'].includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Get user's Stripe customer ID from database
    const { data: dbUser } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single() as { data: { stripe_customer_id: string | null } | null }

    // Create or get Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      user.email!,
      user.id,
      dbUser?.stripe_customer_id
    )

    // Update user with Stripe customer ID if newly created
    if (!dbUser?.stripe_customer_id) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId } as any)
        .eq('id', user.id)
    }

    // Get the price ID for the selected plan
    const priceId = getPriceId(planId, interval)

    // Create checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const session = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/subscription/cancel`,
      userId: user.id,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

