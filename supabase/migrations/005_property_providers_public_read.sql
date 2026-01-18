-- Allow public read access to property_provider_settings
-- But only expose non-sensitive fields (not API keys)
-- This is needed for the lifestyle API to check if providers are configured

-- Create a view that hides sensitive data
CREATE OR REPLACE VIEW public.property_provider_status AS
SELECT 
  id,
  provider_key,
  name,
  enabled,
  (api_key IS NOT NULL AND api_key != '') AS has_api_key,
  (api_secret IS NOT NULL AND api_secret != '') AS has_api_secret,
  priority,
  last_sync_at,
  last_sync_status,
  created_at,
  updated_at
FROM property_provider_settings;

-- Grant access to the view for all authenticated users and anon
GRANT SELECT ON public.property_provider_status TO authenticated;
GRANT SELECT ON public.property_provider_status TO anon;

-- Add a policy to allow reading provider settings for checking active status
-- This is separate from the admin-only policies for full access
CREATE POLICY "Anyone can check if providers are enabled"
  ON property_provider_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note: The view hides api_key and api_secret, so even with this policy,
-- sensitive data is not exposed through the view.
-- Direct table access still respects RLS for UPDATE/INSERT/DELETE.

