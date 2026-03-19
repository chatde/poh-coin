-- ============================================================
-- Migration v9 — Charity Applications + Newsletter Subscribers
-- Created: 2026-03-09
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Charity Applications ──────────────────────────────────
CREATE TABLE IF NOT EXISTS charity_applications (
  id                bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  org_name          text NOT NULL,
  contact_name      text NOT NULL,
  contact_email     text NOT NULL CHECK (contact_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  mission           text NOT NULL,
  amount_requested  numeric(18, 2),
  wallet_address    text,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_charity_applications_status   ON charity_applications(status);
CREATE INDEX idx_charity_applications_email    ON charity_applications(contact_email);
CREATE INDEX idx_charity_applications_created  ON charity_applications(created_at DESC);

-- RLS
ALTER TABLE charity_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (public INSERT — must arrive as 'pending')
CREATE POLICY "Anyone can submit charity application"
  ON charity_applications FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND contact_email IS NOT NULL
    AND length(contact_email) >= 5
  );

-- No public reads — reviewed via service_role only
-- (Admins access via Supabase dashboard / service_role key)

-- ── Newsletter Subscribers ────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email            text NOT NULL UNIQUE CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  consent_given    boolean NOT NULL DEFAULT true,
  source           text NOT NULL DEFAULT 'website',
  subscribed_at    timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at  timestamptz
);

-- Index for lookup
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);

-- RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (must give consent)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (
    consent_given = true
    AND email IS NOT NULL
    AND unsubscribed_at IS NULL
  );

-- Subscribers can unsubscribe — row must be active, result must set unsubscribed_at
CREATE POLICY "Subscribers can unsubscribe"
  ON newsletter_subscribers FOR UPDATE
  USING (unsubscribed_at IS NULL)
  WITH CHECK (unsubscribed_at IS NOT NULL);

-- No public SELECT — list managed via service_role
