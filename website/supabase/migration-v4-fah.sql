-- ============================================================
-- Migration v4 — Folding@Home Links
-- Run in Supabase SQL Editor
-- ============================================================

-- Folding@Home links — maps wallet addresses to F@H usernames
CREATE TABLE IF NOT EXISTS fah_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL UNIQUE,
  fah_username text NOT NULL,
  fah_score bigint DEFAULT 0,
  fah_wus bigint DEFAULT 0,
  last_synced_at timestamptz,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fah_links_wallet ON fah_links (wallet_address);
CREATE INDEX IF NOT EXISTS idx_fah_links_verified ON fah_links (verified) WHERE verified = TRUE;

-- Row Level Security
ALTER TABLE fah_links ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see F@H links)
CREATE POLICY "fah_links_read" ON fah_links FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service full access fah_links" ON fah_links FOR ALL TO service_role USING (true);
