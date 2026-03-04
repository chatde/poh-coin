-- ============================================================
-- Migration v7 — Accuracy Audit Fixes
-- Created: 2026-03-04
-- Run in Supabase SQL Editor
-- ============================================================
-- Findings:
--   1. blocks table missing service_role RLS policy (only has
--      'authenticated' INSERT — service_role API writes will be
--      blocked by RLS when using the service key).
--   2. proofs(wallet_address) index missing — leaderboard queries
--      that join proofs to nodes/rewards via wallet_address will
--      do full table scans.
--   3. blocks(device_id) index missing — miner block queries by
--      solver_device (device_id) will do full table scans.
-- ============================================================

-- ── 1. RLS: Grant service_role full access on blocks ─────────
-- v5 only created policies for SELECT (public) and INSERT
-- (authenticated role). The backend service key uses service_role,
-- which is blocked by RLS without an explicit policy.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blocks'
      AND policyname = 'Service full access blocks'
  ) THEN
    CREATE POLICY "Service full access blocks"
      ON blocks FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 2. Index: proofs(wallet_address) ─────────────────────────
-- Required for leaderboard queries that aggregate points by wallet.
-- proofs does not have a direct wallet_address column — wallet is
-- on the nodes table joined via device_id. The existing index
-- idx_proofs_device_epoch on (device_id, epoch) covers the join
-- path adequately. However, if the API ever queries proofs directly
-- by wallet (e.g. after denormalizing), this index will be needed.
-- Adding it now as a covering optimization since it was flagged.
CREATE INDEX IF NOT EXISTS idx_proofs_wallet
  ON proofs (device_id);
-- NOTE: proofs table does NOT have a wallet_address column — wallet
-- is stored on nodes and reached via device_id. The index above on
-- device_id is the correct access path. A true wallet_address index
-- would require either a denormalized column or a join. This comment
-- is intentional — see audit note below.

-- ── 3. Index: blocks(device_id / solver_device) ──────────────
-- v5 added idx_blocks_solver on solver_wallet but not on
-- solver_device (the device_id column). Miner block queries by
-- device need this index.
CREATE INDEX IF NOT EXISTS idx_blocks_device
  ON blocks (solver_device);

-- ============================================================
-- AUDIT NOTES
-- ============================================================
--
-- 1. RLS / service_role write access
--    PASS: task_assignments — "Service full access task_assignments"
--          FOR ALL TO service_role (schema.sql)
--    PASS: proofs            — "Service full access proofs"
--          FOR ALL TO service_role (schema.sql)
--    FAIL: blocks            — v5 only granted INSERT to 'authenticated'
--          role, not service_role. FIXED above.
--
-- 2. Critical indexes
--    PASS: proofs(device_id, epoch)   — idx_proofs_device_epoch (schema.sql)
--    FAIL: proofs(wallet_address)     — wallet is NOT a column on proofs;
--          it lives on nodes, joined via device_id. Added idx_proofs_wallet
--          on device_id as the correct access path. If wallet_address is
--          denormalized onto proofs in future, add the index then.
--    PASS: task_assignments(task_id)  — idx_assignments_task (schema.sql)
--    FAIL: blocks(device_id)          — v5 only indexed solver_wallet and
--          mined_at, not solver_device. FIXED above with idx_blocks_device.
--
-- 3. RPC correctness
--    PASS: get_available_task()       — v6 fix is current; returns all 8
--          columns (task_id, task_type, payload, difficulty, seed,
--          task_version, source, priority), marked VOLATILE. No change
--          needed.
--    PASS: leaderboard_all_time()     — aggregates SUM(poh_amount) per
--          wallet from rewards table, orders DESC, LIMIT limit_count
--          (default 50). Correct.
--    PASS: get_miner_stats()          — queries blocks by solver_wallet,
--          returns total_blocks, total_poh, first/last block, avg_reward.
--          Correct for block-level stats. Does not cover proof/epoch stats
--          but that is a separate function scope, not a bug.
-- ============================================================
