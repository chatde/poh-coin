// ── Block Reward Engine ────────────────────────────────────────────────
//
// Calculates POH block rewards tied to Voyager 1's distance and RTG decay.
//
// Key formula:
//   annualEmission(year) = 536M * 0.95^year
//   weeklyPool(year) = annualEmission / 52
//   blockReward(year) = weeklyPool / expectedBlocksPerWeek
//
// RTG decay converges: max 10.72B of 12.263B ever distributable.
// 1.54B permanently unreachable = intentional scarcity / Chase Fund seed.

import {
  STARTING_ANNUAL_EMISSION,
  RTG_DECAY_RATE,
  WEEKS_PER_YEAR,
  BLOCKS_PER_WEEK,
  BLOCKS_PER_DAY,
  LAUNCH_DATE,
  TASKS_PER_BLOCK_MIN,
  TASKS_PER_BLOCK_MAX,
  BLOCK_REWARD_SPLIT,
} from "./constants";

// ── Core Constants ─────────────────────────────────────────────────────

/** Total rewards pool (50% of 24.526B) */
export const REWARDS_POOL = 12_263_000_000;

/**
 * Maximum POH ever distributable via RTG decay (geometric series limit).
 * S = E0 / -ln(r) = 536M / -ln(0.95) = ~10.45B
 *
 * Using discrete sum for accuracy: S = E0 / (1 - r) = 536M / 0.05 = 10.72B
 */
export const MAX_DISTRIBUTABLE = STARTING_ANNUAL_EMISSION / (1 - RTG_DECAY_RATE);

/** POH permanently locked (never distributable even with infinite time) */
export const PERMANENTLY_LOCKED = REWARDS_POOL - MAX_DISTRIBUTABLE;

// ── Reward Calculations ────────────────────────────────────────────────

/** Years elapsed since launch */
export function getYearsElapsed(now: Date = new Date()): number {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1_000;
  return Math.max(0, (now.getTime() - LAUNCH_DATE.getTime()) / msPerYear);
}

/** Annual emission for a given year (0-indexed: year 0 = first year) */
export function getAnnualEmission(year: number): number {
  return STARTING_ANNUAL_EMISSION * Math.pow(RTG_DECAY_RATE, year);
}

/** Weekly emission pool for the current date */
export function getWeeklyPool(now: Date = new Date()): number {
  const years = getYearsElapsed(now);
  return getAnnualEmission(years) / WEEKS_PER_YEAR;
}

/** Block reward in POH for the current date (total per block) */
export function getBlockReward(now: Date = new Date()): number {
  return getWeeklyPool(now) / BLOCKS_PER_WEEK;
}

/** Block reward breakdown for a given date */
export function getBlockRewardBreakdown(now: Date = new Date()): {
  total: number;
  equationSolver: number;
  taskContributors: number;
  scienceBonus: number;
} {
  const total = getBlockReward(now);
  return {
    total,
    equationSolver: total * BLOCK_REWARD_SPLIT.EQUATION_SOLVER,
    taskContributors: total * BLOCK_REWARD_SPLIT.TASK_CONTRIBUTORS,
    scienceBonus: total * BLOCK_REWARD_SPLIT.SCIENCE_BONUS,
  };
}

// ── Adaptive Difficulty ────────────────────────────────────────────────

/**
 * Calculate tasks required per block based on network activity.
 * Scales from TASKS_PER_BLOCK_MIN (20) to TASKS_PER_BLOCK_MAX (200).
 *
 * @param networkTaskRate - Total verified tasks across the network in the last hour
 */
export function getTasksPerBlock(networkTaskRate: number): number {
  // Target: solve all daily blocks
  // tasksPerBlock = networkTaskRate / (blocksPerDay * 24)
  const target = Math.floor(networkTaskRate / (BLOCKS_PER_DAY * 24));
  return Math.min(TASKS_PER_BLOCK_MAX, Math.max(TASKS_PER_BLOCK_MIN, target));
}

// ── Cumulative & Projection ────────────────────────────────────────────

/**
 * Cumulative POH distributed from launch to a given year.
 * Uses discrete geometric sum: S(n) = E0 * (1 - r^n) / (1 - r)
 */
export function getCumulativeDistributed(years: number): number {
  if (years <= 0) return 0;
  return (
    (STARTING_ANNUAL_EMISSION * (1 - Math.pow(RTG_DECAY_RATE, years))) /
    (1 - RTG_DECAY_RATE)
  );
}

/** POH remaining in rewards pool at a given year */
export function getPoolRemaining(years: number): number {
  return Math.max(0, REWARDS_POOL - getCumulativeDistributed(years));
}

/** Generate emission schedule for display */
export function getEmissionSchedule(): Array<{
  year: number;
  annual: number;
  blockReward: number;
  cumulative: number;
  remaining: number;
}> {
  const years = [1, 2, 3, 5, 10, 15, 20, 30, 50];
  return years.map((y) => ({
    year: y,
    annual: getAnnualEmission(y - 1),
    blockReward: getAnnualEmission(y - 1) / WEEKS_PER_YEAR / BLOCKS_PER_WEEK,
    cumulative: getCumulativeDistributed(y),
    remaining: getPoolRemaining(y),
  }));
}

// ── Voyager Death Projections ──────────────────────────────────────────

/**
 * Calculate the state when Voyager is decommissioned.
 *
 * @param decommissionYear - Years from launch when Voyager goes silent
 * @returns Final state: blocks mined, POH distributed, POH locked
 */
export function getDecommissionState(decommissionYear: number): {
  totalBlocksMined: number;
  pohDistributed: number;
  pohLockedForever: number;
  finalBlockReward: number;
} {
  const totalBlocksMined = BLOCKS_PER_DAY * 365.25 * decommissionYear;
  const pohDistributed = getCumulativeDistributed(decommissionYear);
  return {
    totalBlocksMined: Math.floor(totalBlocksMined),
    pohDistributed,
    pohLockedForever: REWARDS_POOL - pohDistributed,
    finalBlockReward:
      getAnnualEmission(decommissionYear) / WEEKS_PER_YEAR / BLOCKS_PER_WEEK,
  };
}

// ── Formatting ─────────────────────────────────────────────────────────

/** Format POH amount with B/M/K suffix */
export function formatPOHAmount(n: number, decimals = 0): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(decimals) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(decimals) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(decimals) + "K";
  return n.toFixed(decimals);
}
