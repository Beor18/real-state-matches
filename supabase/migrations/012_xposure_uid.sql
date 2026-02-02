-- Migration: Add xposure_uid field to properties table
-- This field stores the unique identifier from Xposure MLS used to construct photo gallery URLs

ALTER TABLE properties ADD COLUMN IF NOT EXISTS xposure_uid TEXT;

-- Create index for faster lookups by xposure_uid
CREATE INDEX IF NOT EXISTS idx_properties_xposure_uid ON properties(xposure_uid);

-- Add comment for documentation
COMMENT ON COLUMN properties.xposure_uid IS 'Unique identifier from Xposure MLS (e.g., 0000EBBC) used to construct photo gallery URLs';
