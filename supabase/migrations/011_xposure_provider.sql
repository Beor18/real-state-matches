-- Migration: Add Xposure MLS Puerto Rico provider
-- This provider uses local data synchronized from xposureapp.com

-- Insert Xposure provider with highest priority (0 = first)
INSERT INTO property_provider_settings (
  provider_key, 
  name, 
  enabled, 
  priority,
  api_key,
  additional_config
)
VALUES (
  'xposure', 
  'Xposure MLS Puerto Rico', 
  true, 
  0,
  'local', -- No API key needed, uses local data
  '{"source": "https://puertorico.xposureapp.com", "sync_interval": "6h"}'::jsonb
)
ON CONFLICT (provider_key) DO UPDATE SET
  name = EXCLUDED.name,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  additional_config = EXCLUDED.additional_config,
  updated_at = NOW();

-- Update other providers to have lower priority (higher numbers)
UPDATE property_provider_settings 
SET priority = priority + 1 
WHERE provider_key != 'xposure' AND priority >= 0;

-- Ensure min_properties_per_provider is at least 5 for Xposure visibility
UPDATE search_settings 
SET min_properties_per_provider = GREATEST(min_properties_per_provider, 5)
WHERE min_properties_per_provider < 5;

-- Add comment for documentation
COMMENT ON TABLE property_provider_settings IS 
'Property data providers configuration. Xposure (MLS Puerto Rico) has priority 0 and is synchronized locally from xposureapp.com every 6 hours.';
