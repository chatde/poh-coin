-- ============================================================
-- POH DePIN v2 Migration — Run in Supabase SQL Editor
-- Adds 8 new tables, alters 4 existing tables
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ═══ ALTER EXISTING TABLES ═══

-- Nodes: add fingerprint + signature fields
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS signature_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Compute tasks: add source tracking, priority, seeds
ALTER TABLE compute_tasks ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE compute_tasks ADD COLUMN IF NOT EXISTS priority SMALLINT NOT NULL DEFAULT 5;
ALTER TABLE compute_tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE compute_tasks ADD COLUMN IF NOT EXISTS seed TEXT;
ALTER TABLE compute_tasks ADD COLUMN IF NOT EXISTS task_version TEXT DEFAULT '2.0.0';

-- Task assignments: add proof + AI verification
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS computation_proof JSONB;
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC;
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS ai_flags JSONB;

-- Heartbeats: add memory + worker tracking, make response nullable
ALTER TABLE heartbeats ADD COLUMN IF NOT EXISTS memory_usage_mb INTEGER;
ALTER TABLE heartbeats ADD COLUMN IF NOT EXISTS worker_active BOOLEAN;
ALTER TABLE heartbeats ALTER COLUMN response DROP NOT NULL;

-- Update task_type CHECK constraint (add drugscreen + fitness_verify)
ALTER TABLE compute_tasks DROP CONSTRAINT IF EXISTS compute_tasks_task_type_check;
ALTER TABLE compute_tasks ADD CONSTRAINT compute_tasks_task_type_check
  CHECK (task_type IN ('protein', 'climate', 'signal', 'drugscreen', 'fitness_verify'));

-- Update status CHECK constraint (add ai_rejected)
ALTER TABLE compute_tasks DROP CONSTRAINT IF EXISTS compute_tasks_status_check;
ALTER TABLE compute_tasks ADD CONSTRAINT compute_tasks_status_check
  CHECK (status IN ('pending', 'assigned', 'completed', 'failed', 'ai_rejected'));

-- Update heartbeat compute_status CHECK (add pending)
ALTER TABLE heartbeats DROP CONSTRAINT IF EXISTS heartbeats_compute_status_check;
ALTER TABLE heartbeats ADD CONSTRAINT heartbeats_compute_status_check
  CHECK (compute_status IN ('active', 'throttled', 'idle', 'stopped', 'pending'));

-- ═══ CREATE 8 NEW TABLES ═══

-- Data cache for external API responses (RCSB PDB, USGS, NOAA, NCI)
CREATE TABLE IF NOT EXISTS data_cache (
  cache_key   TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  source_url  TEXT NOT NULL,
  fetched_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_data_cache_expires ON data_cache (expires_at);

-- Terra API wearable connections
CREATE TABLE IF NOT EXISTS fitness_connections (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address  TEXT NOT NULL,
  device_id       TEXT NOT NULL REFERENCES nodes(device_id),
  terra_user_id   TEXT UNIQUE NOT NULL,
  provider        TEXT NOT NULL,
  connected_at    TIMESTAMPTZ DEFAULT NOW(),
  last_sync       TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_fitness_conn_wallet ON fitness_connections (wallet_address);
CREATE INDEX IF NOT EXISTS idx_fitness_conn_device ON fitness_connections (device_id);

-- Individual workout/activity records from wearables
CREATE TABLE IF NOT EXISTS fitness_activities (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address  TEXT NOT NULL,
  device_id       TEXT NOT NULL REFERENCES nodes(device_id),
  activity_hash   TEXT UNIQUE NOT NULL,
  activity_type   TEXT NOT NULL,
  duration_min    NUMERIC NOT NULL,
  active_minutes  NUMERIC NOT NULL,
  avg_heart_rate  SMALLINT,
  hr_zone_minutes JSONB,
  calories        NUMERIC,
  distance_m      NUMERIC,
  effort_score    NUMERIC NOT NULL,
  source_provider TEXT NOT NULL,
  raw_data_hash   TEXT NOT NULL,
  verified        BOOLEAN DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_wallet ON fitness_activities (wallet_address);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_device ON fitness_activities (device_id);
CREATE INDEX IF NOT EXISTS idx_fitness_activities_unverified ON fitness_activities (verified) WHERE verified = FALSE;

-- Canvas + WebGL + audio fingerprints for sybil resistance
CREATE TABLE IF NOT EXISTS device_fingerprints (
  fingerprint_hash TEXT PRIMARY KEY,
  device_id        TEXT NOT NULL REFERENCES nodes(device_id),
  wallet_address   TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fingerprints_wallet ON device_fingerprints (wallet_address);

-- Sliding window rate limit counters
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER DEFAULT 1,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits (key);

-- Track compute outliers, proof mismatches, and fitness fraud
CREATE TABLE IF NOT EXISTS verification_failures (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id    TEXT NOT NULL REFERENCES nodes(device_id),
  task_id      UUID NOT NULL,
  failure_type TEXT NOT NULL,
  penalty      INTEGER NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vf_device ON verification_failures (device_id);

-- CPU/memory/core benchmark results for task difficulty scaling
CREATE TABLE IF NOT EXISTS device_benchmarks (
  device_id       TEXT PRIMARY KEY REFERENCES nodes(device_id),
  cpu_score_ms    INTEGER NOT NULL,
  max_memory_mb   INTEGER NOT NULL,
  cores           INTEGER NOT NULL,
  capability_tier SMALLINT DEFAULT 1,
  benchmarked_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Rolling 30-day quality metrics per device
CREATE TABLE IF NOT EXISTS quality_scores (
  device_id          TEXT PRIMARY KEY REFERENCES nodes(device_id),
  total_tasks_30d    INTEGER DEFAULT 0,
  verified_30d       INTEGER DEFAULT 0,
  fitness_verified   INTEGER DEFAULT 0,
  quality_pct        NUMERIC DEFAULT 0,
  uptime_pct         NUMERIC DEFAULT 0,
  computed_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ RLS + POLICIES ═══

ALTER TABLE data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_scores ENABLE ROW LEVEL SECURITY;

-- Service role full access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access data_cache') THEN
    CREATE POLICY "Service full access data_cache" ON data_cache FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access fitness_connections') THEN
    CREATE POLICY "Service full access fitness_connections" ON fitness_connections FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access fitness_activities') THEN
    CREATE POLICY "Service full access fitness_activities" ON fitness_activities FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access device_fingerprints') THEN
    CREATE POLICY "Service full access device_fingerprints" ON device_fingerprints FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access rate_limits') THEN
    CREATE POLICY "Service full access rate_limits" ON rate_limits FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access verification_failures') THEN
    CREATE POLICY "Service full access verification_failures" ON verification_failures FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access device_benchmarks') THEN
    CREATE POLICY "Service full access device_benchmarks" ON device_benchmarks FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access quality_scores') THEN
    CREATE POLICY "Service full access quality_scores" ON quality_scores FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- Anon read access for fitness_activities (needed for Realtime subscriptions)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon read fitness_activities') THEN
    CREATE POLICY "Anon read fitness_activities" ON fitness_activities FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- ═══ UPDATE RPC FUNCTION ═══

CREATE OR REPLACE FUNCTION get_available_task(p_device_id TEXT)
RETURNS TABLE (task_id UUID, task_type TEXT, payload JSONB, difficulty SMALLINT) AS $$
  SELECT ct.task_id, ct.task_type, ct.payload, ct.difficulty
  FROM compute_tasks ct
  WHERE ct.status IN ('pending', 'assigned')
    AND ct.task_id NOT IN (
      SELECT ta.task_id FROM task_assignments ta WHERE ta.device_id = p_device_id
    )
    AND (
      SELECT COUNT(*) FROM task_assignments ta WHERE ta.task_id = ct.task_id
    ) < 3
  ORDER BY ct.priority ASC, ct.created_at ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- ═══ ENABLE REALTIME ═══
ALTER PUBLICATION supabase_realtime ADD TABLE fitness_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignments;

-- Done! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
