import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Server-side Stripe client - lazy initialization
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    })
  }
  return stripeInstance
}

// Backwards compatible export
export const stripe = {
  get customers() { return getStripe().customers },
  get checkout() { return getStripe().checkout },
  get subscriptions() { return getStripe().subscriptions },
  get billingPortal() { return getStripe().billingPortal },
  get webhooks() { return getStripe().webhooks },
}

// Database plan structure
export interface SubscriptionPlan {
  id: string
  plan_key: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  stripe_price_monthly: string | null
  stripe_price_yearly: string | null
  features: string[]
  is_active: boolean
  sort_order: number
}

// Fallback Stripe price IDs for subscription plans (used when DB is not available)
export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER || 'price_starter_monthly',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
    price: 29,
    yearlyPrice: 24,
    name: 'Starter',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
    price: 49,
    yearlyPrice: 39,
    name: 'Pro',
  },
  vip: {
    monthly: process.env.STRIPE_PRICE_VIP || 'price_vip_monthly',
    yearly: process.env.STRIPE_PRICE_VIP_YEARLY || 'price_vip_yearly',
    price: 99,
    yearlyPrice: 79,
    name: 'VIP',
  },
} as const

export type PlanType = keyof typeof STRIPE_PRICES
export type BillingInterval = 'monthly' | 'yearly'

// Cache for plans loaded from database
let plansCache: SubscriptionPlan[] | null = null
let plansCacheExpiry: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Load plans from database
export async function loadPlansFromDatabase(): Promise<SubscriptionPlan[]> {
  // Check cache first
  if (plansCache && Date.now() < plansCacheExpiry) {
    return plansCache
  }

  try {
    const supabase = await createClient()
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error loading plans from database:', error)
      return []
    }

    plansCache = plans || []
    plansCacheExpiry = Date.now() + CACHE_TTL
    return plansCache
  } catch (error) {
    console.error('Error loading plans:', error)
    return []
  }
}

// Clear plans cache (useful after updating plans)
export function clearPlansCache(): void {
  plansCache = null
  plansCacheExpiry = 0
}

// Helper to get price ID - now with database support
export async function getPriceIdFromDatabase(
  planKey: string, 
  interval: BillingInterval
): Promise<string | null> {
  const plans = await loadPlansFromDatabase()
  const plan = plans.find(p => p.plan_key === planKey)
  
  if (plan) {
    return interval === 'yearly' 
      ? plan.stripe_price_yearly 
      : plan.stripe_price_monthly
  }
  
  // Fallback to static config
  const staticPlan = STRIPE_PRICES[planKey as PlanType]
  if (staticPlan) {
    return staticPlan[interval]
  }
  
  return null
}

// Legacy helper to get price ID (synchronous, uses static config)
export function getPriceId(plan: PlanType, interval: BillingInterval): string {
  return STRIPE_PRICES[plan][interval]
}

// Get plan details by key
export async function getPlanByKey(planKey: string): Promise<SubscriptionPlan | null> {
  const plans = await loadPlansFromDatabase()
  return plans.find(p => p.plan_key === planKey) || null
}

// Helper to create or get Stripe customer
export async function getOrCreateStripeCustomer(
  email: string,
  userId: string,
  existingCustomerId?: string | null
): Promise<string> {
  if (existingCustomerId) {
    return existingCustomerId
  }

  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  })

  return customer.id
}

// Create checkout session
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  userId,
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  userId: string
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        supabase_user_id: userId,
      },
    },
    metadata: {
      supabase_user_id: userId,
    },
  })
}

// Create customer portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  })
}

// Webhook event types we handle
export const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const

