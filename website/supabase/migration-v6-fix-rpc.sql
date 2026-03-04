-- ============================================================
-- Migration v6 — Fix get_available_task RPC + add previous_epoch_wus
-- Created: 2026-03-03
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Fix get_available_task RPC ────────────────────────────────
-- Ensures all columns (task_id, task_type, payload, difficulty, seed,
-- task_version, source, priority) are returned and volatility is VOLATILE
-- so Postgres does not cache results between calls.
CREATE OR REPLACE FUNCTION get_available_task(p_device_id TEXT)
RETURNS TABLE (
  task_id      UUID,
  task_type    TEXT,
  payload      JSONB,
  difficulty   SMALLINT,
  seed         TEXT,
  task_version TEXT,
  source       TEXT,
  priority     SMALLINT
) AS $$
  SELECT
    ct.task_id,
    ct.task_type,
    ct.payload,
    ct.difficulty,
    ct.seed,
    ct.task_version,
    ct.source,
    ct.priority
  FROM compute_tasks ct
  WHERE ct.status IN ('pending', 'assigned')
    AND ct.task_id NOT IN (
      SELECT ta.task_id
      FROM task_assignments ta
      WHERE ta.device_id = p_device_id
    )
    AND (
      SELECT COUNT(*)
      FROM task_assignments ta
      WHERE ta.task_id = ct.task_id
    ) < 3
  ORDER BY ct.priority ASC, ct.created_at ASC
  LIMIT 1;
$$ LANGUAGE sql VOLATILE;

-- ── Add previous_epoch_wus column to fah_links ───────────────
-- Used by epoch-close to compute delta WUs per epoch rather than
-- all-time WUs (prevents double-counting F@H contributions).
ALTER TABLE fah_links
  ADD COLUMN IF NOT EXISTS previous_epoch_wus BIGINT DEFAULT 0;

-- Backfill: set previous_epoch_wus = fah_wus for existing rows
-- so first epoch after this migration only counts new WUs going forward.
UPDATE fah_links
SET previous_epoch_wus = COALESCE(fah_wus, 0)
WHERE previous_epoch_wus IS NULL OR previous_epoch_wus = 0;
