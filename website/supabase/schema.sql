-- ============================================================
-- Proof of Planet — Supabase Database Schema
-- Run this in Supabase SQL Editor to initialize the database
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Nodes ────────────────────────────────────────────────────
-- Mining devices registered to the network
CREATE TABLE nodes (
  device_id          TEXT PRIMARY KEY,
  wallet_address     TEXT NOT NULL,
  tier               SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2)),
  h3_cell            TEXT,                           -- H3 hex at resolution 7 (~5km²)
  reputation         INTEGER NOT NULL DEFAULT 10,    -- 0-100 scale, start at 10
  registered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat     TIMESTAMPTZ,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  trust_week         SMALLINT NOT NULL DEFAULT 1,    -- 1-4, week of trust ramp
  fingerprint_hash   TEXT,                           -- SHA-256 device fingerprint
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE  -- EIP-191 wallet signature verified
);

CREATE INDEX idx_nodes_wallet ON nodes (wallet_address);
CREATE INDEX idx_nodes_h3 ON nodes (h3_cell);
CREATE INDEX idx_nodes_active ON nodes (is_active) WHERE is_active = TRUE;

-- ── Compute Tasks ────────────────────────────────────────────
-- WASM work units distributed to phones
CREATE TABLE compute_tasks (
  task_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type       TEXT NOT NULL CHECK (task_type IN ('protein', 'climate', 'signal', 'drugscreen', 'fitness_verify')),
  payload         JSONB NOT NULL,                 -- Task parameters
  difficulty      SMALLINT NOT NULL DEFAULT 1,    -- Expected relative difficulty
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'failed', 'ai_rejected')),
  source          TEXT,                           -- Data provenance (e.g. 'rcsb_pdb', 'usgs', 'terra')
  priority        SMALLINT NOT NULL DEFAULT 5,    -- Lower = higher priority (fitness_verify = 3)
  deadline        TIMESTAMPTZ,                    -- Optional deadline for time-sensitive tasks
  seed            TEXT,                           -- Deterministic seed for reproducibility
  task_version    TEXT DEFAULT '2.0.0',           -- Version for backward compat
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON compute_tasks (status) WHERE status = 'pending';

-- ── Task Assignments ─────────────────────────────────────────
-- Tracks which devices are assigned to which tasks (2-of-3 redundancy)
CREATE TABLE task_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id           UUID NOT NULL REFERENCES compute_tasks(task_id),
  device_id         TEXT NOT NULL REFERENCES nodes(device_id),
  result            JSONB,
  compute_time_ms   INTEGER,
  submitted_at      TIMESTAMPTZ,
  is_match          BOOLEAN,                        -- NULL until verified
  computation_proof JSONB,                          -- {inputHash, outputHash, intermediateHashes, workerVersion}
  ai_confidence     NUMERIC,                        -- AI verifier confidence score
  ai_flags          JSONB,                          -- AI verifier flags
  assigned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_task ON task_assignments (task_id);
CREATE INDEX idx_assignments_device ON task_assignments (device_id);

-- ── Heartbeats ───────────────────────────────────────────────
-- Signed challenge-response every 15 minutes
CREATE TABLE heartbeats (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id       TEXT NOT NULL REFERENCES nodes(device_id),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  battery_pct     SMALLINT,
  temperature_c   SMALLINT,                       -- Device temp for throttle monitoring
  compute_status  TEXT CHECK (compute_status IN ('active', 'throttled', 'idle', 'stopped', 'pending')),
  challenge       TEXT NOT NULL,
  response        TEXT,
  memory_usage_mb INTEGER,                        -- Performance API memory tracking
  worker_active   BOOLEAN                         -- Whether compute worker is running
);

CREATE INDEX idx_heartbeats_device ON heartbeats (device_id, timestamp DESC);

-- Partition heartbeats by month for performance (optional, configure in Supabase)
-- CREATE TABLE heartbeats_2026_02 PARTITION OF heartbeats FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- ── Proofs ───────────────────────────────────────────────────
-- Hourly proof of work submissions per device per epoch
CREATE TABLE proofs (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id       TEXT NOT NULL REFERENCES nodes(device_id),
  epoch           INTEGER NOT NULL,
  points_earned   NUMERIC NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  quality_verified BOOLEAN NOT NULL DEFAULT FALSE,
  streak_days     INTEGER NOT NULL DEFAULT 0,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proofs_epoch ON proofs (epoch);
CREATE INDEX idx_proofs_device_epoch ON proofs (device_id, epoch);

-- ── Epochs ───────────────────────────────────────────────────
-- Weekly Sunday-Saturday mining epochs
CREATE TABLE epochs (
  epoch_number    INTEGER PRIMARY KEY,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  merkle_root     TEXT,                           -- bytes32 hex string
  total_points    NUMERIC NOT NULL DEFAULT 0,
  total_devices   INTEGER NOT NULL DEFAULT 0,
  weekly_pool     NUMERIC NOT NULL,               -- POH tokens available this week
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'finalized')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  finalized_at    TIMESTAMPTZ
);

-- ── Rewards ──────────────────────────────────────────────────
-- Final calculated rewards per wallet per epoch (after all bonuses applied)
CREATE TABLE rewards (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address  TEXT NOT NULL,
  epoch           INTEGER NOT NULL REFERENCES epochs(epoch_number),
  total_points    NUMERIC NOT NULL,
  poh_amount      NUMERIC NOT NULL,               -- Total POH earned (18 decimals stored as text-compatible numeric)
  claimable_now   NUMERIC NOT NULL,               -- Immediate portion
  vesting_amount  NUMERIC NOT NULL DEFAULT 0,     -- Locked portion
  vesting_duration_days INTEGER NOT NULL DEFAULT 0,
  claimed         BOOLEAN NOT NULL DEFAULT FALSE,
  merkle_proof    JSONB,                          -- bytes32[] proof for this leaf
  UNIQUE (wallet_address, epoch)
);

CREATE INDEX idx_rewards_wallet ON rewards (wallet_address);
CREATE INDEX idx_rewards_epoch ON rewards (epoch);
CREATE INDEX idx_rewards_unclaimed ON rewards (claimed) WHERE claimed = FALSE;

-- ── Referrals ────────────────────────────────────────────────
-- +10% bonus points for both referrer and invitee for 30 days
CREATE TABLE referrals (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referrer_wallet TEXT NOT NULL,
  invitee_wallet  TEXT NOT NULL,
  referral_code   TEXT NOT NULL UNIQUE,
  bonus_expires_at TIMESTAMPTZ NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_code ON referrals (referral_code);
CREATE INDEX idx_referrals_referrer ON referrals (referrer_wallet);
CREATE INDEX idx_referrals_invitee ON referrals (invitee_wallet);

-- ── Achievements ─────────────────────────────────────────────
-- Golden Record achievements + distance milestones
CREATE TABLE achievements (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address  TEXT NOT NULL,
  achievement_id  TEXT NOT NULL,                   -- e.g. 'golden_record_bach', 'milestone_moon'
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('golden_record', 'distance_milestone', 'mission_date', 'streak', 'general')),
  reputation_bonus INTEGER NOT NULL DEFAULT 5,
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_address, achievement_id)
);

CREATE INDEX idx_achievements_wallet ON achievements (wallet_address);

-- ── Streak Tracking ──────────────────────────────────────────
-- Daily activity tracking for streak bonuses
CREATE TABLE streaks (
  wallet_address  TEXT NOT NULL,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  PRIMARY KEY (wallet_address)
);

-- ── Data Cache ──────────────────────────────────────────────────
-- Caches external API responses (RCSB PDB, USGS, NOAA, NCI) with 24hr TTL
CREATE TABLE data_cache (
  cache_key   TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  source_url  TEXT NOT NULL,
  fetched_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_data_cache_expires ON data_cache (expires_at);

-- ── Fitness Connections ─────────────────────────────────────────
-- Direct OAuth connections to Strava and Fitbit
CREATE TABLE fitness_connections (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address    TEXT NOT NULL,
  device_id         TEXT NOT NULL REFERENCES nodes(device_id),
  provider_user_id  TEXT UNIQUE NOT NULL,
  provider          TEXT NOT NULL,                   -- 'strava', 'fitbit'
  access_token      TEXT,
  refresh_token     TEXT,
  token_expires_at  TIMESTAMPTZ,
  connected_at      TIMESTAMPTZ DEFAULT NOW(),
  last_sync         TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_fitness_conn_wallet ON fitness_connections (wallet_address);
CREATE INDEX idx_fitness_conn_device ON fitness_connections (device_id);
CREATE UNIQUE INDEX idx_fitness_conn_wallet_provider ON fitness_connections (wallet_address, provider) WHERE is_active = TRUE;

-- ── Fitness Activities ──────────────────────────────────────────
-- Individual workout/activity records from wearables
CREATE TABLE fitness_activities (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address  TEXT NOT NULL,
  device_id       TEXT NOT NULL REFERENCES nodes(device_id),
  activity_hash   TEXT UNIQUE NOT NULL,            -- dedup key: hash(user+start+type+duration)
  activity_type   TEXT NOT NULL,                   -- 'run', 'walk', 'cycle', 'swim', 'workout'
  duration_min    NUMERIC NOT NULL,
  active_minutes  NUMERIC NOT NULL,
  avg_heart_rate  SMALLINT,
  hr_zone_minutes JSONB,                          -- {zone1: 5, zone2: 10, zone3: 8, zone4: 2, zone5: 0}
  calories        NUMERIC,
  distance_m      NUMERIC,
  effort_score    NUMERIC NOT NULL,
  source_provider TEXT NOT NULL,
  raw_data_hash   TEXT NOT NULL,                   -- SHA-256 of raw Terra payload for audit
  verified        BOOLEAN DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fitness_activities_wallet ON fitness_activities (wallet_address);
CREATE INDEX idx_fitness_activities_device ON fitness_activities (device_id);
CREATE INDEX idx_fitness_activities_unverified ON fitness_activities (verified) WHERE verified = FALSE;

-- ── Device Fingerprints ─────────────────────────────────────────
-- Canvas + WebGL + audio fingerprints for sybil resistance
CREATE TABLE device_fingerprints (
  fingerprint_hash TEXT PRIMARY KEY,
  device_id        TEXT NOT NULL REFERENCES nodes(device_id),
  wallet_address   TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fingerprints_wallet ON device_fingerprints (wallet_address);

-- ── Rate Limits ─────────────────────────────────────────────────
-- Sliding window counters for registration, tasks, submissions, fitness
CREATE TABLE rate_limits (
  key          TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX idx_rate_limits_key ON rate_limits (key);

-- ── Verification Failures ───────────────────────────────────────
-- Track compute outliers, proof mismatches, and fitness fraud
CREATE TABLE verification_failures (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id    TEXT NOT NULL REFERENCES nodes(device_id),
  task_id      UUID NOT NULL,
  failure_type TEXT NOT NULL,                     -- 'consensus_outlier', 'reference_mismatch', 'proof_invalid', 'fitness_fraud'
  penalty      INTEGER NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vf_device ON verification_failures (device_id);

-- ── Device Benchmarks ───────────────────────────────────────────
-- CPU/memory/core benchmark results for task difficulty scaling
CREATE TABLE device_benchmarks (
  device_id       TEXT PRIMARY KEY REFERENCES nodes(device_id),
  cpu_score_ms    INTEGER NOT NULL,
  max_memory_mb   INTEGER NOT NULL,
  cores           INTEGER NOT NULL,
  capability_tier SMALLINT DEFAULT 1,              -- 1=phone, 2=laptop, 3=desktop
  benchmarked_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Quality Scores ──────────────────────────────────────────────
-- Rolling 30-day quality metrics per device
CREATE TABLE quality_scores (
  device_id          TEXT PRIMARY KEY REFERENCES nodes(device_id),
  total_tasks_30d    INTEGER DEFAULT 0,
  verified_30d       INTEGER DEFAULT 0,
  fitness_verified   INTEGER DEFAULT 0,
  quality_pct        NUMERIC DEFAULT 0,
  uptime_pct         NUMERIC DEFAULT 0,
  computed_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Network Stats (materialized view for public API) ─────────
CREATE MATERIALIZED VIEW network_stats AS
SELECT
  (SELECT COUNT(*) FROM nodes WHERE is_active = TRUE) AS active_nodes,
  (SELECT COUNT(*) FROM nodes WHERE tier = 2 AND is_active = TRUE) AS active_validators,
  (SELECT COUNT(DISTINCT task_id) FROM task_assignments WHERE is_match = TRUE) AS verified_tasks,
  (SELECT COALESCE(SUM(poh_amount), 0) FROM rewards WHERE claimed = TRUE) AS total_distributed,
  (SELECT COUNT(DISTINCT wallet_address) FROM rewards) AS unique_miners,
  (SELECT MAX(epoch_number) FROM epochs) AS current_epoch;

-- Refresh periodically via cron or after epoch close
-- REFRESH MATERIALIZED VIEW network_stats;

-- ── RPC Functions ────────────────────────────────────────────

-- Get all-time leaderboard (total POH earned per wallet)
CREATE OR REPLACE FUNCTION leaderboard_all_time(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (wallet_address TEXT, poh_amount NUMERIC) AS $$
  SELECT wallet_address, SUM(poh_amount) AS poh_amount
  FROM rewards
  GROUP BY wallet_address
  ORDER BY poh_amount DESC
  LIMIT limit_count;
$$ LANGUAGE sql STABLE;

-- Get an available task for a device (priority-ordered, not already assigned, fewer than 3 assignments)
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

-- ── Row Level Security ───────────────────────────────────────
-- Enable RLS on all tables (Supabase best practice)
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compute_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_scores ENABLE ROW LEVEL SECURITY;

-- Service role (backend API) can do everything
-- These policies allow the Supabase service_role key full access
-- Public/anon access is restricted to read-only on specific tables

-- Public read access for leaderboard, stats, achievements
CREATE POLICY "Public read epochs" ON epochs FOR SELECT USING (true);
CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public read rewards" ON rewards FOR SELECT TO anon USING (true);

-- Backend (service_role) full access on all tables
CREATE POLICY "Service full access nodes" ON nodes FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access compute_tasks" ON compute_tasks FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access task_assignments" ON task_assignments FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access heartbeats" ON heartbeats FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access proofs" ON proofs FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access epochs" ON epochs FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access rewards" ON rewards FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access referrals" ON referrals FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access achievements" ON achievements FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access streaks" ON streaks FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access data_cache" ON data_cache FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access fitness_connections" ON fitness_connections FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access fitness_activities" ON fitness_activities FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access device_fingerprints" ON device_fingerprints FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access rate_limits" ON rate_limits FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access verification_failures" ON verification_failures FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access device_benchmarks" ON device_benchmarks FOR ALL TO service_role USING (true);
CREATE POLICY "Service full access quality_scores" ON quality_scores FOR ALL TO service_role USING (true);
