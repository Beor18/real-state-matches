import Stripe from 'stripe'

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

// Stripe price IDs for subscription plans
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

// Helper to get price ID
export function getPriceId(plan: PlanType, interval: BillingInterval): string {
  return STRIPE_PRICES[plan][interval]
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

