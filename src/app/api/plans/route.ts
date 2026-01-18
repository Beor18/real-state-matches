import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/plans - Get active subscription plans (public)
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('id, plan_key, name, description, price_monthly, price_yearly, features, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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

