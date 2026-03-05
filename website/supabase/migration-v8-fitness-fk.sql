-- ============================================================
-- Migration v8 — Fix fitness_connections device_id FK
-- Created: 2026-03-04
-- Run in Supabase SQL Editor
-- ============================================================
-- Problem:
--   fitness_connections.device_id has NOT NULL + FK constraint
--   referencing nodes(device_id). This causes Strava OAuth callback
--   to fail with storage_failed when the deviceId in the HMAC state
--   doesn't precisely match a live nodes row (e.g. fingerprint
--   drift, device not yet active, or any timing issue).
--
--   The connect route (api/mine/fitness/connect/route.ts) already
--   validates the device exists AND is active before issuing the
--   OAuth state — so the FK is redundant enforcement that adds
--   fragility with zero security benefit.
--
-- Fix:
--   1. Drop the FK constraint
--   2. Allow NULL device_id (wearable connection should work
--      even if the user hasn't registered a mining node yet)
-- ============================================================

-- Drop FK constraint
ALTER TABLE fitness_connections
  DROP CONSTRAINT IF EXISTS fitness_connections_device_id_fkey;

-- Allow NULL (user may connect Strava before starting mining)
ALTER TABLE fitness_connections
  ALTER COLUMN device_id DROP NOT NULL;
