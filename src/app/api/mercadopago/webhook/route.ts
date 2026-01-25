import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getMPPreapproval, 
  verifyMPWebhookSignature, 
  mapMPStatusToSubscriptionStatus,
  MPWebhookEventType 
} from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get headers for signature verification
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const webhookSecret = process.env.MP_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (webhookSecret) {
      const dataId = body.data?.id?.toString() || ''
      const isValid = verifyMPWebhookSignature(xSignature, xRequestId, dataId, webhookSecret)
      
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { type, data, action } = body as {
      type: MPWebhookEventType
      data: { id: string }
      action?: string
    }

    console.log('MP Webhook received:', { type, action, dataId: data?.id })

    const supabase = await createClient()

    // Handle different event types
    switch (type) {
      case 'subscription_preapproval': {
        // Subscription status changed
        if (!data?.id) {
          console.error('No preapproval ID in webhook data')
          return NextResponse.json({ received: true })
        }

        // Get preapproval details from MP
        const preapproval = await getMPPreapproval(data.id)
        
        if (!preapproval.external_reference) {
          console.error('No external reference in preapproval')
          return NextResponse.json({ received: true })
        }

        // Parse external reference: userId:planKey:interval
        const [userId, planKey, interval] = preapproval.external_reference.split(':')
        
        if (!userId || !planKey) {
          console.error('Invalid external reference format')
          return NextResponse.json({ received: true })
        }

        // Map MP status to our subscription status
        const subscriptionStatus = mapMPStatusToSubscriptionStatus(preapproval.status)

        // Calculate period dates
        const startDate = preapproval.auto_recurring?.start_date 
          ? new Date(preapproval.auto_recurring.start_date)
          : new Date()
        
        const endDate = preapproval.auto_recurring?.end_date
          ? new Date(preapproval.auto_recurring.end_date)
          : (() => {
              const end = new Date(startDate)
              if (interval === 'yearly') {
                end.setFullYear(end.getFullYear() + 1)
              } else {
                end.setMonth(end.getMonth() + 1)
              }
              return end
            })()

        // Update subscription in database
        const { error: updateError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: planKey,
            status: subscriptionStatus,
            payment_gateway: 'mercadopago',
            mp_preapproval_id: preapproval.id,
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          })

        if (updateError) {
          console.error('Error updating subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          )
        }

        console.log(`Subscription updated for user ${userId}: ${subscriptionStatus}`)
        break
      }

      case 'subscription_authorized_payment': {
        // A payment was made for a subscription
        console.log('Subscription payment received:', data.id)
        
        // You could update payment history or send confirmation emails here
        break
      }

      case 'payment': {
        // Generic payment notification
        console.log('Payment notification:', data.id)
        break
      }

      default:
        console.log('Unhandled webhook type:', type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing MP webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// MP also sends GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

