-- =============================================
-- SUBSCRIPTION PLANS TABLE
-- =============================================
-- Dynamic subscription plans stored in database

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_key TEXT UNIQUE NOT NULL, -- 'starter', 'pro', 'vip'
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    stripe_price_monthly TEXT,
    stripe_price_yearly TEXT,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for active plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active, sort_order);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public can read active plans
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

-- Admins can manage all plans
CREATE POLICY "Admins can manage plans" ON public.subscription_plans
    FOR ALL USING (is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- SEED DATA - Default Plans
-- =============================================

INSERT INTO public.subscription_plans (plan_key, name, description, price_monthly, price_yearly, features, sort_order)
VALUES 
(
    'starter',
    'Starter',
    'Para explorar opciones',
    29.00,
    24.00,
    '[
        "5 búsquedas de propiedades/mes",
        "Matching por estilo de vida",
        "Alertas de nuevas propiedades",
        "Soporte por email"
    ]'::jsonb,
    1
),
(
    'pro',
    'Pro',
    'La opción más elegida',
    49.00,
    39.00,
    '[
        "Búsquedas ilimitadas",
        "Matching avanzado inteligente",
        "Alertas en tiempo real",
        "Análisis de mercado por zona",
        "Proyecciones de valorización",
        "Reportes PDF detallados",
        "Soporte prioritario"
    ]'::jsonb,
    2
),
(
    'vip',
    'VIP',
    'Para inversores serios',
    99.00,
    79.00,
    '[
        "Todo lo del plan Pro",
        "Acceso anticipado a propiedades",
        "Consultoría mensual 1:1 (30 min)",
        "Análisis de portafolio completo",
        "Acceso a comunidad exclusiva",
        "Soporte dedicado 24/7"
    ]'::jsonb,
    3
)
ON CONFLICT (plan_key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- =============================================
-- ADD FIELDS TO SUBSCRIPTIONS TABLE
-- =============================================

-- Add notes field for manual subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false;

-- Create index for manual subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_manual ON public.subscriptions(is_manual) WHERE is_manual = true;

