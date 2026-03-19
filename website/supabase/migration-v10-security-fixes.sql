-- ============================================================
-- Migration v10 — Security Lint Fixes
-- Resolves all Supabase Performance & Security Lint findings
-- Project: dvllflvnhsaxwelmntqi
-- Created: 2026-03-11
-- ============================================================

-- ── 1. GHB Admin Tables — Enable RLS (ERROR) ─────────────────
-- Tables ghb_notes and ghb_todos are in the public schema with no RLS.
-- These are internal admin-only tables. Enabling RLS with no policies
-- blocks all anon/authenticated access. service_role bypasses RLS and
-- retains full access for the admin dashboard.

ALTER TABLE ghb_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghb_todos ENABLE ROW LEVEL SECURITY;

-- ── 2. Fix Mutable search_path on Functions (WARN) ───────────
-- All six functions are missing a fixed search_path, which allows a
-- malicious user to manipulate search_path and shadow built-in functions.
--
-- ghb_update_updated_at: no table refs — use empty search_path (strictest)
-- All others: query public schema tables — use search_path = public

ALTER FUNCTION ghb_update_updated_at()
  SET search_path = '';

ALTER FUNCTION get_top_miners_by_epoch(integer, integer)
  SET search_path = public;

ALTER FUNCTION get_recent_blocks(integer)
  SET search_path = public;

ALTER FUNCTION get_miner_stats(text)
  SET search_path = public;

ALTER FUNCTION get_available_task(text)
  SET search_path = public;

ALTER FUNCTION leaderboard_all_time(integer)
  SET search_path = public;

-- ── 3. network_stats — Remove from Public API (WARN) ─────────
-- The materialized view is accessible to anon/authenticated roles via
-- the Supabase REST API. Since no frontend code queries it directly,
-- revoke the default public schema grants.
-- Data is now accessible via the get_network_stats() RPC function instead.

REVOKE SELECT ON public.network_stats FROM anon, authenticated;

-- Wrapper function for controlled access
CREATE OR REPLACE FUNCTION get_network_stats()
RETURNS TABLE (
  active_nodes       bigint,
  active_validators  bigint,
  verified_tasks     bigint,
  total_distributed  numeric,
  unique_miners      bigint,
  current_epoch      integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    active_nodes,
    active_validators,
    verified_tasks,
    total_distributed,
    unique_miners,
    current_epoch
  FROM public.network_stats;
$$;

GRANT EXECUTE ON FUNCTION get_network_stats() TO anon, authenticated;

-- ── 4. boinc_links INSERT — Require authentication (WARN) ────
-- Current policy allows anyone to insert (WITH CHECK (true)).
-- Restrict to authenticated users; wallet ownership is validated
-- by the UPDATE policy which uses auth.uid()::text = wallet_address.

DROP POLICY IF EXISTS "Users can insert their own BOINC links" ON boinc_links;

CREATE POLICY "Users can insert their own BOINC links"
  ON boinc_links FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ── 5. charity_applications INSERT — Add meaningful check (WARN)
-- Public submissions are intentional but WITH CHECK (true) is too
-- permissive. Enforce that submissions arrive in 'pending' status.

DROP POLICY IF EXISTS "Anyone can submit charity application" ON charity_applications;

CREATE POLICY "Anyone can submit charity application"
  ON charity_applications FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND contact_email IS NOT NULL
    AND length(contact_email) >= 5
  );

-- ── 6. newsletter_subscribers — Fix both policies (WARN) ─────
-- INSERT: WITH CHECK (true) allows subscribing without consent.
--         Require consent_given = true.
-- UPDATE: USING (true) WITH CHECK (true) allows anyone to modify any row.
--         Restrict to: can only set unsubscribed_at on active subscriptions.

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Subscribers can unsubscribe" ON newsletter_subscribers;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (
    consent_given = true
    AND email IS NOT NULL
    AND unsubscribed_at IS NULL
  );

-- Unsubscribe: row must be active (unsubscribed_at IS NULL) before update,
-- and result must have unsubscribed_at set (actually unsubscribing).
CREATE POLICY "Subscribers can unsubscribe"
  ON newsletter_subscribers FOR UPDATE
  USING (unsubscribed_at IS NULL)
  WITH CHECK (unsubscribed_at IS NOT NULL);

-- ── Migration Complete ────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE 'Migration v10 complete: all security lint findings resolved';
END $$;
