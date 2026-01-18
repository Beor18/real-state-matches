import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Disable body parsing, we need the raw body for webhook verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(supabase, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(supabase, invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Helper to get plan type from price ID
function getPlanTypeFromPriceId(priceId: string): 'starter' | 'pro' | 'vip' | null {
  for (const [planType, config] of Object.entries(STRIPE_PRICES)) {
    if (config.monthly === priceId || config.yearly === priceId) {
      return planType as 'starter' | 'pro' | 'vip'
    }
  }
  return null
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    console.error('No user ID in session metadata')
    return
  }

  console.log(`Checkout completed for user ${userId}`)
}

async function handleSubscriptionChange(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) {
    console.error('No user ID in subscription metadata')
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planType = getPlanTypeFromPriceId(priceId) || 'starter'
  const planConfig = STRIPE_PRICES[planType]
  const interval = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
    paused: 'canceled',
  }

  const status = statusMap[subscription.status] || 'incomplete'

  // Check if subscription already exists
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  const sub = subscription as any
  const subscriptionData = {
    user_id: userId,
    plan_type: planType,
    plan_name: planConfig.name,
    price: interval === 'yearly' ? planConfig.yearlyPrice : planConfig.price,
    interval,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    status,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }

  if (existingSub) {
    await supabase
      .from('subscriptions')
      .update(subscriptionData as any)
      .eq('id', (existingSub as any).id)
  } else {
    await supabase
      .from('subscriptions')
      .insert(subscriptionData as any)
  }

  // Update user VIP status if on VIP plan
  if (planType === 'vip' && status === 'active') {
    await supabase
      .from('users')
      .update({ is_vip: true } as any)
      .eq('id', userId)
  }

  console.log(`Subscription ${subscription.id} updated for user ${userId}`)
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' } as any)
    .eq('stripe_subscription_id', subscription.id)

  // Remove VIP status
  if (userId) {
    await supabase
      .from('users')
      .update({ is_vip: false } as any)
      .eq('id', userId)
  }

  console.log(`Subscription ${subscription.id} deleted`)
}

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  // Update subscription status to active
  await supabase
    .from('subscriptions')
    .update({ status: 'active' } as any)
    .eq('stripe_subscription_id', subscriptionId)

  console.log(`Payment succeeded for subscription ${subscriptionId}`)
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  // Update subscription status to past_due
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' } as any)
    .eq('stripe_subscription_id', subscriptionId)

  console.log(`Payment failed for subscription ${subscriptionId}`)
}

