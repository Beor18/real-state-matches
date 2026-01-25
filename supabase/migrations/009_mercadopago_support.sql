-- =============================================
-- MERCADO PAGO INTEGRATION SUPPORT
-- =============================================
-- Migration to add Mercado Pago as alternative payment gateway

-- =============================================
-- 1. PAYMENT SETTINGS TABLE
-- =============================================
-- Stores which payment gateway is currently active

CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    active_gateway TEXT NOT NULL DEFAULT 'stripe' CHECK (active_gateway IN ('stripe', 'mercadopago')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Public can read payment settings (needed for checkout flow)
CREATE POLICY "Anyone can view payment settings" ON public.payment_settings
    FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
    FOR ALL USING (is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_payment_settings_updated_at
    BEFORE UPDATE ON public.payment_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default settings (Stripe as default)
INSERT INTO public.payment_settings (active_gateway)
VALUES ('stripe')
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. ADD MERCADO PAGO FIELDS TO SUBSCRIPTION_PLANS
-- =============================================

ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS mp_preapproval_plan_id_monthly TEXT,
ADD COLUMN IF NOT EXISTS mp_preapproval_plan_id_yearly TEXT;

-- =============================================
-- 3. ADD MERCADO PAGO FIELDS TO SUBSCRIPTIONS
-- =============================================

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'stripe' CHECK (payment_gateway IN ('stripe', 'mercadopago', 'manual'));

-- Update existing subscriptions to have correct payment_gateway
UPDATE public.subscriptions 
SET payment_gateway = CASE 
    WHEN is_manual = true THEN 'manual'
    WHEN stripe_subscription_id IS NOT NULL THEN 'stripe'
    ELSE 'stripe'
END
WHERE payment_gateway IS NULL;

-- Create index for Mercado Pago subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval 
ON public.subscriptions(mp_preapproval_id) 
WHERE mp_preapproval_id IS NOT NULL;

-- Create index for payment gateway
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_gateway 
ON public.subscriptions(payment_gateway);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.payment_settings IS 'Stores the active payment gateway configuration';
COMMENT ON COLUMN public.payment_settings.active_gateway IS 'Currently active payment gateway: stripe or mercadopago';

COMMENT ON COLUMN public.subscription_plans.mp_preapproval_plan_id_monthly IS 'Mercado Pago preapproval plan ID for monthly billing';
COMMENT ON COLUMN public.subscription_plans.mp_preapproval_plan_id_yearly IS 'Mercado Pago preapproval plan ID for yearly billing';

COMMENT ON COLUMN public.subscriptions.mp_preapproval_id IS 'Mercado Pago preapproval (subscription) ID';
COMMENT ON COLUMN public.subscriptions.payment_gateway IS 'Payment gateway used for this subscription';

