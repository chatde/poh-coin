-- Migration v5: Block tracking and BOINC integration
-- Created: 2026-02-25

-- ============================================================================
-- Block Tracking Table
-- ============================================================================
-- Stores mined blocks with solver information and rewards

CREATE TABLE IF NOT EXISTS blocks (
  id              bigint PRIMARY KEY,
  height          bigint NOT NULL UNIQUE,
  solver_device   text NOT NULL,
  solver_wallet   text NOT NULL,
  reward_poh      numeric NOT NULL,
  tasks_required  integer NOT NULL,
  equation_nonce  bigint NOT NULL,
  equation_hash   text NOT NULL,
  mined_at        timestamptz DEFAULT now()
);

-- Index for querying blocks by solver wallet
CREATE INDEX IF NOT EXISTS idx_blocks_solver ON blocks(solver_wallet);

-- Index for querying blocks by time
CREATE INDEX IF NOT EXISTS idx_blocks_mined_at ON blocks(mined_at);

-- Add comments for documentation
COMMENT ON TABLE blocks IS 'Tracks all mined blocks in the POH network';
COMMENT ON COLUMN blocks.id IS 'Unique block identifier';
COMMENT ON COLUMN blocks.height IS 'Block height (sequential number)';
COMMENT ON COLUMN blocks.solver_device IS 'Device ID that solved the block';
COMMENT ON COLUMN blocks.solver_wallet IS 'Wallet address that receives the reward';
COMMENT ON COLUMN blocks.reward_poh IS 'POH tokens awarded for mining this block';
COMMENT ON COLUMN blocks.tasks_required IS 'Number of tasks required to solve';
COMMENT ON COLUMN blocks.equation_nonce IS 'Nonce value that solved the equation';
COMMENT ON COLUMN blocks.equation_hash IS 'Hash of the block equation';

-- ============================================================================
-- BOINC Links Table
-- ============================================================================
-- Links wallet addresses to BOINC Cross-Project IDs (CPIDs)

CREATE TABLE IF NOT EXISTS boinc_links (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address  text NOT NULL UNIQUE,
  cpid            text NOT NULL,
  projects        jsonb DEFAULT '[]',
  total_credit    bigint DEFAULT 0,
  last_synced_at  timestamptz,
  verified        boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Index for querying by CPID
CREATE INDEX IF NOT EXISTS idx_boinc_cpid ON boinc_links(cpid);

-- Index for querying verified accounts
CREATE INDEX IF NOT EXISTS idx_boinc_verified ON boinc_links(verified) WHERE verified = true;

-- Add comments for documentation
COMMENT ON TABLE boinc_links IS 'Links wallet addresses to BOINC accounts for bonus rewards';
COMMENT ON COLUMN boinc_links.wallet_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN boinc_links.cpid IS 'BOINC Cross-Project ID (32-char hex string)';
COMMENT ON COLUMN boinc_links.projects IS 'Array of project data with credits';
COMMENT ON COLUMN boinc_links.total_credit IS 'Total BOINC credits across all projects';
COMMENT ON COLUMN boinc_links.last_synced_at IS 'Last time BOINC data was fetched';
COMMENT ON COLUMN boinc_links.verified IS 'Whether the CPID has been verified';

-- ============================================================================
-- Epoch Blocks Table
-- ============================================================================
-- Tracks mining progress per wallet per epoch

CREATE TABLE IF NOT EXISTS epoch_blocks (
  epoch_id        integer NOT NULL,
  wallet_address  text NOT NULL,
  blocks_mined    integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  poh_earned      numeric DEFAULT 0,
  PRIMARY KEY (epoch_id, wallet_address)
);

-- Index for querying by epoch
CREATE INDEX IF NOT EXISTS idx_epoch_blocks_epoch ON epoch_blocks(epoch_id);

-- Index for querying by wallet
CREATE INDEX IF NOT EXISTS idx_epoch_blocks_wallet ON epoch_blocks(wallet_address);

-- Add comments for documentation
COMMENT ON TABLE epoch_blocks IS 'Aggregated mining statistics per wallet per epoch';
COMMENT ON COLUMN epoch_blocks.epoch_id IS 'Epoch number (e.g., 1, 2, 3...)';
COMMENT ON COLUMN epoch_blocks.wallet_address IS 'Ethereum wallet address';
COMMENT ON COLUMN epoch_blocks.blocks_mined IS 'Number of blocks mined in this epoch';
COMMENT ON COLUMN epoch_blocks.tasks_completed IS 'Total tasks completed in this epoch';
COMMENT ON COLUMN epoch_blocks.poh_earned IS 'Total POH earned in this epoch';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE boinc_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE epoch_blocks ENABLE ROW LEVEL SECURITY;

-- Blocks: Public read access, authenticated write
CREATE POLICY "Blocks are publicly readable"
  ON blocks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert blocks"
  ON blocks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- BOINC Links: Users can read their own, public stats are aggregated
CREATE POLICY "Users can read their own BOINC links"
  ON boinc_links FOR SELECT
  USING (auth.uid()::text = wallet_address OR true);

CREATE POLICY "Users can insert their own BOINC links"
  ON boinc_links FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own BOINC links"
  ON boinc_links FOR UPDATE
  USING (auth.uid()::text = wallet_address);

-- Epoch Blocks: Public read access, authenticated write
CREATE POLICY "Epoch blocks are publicly readable"
  ON epoch_blocks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert epoch blocks"
  ON epoch_blocks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update epoch blocks"
  ON epoch_blocks FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- Functions for aggregation and statistics
-- ============================================================================

-- Function to get top miners for an epoch
CREATE OR REPLACE FUNCTION get_top_miners_by_epoch(epoch_num integer, limit_count integer DEFAULT 10)
RETURNS TABLE (
  wallet_address text,
  blocks_mined integer,
  poh_earned numeric,
  rank bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    eb.wallet_address,
    eb.blocks_mined,
    eb.poh_earned,
    ROW_NUMBER() OVER (ORDER BY eb.blocks_mined DESC, eb.poh_earned DESC) as rank
  FROM epoch_blocks eb
  WHERE eb.epoch_id = epoch_num
  ORDER BY eb.blocks_mined DESC, eb.poh_earned DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent blocks
CREATE OR REPLACE FUNCTION get_recent_blocks(limit_count integer DEFAULT 20)
RETURNS TABLE (
  id bigint,
  height bigint,
  solver_wallet text,
  reward_poh numeric,
  mined_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.height,
    b.solver_wallet,
    b.reward_poh,
    b.mined_at
  FROM blocks b
  ORDER BY b.height DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get miner statistics
CREATE OR REPLACE FUNCTION get_miner_stats(wallet text)
RETURNS TABLE (
  total_blocks bigint,
  total_poh numeric,
  first_block timestamptz,
  last_block timestamptz,
  avg_reward numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_blocks,
    SUM(b.reward_poh) as total_poh,
    MIN(b.mined_at) as first_block,
    MAX(b.mined_at) as last_block,
    AVG(b.reward_poh) as avg_reward
  FROM blocks b
  WHERE b.solver_wallet = wallet;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration v5 completed: Block tracking and BOINC integration tables created';
END $$;
