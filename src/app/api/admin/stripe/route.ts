import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

// Check if user is admin
async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return userData?.role === 'admin'
}

// GET: Get Stripe configuration status
export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY || ''
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  // Determine mode based on key prefix
  const isTestMode = secretKey.startsWith('sk_test_') || publishableKey.startsWith('pk_test_')
  const isLiveMode = secretKey.startsWith('sk_live_') || publishableKey.startsWith('pk_live_')

  // Mask keys for security (show first 7 and last 4 chars)
  const maskKey = (key: string): string => {
    if (!key || key.length < 15) return key ? '••••••••' : ''
    return `${key.slice(0, 7)}...${key.slice(-4)}`
  }

  return NextResponse.json({
    success: true,
    config: {
      secretKey: {
        configured: !!secretKey,
        masked: maskKey(secretKey),
      },
      publishableKey: {
        configured: !!publishableKey,
        masked: maskKey(publishableKey),
      },
      webhookSecret: {
        configured: !!webhookSecret,
        masked: maskKey(webhookSecret),
      },
      mode: isTestMode ? 'test' : isLiveMode ? 'live' : 'unknown',
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.com'}/api/stripe/webhook`,
    },
  })
}

// POST: Test connection or trigger test webhook
export async function POST(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'test-connection': {
        try {
          const stripe = getStripe()
          
          // Try to retrieve account info to verify connection
          const account = await stripe.accounts.retrieve()
          
          return NextResponse.json({
            success: true,
            message: 'Conexión exitosa con Stripe',
            account: {
              id: account.id,
              businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || 'N/A',
              country: account.country,
              defaultCurrency: account.default_currency,
              chargesEnabled: account.charges_enabled,
              payoutsEnabled: account.payouts_enabled,
            },
          })
        } catch (stripeError: any) {
          return NextResponse.json({
            success: false,
            message: 'Error al conectar con Stripe',
            error: stripeError.message,
          }, { status: 400 })
        }
      }

      case 'test-webhook': {
        // Simulate a webhook event locally
        const testEvent = {
          id: `evt_test_${Date.now()}`,
          type: 'checkout.session.completed',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              id: `cs_test_${Date.now()}`,
              customer: 'cus_test_123',
              metadata: {
                supabase_user_id: 'test-user-id',
              },
              mode: 'subscription',
              payment_status: 'paid',
              status: 'complete',
            },
          },
        }

        // Log the test event
        console.log('[Stripe Test] Simulated webhook event:', testEvent)

        return NextResponse.json({
          success: true,
          message: 'Evento de prueba generado',
          event: testEvent,
          note: 'Este es un evento simulado para propósitos de prueba. Para probar webhooks reales, usa el CLI de Stripe: stripe listen --forward-to localhost:3000/api/stripe/webhook',
        })
      }

      case 'list-products': {
        try {
          const stripe = getStripe()
          const products = await stripe.products.list({ limit: 10, active: true })
          const prices = await stripe.prices.list({ limit: 20, active: true })

          return NextResponse.json({
            success: true,
            products: products.data.map(p => ({
              id: p.id,
              name: p.name,
              active: p.active,
            })),
            prices: prices.data.map(p => ({
              id: p.id,
              productId: p.product,
              unitAmount: p.unit_amount,
              currency: p.currency,
              recurring: p.recurring ? {
                interval: p.recurring.interval,
                intervalCount: p.recurring.interval_count,
              } : null,
            })),
          })
        } catch (stripeError: any) {
          return NextResponse.json({
            success: false,
            error: stripeError.message,
          }, { status: 400 })
        }
      }

      default:
        return NextResponse.json({
          error: 'Acción no válida',
        }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error in Stripe admin API:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: error.message,
    }, { status: 500 })
  }
}

