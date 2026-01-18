-- AI Settings / Provider Configuration Schema
-- Allows admin to configure AI providers and API keys dynamically

-- =============================================
-- AI SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    api_key TEXT, -- Stored securely, only accessible by admin
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    models JSONB NOT NULL DEFAULT '{}', -- Model configuration per task
    config JSONB NOT NULL DEFAULT '{}', -- Additional provider-specific config
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_ai_settings_provider ON public.ai_settings(provider);
CREATE INDEX IF NOT EXISTS idx_ai_settings_active ON public.ai_settings(is_active);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view AI settings (contains sensitive API keys)
CREATE POLICY "Admins can view ai settings" ON public.ai_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Only admins can modify AI settings
CREATE POLICY "Admins can manage ai settings" ON public.ai_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- TRIGGER FOR updated_at
-- =============================================
CREATE TRIGGER update_ai_settings_updated_at
    BEFORE UPDATE ON public.ai_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- SEED DEFAULT PROVIDERS (without API keys)
-- =============================================
INSERT INTO public.ai_settings (provider, display_name, is_active, models, config) VALUES
    ('openai', 'OpenAI', FALSE, 
     '{"chat": "gpt-4o", "embedding": "text-embedding-3-small", "analysis": "gpt-4o"}',
     '{"baseUrl": "https://api.openai.com/v1"}'),
    ('anthropic', 'Anthropic (Claude)', FALSE,
     '{"chat": "claude-3-5-sonnet-20241022", "analysis": "claude-3-5-sonnet-20241022"}',
     '{"baseUrl": "https://api.anthropic.com"}'),
    ('google', 'Google AI (Gemini)', FALSE,
     '{"chat": "gemini-1.5-pro", "analysis": "gemini-1.5-pro"}',
     '{"baseUrl": "https://generativelanguage.googleapis.com"}'),
    ('groq', 'Groq (Fast Inference)', FALSE,
     '{"chat": "llama-3.3-70b-versatile", "analysis": "llama-3.3-70b-versatile"}',
     '{"baseUrl": "https://api.groq.com/openai/v1"}')
ON CONFLICT (provider) DO NOTHING;

