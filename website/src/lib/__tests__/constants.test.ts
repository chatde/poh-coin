import { describe, it, expect } from 'vitest';
import {
  calculateWeeklyPool,
  STARTING_ANNUAL_EMISSION,
  RTG_DECAY_RATE,
  WEEKS_PER_YEAR,
  LAUNCH_DATE,
} from '../constants';
import { RATE_LIMITS } from '../rate-limiter';

describe('constants.ts', () => {
  describe('calculateWeeklyPool', () => {
    it('should return 0 for dates before launch', () => {
      const beforeLaunch = new Date('2026-01-01T00:00:00Z');
      expect(calculateWeeklyPool(beforeLaunch)).toBe(0);
    });

    it('should calculate correct pool at launch date', () => {
      const pool = calculateWeeklyPool(LAUNCH_DATE);
      const expected = STARTING_ANNUAL_EMISSION / WEEKS_PER_YEAR;
      expect(pool).toBeCloseTo(expected, 2);
    });

    it('should apply 5% decay after one year', () => {
      const launch = calculateWeeklyPool(LAUNCH_DATE);
      const oneYearLater = new Date('2027-02-21T00:00:00Z');
      const pool = calculateWeeklyPool(oneYearLater);

      // Pool should be approximately 95% of launch pool
      const ratio = pool / launch;
      expect(ratio).toBeGreaterThan(0.94);
      expect(ratio).toBeLessThan(0.96);
    });

    it('should apply compound decay after multiple years', () => {
      const launch = calculateWeeklyPool(LAUNCH_DATE);
      const twoYearsLater = new Date('2028-02-21T00:00:00Z');
      const pool = calculateWeeklyPool(twoYearsLater);

      // Pool should be approximately 90.25% of launch pool (0.95^2)
      const ratio = pool / launch;
      expect(ratio).toBeGreaterThan(0.89);
      expect(ratio).toBeLessThan(0.91);
    });

    it('should handle partial years correctly', () => {
      const launch = calculateWeeklyPool(LAUNCH_DATE);
      const sixMonthsLater = new Date('2026-08-21T00:00:00Z');
      const pool = calculateWeeklyPool(sixMonthsLater);

      // Pool should be between 100% and 95% (partial year decay)
      const ratio = pool / launch;
      expect(ratio).toBeGreaterThan(0.94);
      expect(ratio).toBeLessThan(1.01);
    });

    it('should use current date when no argument provided', () => {
      const pool = calculateWeeklyPool();
      expect(pool).toBeGreaterThan(0);
    });
  });

  describe('RATE_LIMITS validation', () => {
    it('should have valid maxCount values', () => {
      Object.values(RATE_LIMITS).forEach(limit => {
        expect(limit.maxCount).toBeGreaterThan(0);
        expect(Number.isInteger(limit.maxCount)).toBe(true);
      });
    });

    it('should have valid windowMs values', () => {
      Object.values(RATE_LIMITS).forEach(limit => {
        expect(limit.windowMs).toBeGreaterThan(0);
        expect(Number.isInteger(limit.windowMs)).toBe(true);
      });
    });

    it('should have expected rate limit keys', () => {
      expect(RATE_LIMITS.REGISTER_PER_WALLET).toBeDefined();
      expect(RATE_LIMITS.REGISTER_PER_IP).toBeDefined();
      expect(RATE_LIMITS.TASK_REQUEST).toBeDefined();
      expect(RATE_LIMITS.SUBMIT).toBeDefined();
      expect(RATE_LIMITS.FITNESS_ACTIVITY).toBeDefined();
      expect(RATE_LIMITS.FITNESS_SYNC).toBeDefined();
    });
  });
});
