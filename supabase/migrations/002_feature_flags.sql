-- Feature Flags / Module Management Schema
-- Allows admin to enable/disable modules dynamically

-- =============================================
-- FEATURE FLAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    config JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_feature_flags_module_key ON public.feature_flags(module_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON public.feature_flags(category);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags (needed for frontend to check what's enabled)
CREATE POLICY "Anyone can view feature flags" ON public.feature_flags
    FOR SELECT USING (TRUE);

-- Only admins can modify feature flags
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- TRIGGER FOR updated_at
-- =============================================
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- SEED DEFAULT MODULES (all disabled by default)
-- =============================================
INSERT INTO public.feature_flags (module_key, name, description, category, enabled, sort_order) VALUES
    ('demand-prediction', 'Motor de Predicción de Demanda', 'Analiza tendencias del mercado, migración poblacional y sentimiento social para predecir zonas de alta demanda.', 'sreis-engines', FALSE, 1),
    ('lifestyle-matcher', 'Motor Lifestyle & Purpose Matcher', 'Conecta el estilo de vida ideal del usuario con propiedades que se alinean a su visión de vida.', 'sreis-engines', TRUE, 2),
    ('purpose-engine', 'Motor Purpose & Structure', 'Evalúa propiedades para determinar usos alternativos: Airbnb, oficina, desarrollo, zonificación.', 'sreis-engines', FALSE, 3),
    ('equity-forecast', 'Motor Equity & Value Forecast', 'Proyecta plusvalía a 1, 3, 5 y 10 años con recomendaciones de remodelación para maximizar valor.', 'sreis-engines', FALSE, 4),
    ('viral-content', 'Generador de Contenido Viral', 'Crea contenido optimizado para redes sociales: posts, stories, scripts para lives.', 'marketing', FALSE, 5),
    ('property-alerts', 'Sistema de Alertas Inteligentes', 'Notificaciones automáticas sobre bajadas de precio, nuevos listados y zonas calientes.', 'notifications', FALSE, 6)
ON CONFLICT (module_key) DO NOTHING;


