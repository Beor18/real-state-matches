-- Saved Properties Table
-- Stores properties that users have saved/favorited from search results

-- =============================================
-- SAVED PROPERTIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.saved_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- Property identification from external provider
    property_id TEXT NOT NULL,                    -- ID from provider (bridge-xxx, realtor-xxx)
    source_provider TEXT NOT NULL,                -- zillow_bridge, realtor_rapidapi, showcase_idx
    external_id TEXT,                             -- Original ID from provider API
    -- Property data stored as JSON for persistence (providers are external)
    property_data JSONB NOT NULL,                 -- Complete property data snapshot
    -- User additions
    notes TEXT,                                   -- User's personal notes
    -- Timestamps
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure user can only save same property once
    UNIQUE(user_id, property_id)
);

-- Add comments
COMMENT ON TABLE public.saved_properties IS 'Properties saved/favorited by users from search results';
COMMENT ON COLUMN public.saved_properties.property_id IS 'Unique property ID from provider (e.g., bridge-abc123, realtor-xyz789)';
COMMENT ON COLUMN public.saved_properties.source_provider IS 'Provider that supplied the property (zillow_bridge, realtor_rapidapi, etc.)';
COMMENT ON COLUMN public.saved_properties.property_data IS 'Complete property data snapshot stored as JSON';
COMMENT ON COLUMN public.saved_properties.notes IS 'User personal notes about the property';

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON public.saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_saved_at ON public.saved_properties(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_properties_provider ON public.saved_properties(source_provider);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- Users can only view their own saved properties
CREATE POLICY "Users can view own saved properties" ON public.saved_properties
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own saved properties
CREATE POLICY "Users can save properties" ON public.saved_properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own saved properties
CREATE POLICY "Users can update own saved properties" ON public.saved_properties
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own saved properties
CREATE POLICY "Users can delete own saved properties" ON public.saved_properties
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- TRIGGER FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_saved_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_properties_updated_at
    BEFORE UPDATE ON public.saved_properties
    FOR EACH ROW EXECUTE FUNCTION update_saved_properties_updated_at();

