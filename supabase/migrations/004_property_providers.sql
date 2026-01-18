-- Property Providers Settings Table
-- Stores configuration for property data providers (Showcase IDX, Zillow Bridge, etc.)

-- Create property_provider_settings table
CREATE TABLE IF NOT EXISTS property_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  api_key TEXT,
  api_secret TEXT,
  additional_config JSONB DEFAULT '{}',
  priority INT DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(50),
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE property_provider_settings IS 'Configuration for property data providers like Showcase IDX and Zillow Bridge';

-- Add comments to columns
COMMENT ON COLUMN property_provider_settings.provider_key IS 'Unique identifier for the provider (showcase_idx, zillow_bridge)';
COMMENT ON COLUMN property_provider_settings.enabled IS 'Whether this provider is active and should be queried';
COMMENT ON COLUMN property_provider_settings.api_key IS 'Primary API key or access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN property_provider_settings.api_secret IS 'Secondary secret/token if required by provider';
COMMENT ON COLUMN property_provider_settings.additional_config IS 'Provider-specific configuration (dataset, region, etc.)';
COMMENT ON COLUMN property_provider_settings.priority IS 'Query order - lower numbers queried first';
COMMENT ON COLUMN property_provider_settings.last_sync_at IS 'When properties were last synced from this provider';
COMMENT ON COLUMN property_provider_settings.last_sync_status IS 'Status of last sync: success, failed, partial';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_providers_enabled ON property_provider_settings(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_property_providers_priority ON property_provider_settings(priority);

-- Enable Row Level Security
ALTER TABLE property_provider_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify provider settings
CREATE POLICY "Admins can view property provider settings"
  ON property_provider_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert property provider settings"
  ON property_provider_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update property provider settings"
  ON property_provider_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete property provider settings"
  ON property_provider_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_property_provider_updated_at ON property_provider_settings;
CREATE TRIGGER trigger_property_provider_updated_at
  BEFORE UPDATE ON property_provider_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_property_provider_updated_at();

-- Seed default providers (disabled by default)
INSERT INTO property_provider_settings (provider_key, name, enabled, priority)
VALUES 
  ('showcase_idx', 'Showcase IDX', false, 1),
  ('zillow_bridge', 'Zillow (Bridge Data Output)', false, 2)
ON CONFLICT (provider_key) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON property_provider_settings TO authenticated;

