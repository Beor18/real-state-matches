import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  createMPPreapproval, 
  getMPPlanByKey, 
  getActivePaymentGateway 
} from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    // Check if Mercado Pago is the active gateway
    const activeGateway = await getActivePaymentGateway()
    if (activeGateway !== 'mercadopago') {
      return NextResponse.json(
        { error: 'Mercado Pago is not the active payment gateway' },
        { status: 400 }
      )
    }

    // Check auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planKey, interval } = body as { 
      planKey: string
      interval: 'monthly' | 'yearly' 
    }

    if (!planKey || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields: planKey and interval' },
        { status: 400 }
      )
    }

    // Get plan from database
    const plan = await getMPPlanByKey(planKey)
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Get the preapproval plan ID or create a direct preapproval
    const mpPlanId = interval === 'yearly' 
      ? plan.mp_preapproval_plan_id_yearly 
      : plan.mp_preapproval_plan_id_monthly

    const price = interval === 'yearly' 
      ? plan.price_yearly * 12 // Yearly price is per month, so multiply by 12
      : plan.price_monthly

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create preapproval (subscription)
    const preapproval = await createMPPreapproval({
      planId: mpPlanId || undefined,
      email: user.email || '',
      userId: user.id,
      reason: `Suscripción ${plan.name} - ${interval === 'yearly' ? 'Anual' : 'Mensual'}`,
      backUrl: `${baseUrl}/dashboard?mp_subscription=success`,
      externalReference: `${user.id}:${planKey}:${interval}`,
      transactionAmount: price,
      frequency: interval === 'yearly' ? 12 : 1,
      frequencyType: 'months',
    })

    // Store pending subscription in database
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan: planKey,
        status: 'inactive',
        payment_gateway: 'mercadopago',
        mp_preapproval_id: preapproval.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (subscriptionError) {
      console.error('Error storing subscription:', subscriptionError)
    }

    // Return the init_point URL for redirect
    return NextResponse.json({
      url: preapproval.init_point,
      preapprovalId: preapproval.id,
    })

  } catch (error) {
    console.error('Error creating MP checkout:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

