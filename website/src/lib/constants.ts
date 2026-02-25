// ── Proof of Planet Constants ─────────────────────────────────────────

// Emission model: 536M POH/year starting rate with 5% annual RTG decay
export const STARTING_ANNUAL_EMISSION = 536_000_000;
export const RTG_DECAY_RATE = 0.95; // 5% annual decay
export const WEEKS_PER_YEAR = 52;

// Launch date — testnet launch
export const LAUNCH_DATE = new Date("2026-02-21T00:00:00Z");

// ── Voyager Block System ───────────────────────────────────────────────

/** 1 block = 1,000 km of Voyager travel beyond launch distance */
export const BLOCK_SIZE_KM = 1_000;

/** Minimum tasks required per block (early network) */
export const TASKS_PER_BLOCK_MIN = 20;

/** Maximum tasks required per block (at scale, 1000+ miners) */
export const TASKS_PER_BLOCK_MAX = 200;

/** Voyager 1 distance at token launch — the fixed initial supply in km */
export const VOYAGER_LAUNCH_KM = 24_526_000_000;

/** Reference epoch: Jan 1, 2026 00:00:00 UTC (Unix seconds) */
export const VOYAGER_REF_EPOCH = 1_735_689_600;

/** Voyager 1 distance at reference epoch (km from Sun) */
export const VOYAGER_REF_KM = 25_316_070_000;

/** Voyager 1 velocity in km/day */
export const VOYAGER_VELOCITY_KM_DAY = 1_458_648;

/** Expected blocks per day (~1,459) */
export const BLOCKS_PER_DAY = Math.floor(VOYAGER_VELOCITY_KM_DAY / BLOCK_SIZE_KM);

/** Expected blocks per week (~10,213) */
export const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * 7;

/** Year 1 total block emission budget (POH) */
export const YEAR_1_EMISSION = STARTING_ANNUAL_EMISSION;

/** Block reward distribution splits */
export const BLOCK_REWARD_SPLIT = {
  /** Miner who solved the block equation */
  EQUATION_SOLVER: 0.60,
  /** Distributed among compute task contributors */
  TASK_CONTRIBUTORS: 0.30,
  /** F@H + BOINC bonus pool */
  SCIENCE_BONUS: 0.10,
} as const;

// Pool split
export const DATA_NODE_SHARE = 0.80; // 80% to data nodes
export const VALIDATOR_SHARE = 0.20; // 20% to validators

// Quality & streak bonuses
export const QUALITY_BONUS = 0.25;        // +25% for verified correct results
export const STREAK_7D_BONUS = 0.10;      // +10% for 7-day streak
export const STREAK_30D_BONUS = 0.25;     // +25% for 30-day streak

// Trust ramp (weeks 1-4)
export const TRUST_RAMP = [0.25, 0.50, 0.75, 1.00];

// Geographic decay (devices in same H3 cell)
export const GEO_DECAY = [1.00, 0.80, 0.65, 0.50]; // 1st, 2nd, 3rd, 4th+ device

// Daily cap: max 0.1% of weekly pool per device per day
export const DAILY_CAP_PCT = 0.001;

// Referral bonus
export const REFERRAL_BONUS = 0.10;       // +10% for 30 days
export const REFERRAL_DURATION_DAYS = 30;

// Heartbeat interval
export const HEARTBEAT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
export const HEARTBEAT_GRACE_MS = 5 * 60 * 1000;     // 5 min grace period

// Vesting tiers
export const NEW_MINER_IMMEDIATE = 0.25;
export const NEW_MINER_VESTING = 0.75;
export const NEW_MINER_VESTING_DAYS = 180;
export const VETERAN_IMMEDIATE = 0.75;
export const VETERAN_VESTING = 0.25;
export const VETERAN_VESTING_DAYS = 30;
export const VETERAN_THRESHOLD_DAYS = 180; // 6 months to become veteran

// Validator staking
export const VALIDATOR_STAKED_MULTIPLIER = 2; // Staked validators earn 2x
export const SLASH_PERCENTAGE = 0.10;         // 10% of stake per offense

// Battery safety
export const THROTTLE_TEMP_C = 40;
export const STOP_TEMP_C = 45;

// Reputation
export const STARTING_REPUTATION = 10;
export const MAX_REPUTATION = 100;
export const REPUTATION_PER_DAY = 1;       // +1/day for verified work
export const ACHIEVEMENT_REP_BONUS = 5;    // +5 per achievement

// Schools
export const SCHOOL_DEVICE_CAP = 10;       // Schools can register up to 10 devices

// ── Graduated Penalties ──────────────────────────────────────────────
export const PENALTY_BASE = 2;             // 2^failureCount: 1, 2, 4, 8, 16...
export const AUTO_DEACTIVATE_REPUTATION = 0; // Deactivate at reputation 0

// ── Device Capability Tiers ──────────────────────────────────────────
export const TIER_THRESHOLDS = {
  TIER_3_CPU_MS: 200,
  TIER_3_CORES: 8,
  TIER_3_MEMORY_GB: 8,
  TIER_2_CPU_MS: 500,
  TIER_2_CORES: 4,
  TIER_2_MEMORY_GB: 4,
};

// ── Fitness Mining Config ────────────────────────────────────────────
export const FITNESS = {
  HR_ZONE_FACTORS: [0, 0.5, 1.0, 1.5, 2.0, 2.5] as readonly number[],  // zones 0-5
  CONSISTENCY_BONUS_PER_DAY: 0.05,  // +5% per consecutive day
  CONSISTENCY_BONUS_CAP: 1.5,       // max 50% bonus (10 consecutive days)
  MAX_ACTIVITIES_PER_DAY: 20,
  MAX_EFFORT_PER_DAY: 500,          // cap to prevent gaming
  MIN_DURATION_MINUTES: 5,          // ignore <5 min activities
  POOL_SPLIT_BASE: 0.7,             // 70% compute, 30% fitness (adjusts dynamically)
  POOL_SPLIT_MIN_COMPUTE: 0.5,      // Min 50% to compute pool
  POOL_SPLIT_MAX_COMPUTE: 0.85,     // Max 85% to compute pool
} as const;

/**
 * Calculate the weekly pool for a given date
 */
export function calculateWeeklyPool(date: Date = new Date()): number {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsElapsed = (date.getTime() - LAUNCH_DATE.getTime()) / msPerYear;
  if (yearsElapsed < 0) return 0;

  const decayFactor = Math.pow(RTG_DECAY_RATE, yearsElapsed);
  const annualEmission = STARTING_ANNUAL_EMISSION * decayFactor;
  return annualEmission / WEEKS_PER_YEAR;
}
