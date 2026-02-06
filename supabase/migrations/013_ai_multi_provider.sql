-- Multi-Provider AI Support
-- Allows multiple AI providers to be active simultaneously
-- One provider is marked as "primary" (synthesizer) to merge responses

-- Add is_primary column to ai_settings
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure only one provider can be primary at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_primary_provider 
  ON public.ai_settings (is_primary) WHERE is_primary = true;
