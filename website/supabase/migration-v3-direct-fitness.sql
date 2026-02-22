-- ============================================================
-- Migration V3: Replace Terra API with Direct Strava + Fitbit
--
-- Changes:
--   1. Rename terra_user_id → provider_user_id
--   2. Add OAuth token columns (access_token, refresh_token, token_expires_at)
--   3. Create unique index on (wallet_address, provider) for active connections
-- ============================================================

-- Rename terra_user_id to provider_user_id
ALTER TABLE fitness_connections RENAME COLUMN terra_user_id TO provider_user_id;

-- Drop old unique constraint on terra_user_id
ALTER TABLE fitness_connections DROP CONSTRAINT IF EXISTS fitness_connections_terra_user_id_key;

-- Add new unique constraint on provider_user_id
ALTER TABLE fitness_connections ADD CONSTRAINT fitness_connections_provider_user_id_key UNIQUE (provider_user_id);

-- Add OAuth token columns
ALTER TABLE fitness_connections ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE fitness_connections ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE fitness_connections ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Unique index: one active connection per wallet per provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_fitness_conn_wallet_provider
  ON fitness_connections (wallet_address, provider)
  WHERE is_active = TRUE;
