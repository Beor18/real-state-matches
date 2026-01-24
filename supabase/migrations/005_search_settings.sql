-- Search Settings Table
-- Stores configuration for property search behavior (limits, distribution, etc.)

-- =============================================
-- SEARCH SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.search_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Maximum total properties to fetch across all providers
    max_properties_total INT NOT NULL DEFAULT 60,
    -- Maximum properties per provider (NULL = auto-distribute based on total/providers)
    max_properties_per_provider INT DEFAULT NULL,
    -- Maximum properties to send to AI for matching (can be same or less than total)
    max_properties_for_ai INT NOT NULL DEFAULT 60,
    -- Minimum properties per provider (ensures each provider contributes)
    min_properties_per_provider INT NOT NULL DEFAULT 5,
    -- Updated tracking
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments to table and columns
COMMENT ON TABLE public.search_settings IS 'Configuration for property search behavior and limits';
COMMENT ON COLUMN public.search_settings.max_properties_total IS 'Maximum total properties to fetch across all active providers';
COMMENT ON COLUMN public.search_settings.max_properties_per_provider IS 'Fixed limit per provider (NULL = auto-distribute evenly)';
COMMENT ON COLUMN public.search_settings.max_properties_for_ai IS 'Maximum properties to send to AI for matching analysis';
COMMENT ON COLUMN public.search_settings.min_properties_per_provider IS 'Minimum properties to fetch from each provider to ensure diversity';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.search_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read search settings (needed for search functionality)
CREATE POLICY "Anyone can view search settings" ON public.search_settings
    FOR SELECT USING (TRUE);

-- Only admins can modify search settings
CREATE POLICY "Admins can manage search settings" ON public.search_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- TRIGGER FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_search_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_settings_updated_at
    BEFORE UPDATE ON public.search_settings
    FOR EACH ROW EXECUTE FUNCTION update_search_settings_updated_at();

-- =============================================
-- INSERT DEFAULT SETTINGS
-- =============================================
INSERT INTO public.search_settings (max_properties_total, max_properties_for_ai, min_properties_per_provider)
VALUES (60, 60, 5)
ON CONFLICT DO NOTHING;

