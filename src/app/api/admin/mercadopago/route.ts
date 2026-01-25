import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testMPConnection, createMPPreapprovalPlan, clearMPPlansCache } from '@/lib/mercadopago'

// GET: Get Mercado Pago configuration status
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

    // Check if credentials are configured
    const hasAccessToken = !!process.env.MP_ACCESS_TOKEN
    const hasPublicKey = !!process.env.MP_PUBLIC_KEY
    const hasWebhookSecret = !!process.env.MP_WEBHOOK_SECRET

    // Get subscription plans with MP IDs
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('plan_key, name, mp_preapproval_plan_id_monthly, mp_preapproval_plan_id_yearly')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    return NextResponse.json({
      configured: hasAccessToken && hasPublicKey,
      credentials: {
        accessToken: hasAccessToken,
        publicKey: hasPublicKey,
        webhookSecret: hasWebhookSecret,
      },
      plans: plans || [],
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
    })

  } catch (error) {
    console.error('Error fetching MP config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// POST: Test connection or create preapproval plans
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
    const { action } = body as { action: 'test' | 'create_plans' }

    if (action === 'test') {
      // Test MP connection
      const result = await testMPConnection()
      return NextResponse.json(result)
    }

    if (action === 'create_plans') {
      // Create preapproval plans in MP for each subscription plan
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (!plans || plans.length === 0) {
        return NextResponse.json({ error: 'No plans found' }, { status: 404 })
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const results = []

      for (const plan of plans) {
        try {
          // Create monthly plan
          if (!plan.mp_preapproval_plan_id_monthly) {
            const monthlyPlan = await createMPPreapprovalPlan({
              reason: `${plan.name} - Mensual`,
              transactionAmount: plan.price_monthly,
              frequency: 1,
              frequencyType: 'months',
              backUrl: `${baseUrl}/dashboard?mp_subscription=success`,
            })

            await supabase
              .from('subscription_plans')
              .update({ mp_preapproval_plan_id_monthly: monthlyPlan.id })
              .eq('id', plan.id)

            results.push({ plan: plan.plan_key, interval: 'monthly', mpPlanId: monthlyPlan.id })
          }

          // Create yearly plan
          if (!plan.mp_preapproval_plan_id_yearly) {
            const yearlyPlan = await createMPPreapprovalPlan({
              reason: `${plan.name} - Anual`,
              transactionAmount: plan.price_yearly,
              frequency: 12,
              frequencyType: 'months',
              backUrl: `${baseUrl}/dashboard?mp_subscription=success`,
            })

            await supabase
              .from('subscription_plans')
              .update({ mp_preapproval_plan_id_yearly: yearlyPlan.id })
              .eq('id', plan.id)

            results.push({ plan: plan.plan_key, interval: 'yearly', mpPlanId: yearlyPlan.id })
          }
        } catch (planError) {
          console.error(`Error creating MP plan for ${plan.plan_key}:`, planError)
          results.push({ plan: plan.plan_key, error: 'Failed to create plan' })
        }
      }

      // Clear cache so new plan IDs are loaded
      clearMPPlansCache()

      return NextResponse.json({ 
        success: true, 
        created: results.filter(r => !r.error).length,
        results 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in MP admin action:', error)
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}

