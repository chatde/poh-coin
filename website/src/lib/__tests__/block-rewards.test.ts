import { describe, it, expect } from 'vitest';
import {
  REWARDS_POOL,
  MAX_DISTRIBUTABLE,
  PERMANENTLY_LOCKED,
  getYearsElapsed,
  getAnnualEmission,
  getWeeklyPool,
  getBlockReward,
  getBlockRewardBreakdown,
  getTasksPerBlock,
  getCumulativeDistributed,
  getPoolRemaining,
  getEmissionSchedule,
  getDecommissionState,
  formatPOHAmount,
} from '../block-rewards';
import {
  STARTING_ANNUAL_EMISSION,
  RTG_DECAY_RATE,
  LAUNCH_DATE,
  TASKS_PER_BLOCK_MIN,
  TASKS_PER_BLOCK_MAX,
  BLOCKS_PER_WEEK,
  WEEKS_PER_YEAR,
} from '../constants';

describe('block-rewards.ts', () => {
  // ── Core Constants ───────────────────────────────────────────────────

  describe('constants', () => {
    it('REWARDS_POOL equals 12,263,000,000', () => {
      expect(REWARDS_POOL).toBe(12_263_000_000);
    });

    it('MAX_DISTRIBUTABLE is approximately 10.72 billion (within 1%)', () => {
      const expected = 10_720_000_000;
      const tolerance = expected * 0.01;
      expect(MAX_DISTRIBUTABLE).toBeGreaterThan(expected - tolerance);
      expect(MAX_DISTRIBUTABLE).toBeLessThan(expected + tolerance);
    });

    it('PERMANENTLY_LOCKED is approximately 1.54 billion (within 1%)', () => {
      const expected = 1_543_000_000;
      const tolerance = expected * 0.01;
      expect(PERMANENTLY_LOCKED).toBeGreaterThan(expected - tolerance);
      expect(PERMANENTLY_LOCKED).toBeLessThan(expected + tolerance);
    });

    it('MAX_DISTRIBUTABLE + PERMANENTLY_LOCKED equals REWARDS_POOL', () => {
      expect(MAX_DISTRIBUTABLE + PERMANENTLY_LOCKED).toBe(REWARDS_POOL);
    });

    it('MAX_DISTRIBUTABLE equals STARTING_ANNUAL_EMISSION / (1 - RTG_DECAY_RATE)', () => {
      expect(MAX_DISTRIBUTABLE).toBe(STARTING_ANNUAL_EMISSION / (1 - RTG_DECAY_RATE));
    });
  });

  // ── Reward Calculations ──────────────────────────────────────────────

  describe('getYearsElapsed', () => {
    it('returns >= 0 for current date', () => {
      expect(getYearsElapsed()).toBeGreaterThanOrEqual(0);
    });

    it('returns 0 at launch date', () => {
      expect(getYearsElapsed(LAUNCH_DATE)).toBeCloseTo(0, 6);
    });

    it('returns ~1 after one year', () => {
      const oneYearLater = new Date(LAUNCH_DATE.getTime() + 365.25 * 24 * 60 * 60 * 1000);
      expect(getYearsElapsed(oneYearLater)).toBeCloseTo(1, 2);
    });

    it('returns 0 for dates before launch', () => {
      const beforeLaunch = new Date('2025-01-01T00:00:00Z');
      expect(getYearsElapsed(beforeLaunch)).toBe(0);
    });
  });

  describe('getAnnualEmission', () => {
    it('year 0 (first year) equals STARTING_ANNUAL_EMISSION (536M)', () => {
      expect(getAnnualEmission(0)).toBe(STARTING_ANNUAL_EMISSION);
    });

    it('year 1 is ~536M (within 5%) — still the second year emission', () => {
      const emission = getAnnualEmission(1);
      const expected = 536_000_000 * 0.95;
      const tolerance = expected * 0.05;
      expect(emission).toBeGreaterThan(expected - tolerance);
      expect(emission).toBeLessThan(expected + tolerance);
    });

    it('decreases each year (year 2 < year 1 < year 0)', () => {
      const year0 = getAnnualEmission(0);
      const year1 = getAnnualEmission(1);
      const year2 = getAnnualEmission(2);
      expect(year1).toBeLessThan(year0);
      expect(year2).toBeLessThan(year1);
    });

    it('applies 5% decay per year', () => {
      const year0 = getAnnualEmission(0);
      const year1 = getAnnualEmission(1);
      expect(year1 / year0).toBeCloseTo(RTG_DECAY_RATE, 6);
    });

    it('year 10 emission is 536M * 0.95^10', () => {
      const expected = STARTING_ANNUAL_EMISSION * Math.pow(RTG_DECAY_RATE, 10);
      expect(getAnnualEmission(10)).toBeCloseTo(expected, 0);
    });
  });

  describe('getWeeklyPool', () => {
    it('returns annualEmission / 52 at launch', () => {
      const weekly = getWeeklyPool(LAUNCH_DATE);
      const expected = getAnnualEmission(0) / WEEKS_PER_YEAR;
      expect(weekly).toBeCloseTo(expected, 2);
    });

    it('returns > 0 for current date', () => {
      expect(getWeeklyPool()).toBeGreaterThan(0);
    });

    it('decreases over time', () => {
      const week1 = getWeeklyPool(LAUNCH_DATE);
      const weekLater = new Date(LAUNCH_DATE.getTime() + 365.25 * 24 * 60 * 60 * 1000 * 5);
      expect(getWeeklyPool(weekLater)).toBeLessThan(week1);
    });
  });

  describe('getBlockReward', () => {
    it('returns > 0 for current date', () => {
      expect(getBlockReward()).toBeGreaterThan(0);
    });

    it('for current time is ~1009 POH (within 10%)', () => {
      // Year 0 block reward: 536M / 52 / (1458 * 7) = ~1009
      const reward = getBlockReward(LAUNCH_DATE);
      const expected = 1009;
      const tolerance = expected * 0.10;
      expect(reward).toBeGreaterThan(expected - tolerance);
      expect(reward).toBeLessThan(expected + tolerance);
    });

    it('equals weeklyPool / BLOCKS_PER_WEEK at launch', () => {
      const reward = getBlockReward(LAUNCH_DATE);
      const expected = getWeeklyPool(LAUNCH_DATE) / BLOCKS_PER_WEEK;
      expect(reward).toBeCloseTo(expected, 6);
    });
  });

  // ── Block Reward Breakdown ───────────────────────────────────────────

  describe('getBlockRewardBreakdown', () => {
    it('returns solver (60%), contributors (30%), bonus (10%)', () => {
      const breakdown = getBlockRewardBreakdown(LAUNCH_DATE);

      expect(breakdown.equationSolver).toBeCloseTo(breakdown.total * 0.60, 6);
      expect(breakdown.taskContributors).toBeCloseTo(breakdown.total * 0.30, 6);
      expect(breakdown.scienceBonus).toBeCloseTo(breakdown.total * 0.10, 6);
    });

    it('splits sum to total', () => {
      const breakdown = getBlockRewardBreakdown(LAUNCH_DATE);
      const sum = breakdown.equationSolver + breakdown.taskContributors + breakdown.scienceBonus;
      expect(sum).toBeCloseTo(breakdown.total, 6);
    });

    it('total matches getBlockReward', () => {
      const date = new Date('2026-06-01T00:00:00Z');
      const breakdown = getBlockRewardBreakdown(date);
      expect(breakdown.total).toBeCloseTo(getBlockReward(date), 6);
    });
  });

  // ── Adaptive Difficulty ──────────────────────────────────────────────

  describe('getTasksPerBlock', () => {
    it('returns TASKS_PER_BLOCK_MIN when network rate is low', () => {
      expect(getTasksPerBlock(0)).toBe(TASKS_PER_BLOCK_MIN);
    });

    it('returns TASKS_PER_BLOCK_MAX when network rate is very high', () => {
      // Very high rate to hit the cap
      expect(getTasksPerBlock(100_000_000)).toBe(TASKS_PER_BLOCK_MAX);
    });

    it('returns value between MIN and MAX for moderate rate', () => {
      const tasks = getTasksPerBlock(1_000_000);
      expect(tasks).toBeGreaterThanOrEqual(TASKS_PER_BLOCK_MIN);
      expect(tasks).toBeLessThanOrEqual(TASKS_PER_BLOCK_MAX);
    });

    it('increases with higher network task rate', () => {
      // Use rates high enough to get above MIN but below MAX
      const low = getTasksPerBlock(500_000);
      const high = getTasksPerBlock(50_000_000);
      expect(high).toBeGreaterThanOrEqual(low);
    });
  });

  // ── Cumulative & Projection ──────────────────────────────────────────

  describe('getCumulativeDistributed', () => {
    it('returns 0 for year 0 or negative', () => {
      expect(getCumulativeDistributed(0)).toBe(0);
      expect(getCumulativeDistributed(-1)).toBe(0);
    });

    it('at year 1 equals STARTING_ANNUAL_EMISSION * (1 - 0.95) / 0.05', () => {
      const cumulative = getCumulativeDistributed(1);
      const expected = STARTING_ANNUAL_EMISSION * (1 - Math.pow(RTG_DECAY_RATE, 1)) / (1 - RTG_DECAY_RATE);
      expect(cumulative).toBeCloseTo(expected, 0);
    });

    it('at year 10 is ~4.3B (within 10%)', () => {
      const cumulative = getCumulativeDistributed(10);
      const expected = 4_300_000_000;
      const tolerance = expected * 0.10;
      expect(cumulative).toBeGreaterThan(expected - tolerance);
      expect(cumulative).toBeLessThan(expected + tolerance);
    });

    it('increases monotonically', () => {
      const y5 = getCumulativeDistributed(5);
      const y10 = getCumulativeDistributed(10);
      const y20 = getCumulativeDistributed(20);
      expect(y10).toBeGreaterThan(y5);
      expect(y20).toBeGreaterThan(y10);
    });
  });

  describe('getPoolRemaining', () => {
    it('returns > 0 for reasonable time horizons', () => {
      expect(getPoolRemaining(1)).toBeGreaterThan(0);
      expect(getPoolRemaining(10)).toBeGreaterThan(0);
      expect(getPoolRemaining(50)).toBeGreaterThan(0);
    });

    it('equals REWARDS_POOL minus cumulative at a given year', () => {
      const year = 5;
      const expected = REWARDS_POOL - getCumulativeDistributed(year);
      expect(getPoolRemaining(year)).toBeCloseTo(expected, 0);
    });

    it('decreases over time', () => {
      expect(getPoolRemaining(10)).toBeLessThan(getPoolRemaining(5));
      expect(getPoolRemaining(20)).toBeLessThan(getPoolRemaining(10));
    });

    it('never goes below 0', () => {
      expect(getPoolRemaining(1000)).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Emission Schedule ────────────────────────────────────────────────

  describe('getEmissionSchedule', () => {
    it('returns 9 entries (years 1, 2, 3, 5, 10, 15, 20, 30, 50)', () => {
      const schedule = getEmissionSchedule();
      expect(schedule).toHaveLength(9);
    });

    it('each entry has year, annual, blockReward, cumulative, remaining', () => {
      const schedule = getEmissionSchedule();
      for (const entry of schedule) {
        expect(entry).toHaveProperty('year');
        expect(entry).toHaveProperty('annual');
        expect(entry).toHaveProperty('blockReward');
        expect(entry).toHaveProperty('cumulative');
        expect(entry).toHaveProperty('remaining');
      }
    });

    it('annual emission decreases year-over-year', () => {
      const schedule = getEmissionSchedule();
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].annual).toBeLessThan(schedule[i - 1].annual);
      }
    });

    it('cumulative increases year-over-year', () => {
      const schedule = getEmissionSchedule();
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].cumulative).toBeGreaterThan(schedule[i - 1].cumulative);
      }
    });

    it('remaining decreases year-over-year', () => {
      const schedule = getEmissionSchedule();
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].remaining).toBeLessThan(schedule[i - 1].remaining);
      }
    });

    it('first entry is year 1', () => {
      const schedule = getEmissionSchedule();
      expect(schedule[0].year).toBe(1);
    });
  });

  // ── Decommission State ───────────────────────────────────────────────

  describe('getDecommissionState', () => {
    it('returns a valid object with all expected fields', () => {
      const state = getDecommissionState(15);
      expect(state).toHaveProperty('totalBlocksMined');
      expect(state).toHaveProperty('pohDistributed');
      expect(state).toHaveProperty('pohLockedForever');
      expect(state).toHaveProperty('finalBlockReward');
    });

    it('totalBlocksMined increases with decommission year', () => {
      const state10 = getDecommissionState(10);
      const state20 = getDecommissionState(20);
      expect(state20.totalBlocksMined).toBeGreaterThan(state10.totalBlocksMined);
    });

    it('pohDistributed + pohLockedForever equals REWARDS_POOL', () => {
      const state = getDecommissionState(15);
      expect(state.pohDistributed + state.pohLockedForever).toBeCloseTo(REWARDS_POOL, 0);
    });

    it('finalBlockReward is positive', () => {
      const state = getDecommissionState(10);
      expect(state.finalBlockReward).toBeGreaterThan(0);
    });

    it('finalBlockReward decreases for later decommission years', () => {
      const state5 = getDecommissionState(5);
      const state20 = getDecommissionState(20);
      expect(state20.finalBlockReward).toBeLessThan(state5.finalBlockReward);
    });
  });

  // ── Formatting ───────────────────────────────────────────────────────

  describe('formatPOHAmount', () => {
    it('formats billions correctly', () => {
      expect(formatPOHAmount(1_230_000_000, 2)).toBe('1.23B');
    });

    it('formats millions correctly', () => {
      expect(formatPOHAmount(536_000_000, 0)).toBe('536M');
    });

    it('formats thousands correctly', () => {
      expect(formatPOHAmount(1_500, 1)).toBe('1.5K');
    });

    it('formats small numbers without suffix', () => {
      expect(formatPOHAmount(42, 0)).toBe('42');
    });

    it('respects decimal places', () => {
      expect(formatPOHAmount(10_720_000_000, 2)).toBe('10.72B');
    });

    it('handles 0 decimals for billions', () => {
      expect(formatPOHAmount(12_263_000_000, 0)).toBe('12B');
    });
  });

  // ── RTG Decay Convergence ────────────────────────────────────────────

  describe('RTG decay convergence', () => {
    it('cumulative at year 100 is less than MAX_DISTRIBUTABLE', () => {
      const cumulative100 = getCumulativeDistributed(100);
      expect(cumulative100).toBeLessThan(MAX_DISTRIBUTABLE);
    });

    it('cumulative approaches but never reaches MAX_DISTRIBUTABLE', () => {
      const cumulative50 = getCumulativeDistributed(50);
      const cumulative100 = getCumulativeDistributed(100);
      const cumulative200 = getCumulativeDistributed(200);

      // All should be less than MAX_DISTRIBUTABLE
      expect(cumulative50).toBeLessThan(MAX_DISTRIBUTABLE);
      expect(cumulative100).toBeLessThan(MAX_DISTRIBUTABLE);
      expect(cumulative200).toBeLessThan(MAX_DISTRIBUTABLE);

      // But getting closer over time
      const gap100 = MAX_DISTRIBUTABLE - cumulative100;
      const gap200 = MAX_DISTRIBUTABLE - cumulative200;
      expect(gap200).toBeLessThan(gap100);
    });

    it('cumulative at year 100 is very close to MAX_DISTRIBUTABLE (>99%)', () => {
      const cumulative100 = getCumulativeDistributed(100);
      const ratio = cumulative100 / MAX_DISTRIBUTABLE;
      expect(ratio).toBeGreaterThan(0.99);
    });
  });
});
