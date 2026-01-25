import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

// Types for Mercado Pago
export interface MPPreapprovalPlan {
  id: string
  status: string
  reason: string
  auto_recurring: {
    frequency: number
    frequency_type: 'days' | 'months'
    transaction_amount: number
    currency_id: string
  }
  back_url: string
  date_created: string
}

export interface MPPreapproval {
  id: string
  payer_id: number
  payer_email: string
  back_url: string
  collector_id: number
  application_id: number
  status: 'pending' | 'authorized' | 'paused' | 'cancelled'
  reason: string
  external_reference: string
  preapproval_plan_id: string
  init_point: string
  auto_recurring: {
    frequency: number
    frequency_type: 'days' | 'months'
    transaction_amount: number
    currency_id: string
    start_date: string
    end_date: string
  }
  date_created: string
}

// Server-side Mercado Pago client - lazy initialization
let mpClient: MercadoPagoConfig | null = null

export function getMercadoPago(): MercadoPagoConfig {
  if (!mpClient) {
    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error('MP_ACCESS_TOKEN is not configured')
    }
    mpClient = new MercadoPagoConfig({
      accessToken,
    })
  }
  return mpClient
}

// Database plan structure with MP fields
export interface SubscriptionPlanWithMP {
  id: string
  plan_key: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  stripe_price_monthly: string | null
  stripe_price_yearly: string | null
  mp_preapproval_plan_id_monthly: string | null
  mp_preapproval_plan_id_yearly: string | null
  features: string[]
  is_active: boolean
  sort_order: number
}

// Cache for plans loaded from database
let plansCacheMP: SubscriptionPlanWithMP[] | null = null
let plansCacheExpiryMP: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Load plans from database with MP fields
export async function loadPlansWithMP(): Promise<SubscriptionPlanWithMP[]> {
  if (plansCacheMP && Date.now() < plansCacheExpiryMP) {
    return plansCacheMP
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

    plansCacheMP = plans || []
    plansCacheExpiryMP = Date.now() + CACHE_TTL
    return plansCacheMP
  } catch (error) {
    console.error('Error loading plans:', error)
    return []
  }
}

// Clear plans cache
export function clearMPPlansCache(): void {
  plansCacheMP = null
  plansCacheExpiryMP = 0
}

// Get plan by key with MP fields
export async function getMPPlanByKey(planKey: string): Promise<SubscriptionPlanWithMP | null> {
  const plans = await loadPlansWithMP()
  return plans.find(p => p.plan_key === planKey) || null
}

// Create a preapproval (subscription) for a user
export async function createMPPreapproval({
  planId,
  email,
  userId,
  reason,
  backUrl,
  externalReference,
  transactionAmount,
  frequency,
  frequencyType,
}: {
  planId?: string
  email: string
  userId: string
  reason: string
  backUrl: string
  externalReference: string
  transactionAmount: number
  frequency: number
  frequencyType: 'days' | 'months'
}): Promise<MPPreapproval> {
  const mp = getMercadoPago()
  const preapproval = new PreApproval(mp)

  const response = await preapproval.create({
    body: {
      preapproval_plan_id: planId,
      payer_email: email,
      reason,
      back_url: backUrl,
      external_reference: externalReference,
      auto_recurring: {
        frequency,
        frequency_type: frequencyType,
        transaction_amount: transactionAmount,
        currency_id: 'ARS', // Default to ARS, can be made configurable
      },
    },
  })

  return response as unknown as MPPreapproval
}

// Create a preapproval plan (subscription plan template)
export async function createMPPreapprovalPlan({
  reason,
  transactionAmount,
  frequency,
  frequencyType,
  backUrl,
}: {
  reason: string
  transactionAmount: number
  frequency: number
  frequencyType: 'days' | 'months'
  backUrl: string
}): Promise<MPPreapprovalPlan> {
  const mp = getMercadoPago()
  const preapprovalPlan = new PreApprovalPlan(mp)

  const response = await preapprovalPlan.create({
    body: {
      reason,
      auto_recurring: {
        frequency,
        frequency_type: frequencyType,
        transaction_amount: transactionAmount,
        currency_id: 'ARS',
      },
      back_url: backUrl,
    },
  })

  return response as unknown as MPPreapprovalPlan
}

// Get a preapproval by ID
export async function getMPPreapproval(preapprovalId: string): Promise<MPPreapproval> {
  const mp = getMercadoPago()
  const preapproval = new PreApproval(mp)

  const response = await preapproval.get({ id: preapprovalId })
  return response as unknown as MPPreapproval
}

// Cancel a preapproval
export async function cancelMPPreapproval(preapprovalId: string): Promise<MPPreapproval> {
  const mp = getMercadoPago()
  const preapproval = new PreApproval(mp)

  const response = await preapproval.update({
    id: preapprovalId,
    body: {
      status: 'cancelled',
    },
  })

  return response as unknown as MPPreapproval
}

// Pause a preapproval
export async function pauseMPPreapproval(preapprovalId: string): Promise<MPPreapproval> {
  const mp = getMercadoPago()
  const preapproval = new PreApproval(mp)

  const response = await preapproval.update({
    id: preapprovalId,
    body: {
      status: 'paused',
    },
  })

  return response as unknown as MPPreapproval
}

// Resume a paused preapproval
export async function resumeMPPreapproval(preapprovalId: string): Promise<MPPreapproval> {
  const mp = getMercadoPago()
  const preapproval = new PreApproval(mp)

  const response = await preapproval.update({
    id: preapprovalId,
    body: {
      status: 'authorized',
    },
  })

  return response as unknown as MPPreapproval
}

// Test connection to Mercado Pago API
export async function testMPConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      return { success: false, error: 'MP_ACCESS_TOKEN not configured' }
    }

    // Try to get user info to verify credentials
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `API Error: ${response.status} - ${error}` }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Verify webhook signature (if secret is configured)
export function verifyMPWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !secret) {
    // If no secret configured, skip verification
    return true
  }

  try {
    const crypto = require('crypto')
    
    // Parse x-signature header
    const parts = xSignature.split(',')
    let ts = ''
    let v1 = ''
    
    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key.trim() === 'ts') ts = value.trim()
      if (key.trim() === 'v1') v1 = value.trim()
    }

    // Create manifest string
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    
    // Generate HMAC
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const generatedSignature = hmac.digest('hex')

    return generatedSignature === v1
  } catch (error) {
    console.error('Error verifying MP webhook signature:', error)
    return false
  }
}

// Map MP preapproval status to subscription status
export function mapMPStatusToSubscriptionStatus(
  mpStatus: 'pending' | 'authorized' | 'paused' | 'cancelled'
): 'active' | 'inactive' | 'canceled' | 'past_due' {
  switch (mpStatus) {
    case 'authorized':
      return 'active'
    case 'paused':
      return 'past_due'
    case 'cancelled':
      return 'canceled'
    case 'pending':
    default:
      return 'inactive'
  }
}

// Get payment settings to determine active gateway
export async function getActivePaymentGateway(): Promise<'stripe' | 'mercadopago'> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('payment_settings')
      .select('active_gateway')
      .single()

    if (error || !data) {
      console.warn('Could not fetch payment settings, defaulting to stripe')
      return 'stripe'
    }

    return data.active_gateway as 'stripe' | 'mercadopago'
  } catch (error) {
    console.error('Error getting active payment gateway:', error)
    return 'stripe'
  }
}

// Webhook event types we handle
export const MP_WEBHOOK_EVENTS = [
  'subscription_preapproval',
  'subscription_authorized_payment',
  'payment',
] as const

export type MPWebhookEventType = typeof MP_WEBHOOK_EVENTS[number]

