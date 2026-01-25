import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActivePaymentGateway, createMPPreapproval, getMPPlanByKey } from '@/lib/mercadopago'
import { createCheckoutSession, getOrCreateStripeCustomer, getPriceIdFromDatabase, getPlanByKey } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId, interval = 'monthly' } = body as { 
      planId: string
      interval?: 'monthly' | 'yearly'
    }

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'planId is required' },
        { status: 400 }
      )
    }

    // Get active payment gateway
    const gateway = await getActivePaymentGateway()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (gateway === 'mercadopago') {
      // Use Mercado Pago
      const plan = await getMPPlanByKey(planId)
      if (!plan) {
        return NextResponse.json(
          { success: false, error: 'Plan not found' },
          { status: 404 }
        )
      }

      const mpPlanId = interval === 'yearly' 
        ? plan.mp_preapproval_plan_id_yearly 
        : plan.mp_preapproval_plan_id_monthly

      const price = interval === 'yearly' 
        ? plan.price_yearly
        : plan.price_monthly

      const preapproval = await createMPPreapproval({
        planId: mpPlanId || undefined,
        email: user.email || '',
        userId: user.id,
        reason: `Suscripción ${plan.name} - ${interval === 'yearly' ? 'Anual' : 'Mensual'}`,
        backUrl: `${baseUrl}/dashboard?subscription=success&gateway=mercadopago`,
        externalReference: `${user.id}:${planId}:${interval}`,
        transactionAmount: price,
        frequency: interval === 'yearly' ? 12 : 1,
        frequencyType: 'months',
      })

      // Store pending subscription
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: planId,
          status: 'inactive',
          payment_gateway: 'mercadopago',
          mp_preapproval_id: preapproval.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      return NextResponse.json({
        success: true,
        gateway: 'mercadopago',
        checkoutUrl: preapproval.init_point,
        preapprovalId: preapproval.id,
      })

    } else {
      // Use Stripe (default)
      const plan = await getPlanByKey(planId)
      if (!plan) {
        return NextResponse.json(
          { success: false, error: 'Plan not found' },
          { status: 404 }
        )
      }

      const priceId = await getPriceIdFromDatabase(planId, interval)
      if (!priceId) {
        return NextResponse.json(
          { success: false, error: 'Price not configured for this plan' },
          { status: 400 }
        )
      }

      // Get or create Stripe customer
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      const customerId = await getOrCreateStripeCustomer(
        user.email || '',
        user.id,
        userData?.stripe_customer_id
      )

      // Save customer ID if it's new
      if (!userData?.stripe_customer_id) {
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }

      // Create checkout session
      const session = await createCheckoutSession({
        customerId,
        priceId,
        successUrl: `${baseUrl}/dashboard?subscription=success&gateway=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/pricing?canceled=true`,
        userId: user.id,
      })

      // Store pending subscription
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: planId,
          status: 'inactive',
          payment_gateway: 'stripe',
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      return NextResponse.json({
        success: true,
        gateway: 'stripe',
        checkoutUrl: session.url,
        sessionId: session.id,
      })
    }

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
