import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RATE_LIMITS } from '../rate-limiter';

describe('rate-limiter.ts', () => {
  describe('RATE_LIMITS configuration', () => {
    it('should have REGISTER_PER_WALLET limit', () => {
      expect(RATE_LIMITS.REGISTER_PER_WALLET).toEqual({
        maxCount: 3,
        windowMs: 24 * 60 * 60 * 1000,
      });
    });

    it('should have REGISTER_PER_IP limit', () => {
      expect(RATE_LIMITS.REGISTER_PER_IP).toEqual({
        maxCount: 5,
        windowMs: 60 * 60 * 1000,
      });
    });

    it('should have TASK_REQUEST limit', () => {
      expect(RATE_LIMITS.TASK_REQUEST).toEqual({
        maxCount: 60,
        windowMs: 60 * 60 * 1000,
      });
    });

    it('should have SUBMIT limit', () => {
      expect(RATE_LIMITS.SUBMIT).toEqual({
        maxCount: 60,
        windowMs: 60 * 60 * 1000,
      });
    });

    it('should have FITNESS_ACTIVITY limit', () => {
      expect(RATE_LIMITS.FITNESS_ACTIVITY).toEqual({
        maxCount: 20,
        windowMs: 24 * 60 * 60 * 1000,
      });
    });

    it('should have FITNESS_SYNC limit', () => {
      expect(RATE_LIMITS.FITNESS_SYNC).toEqual({
        maxCount: 10,
        windowMs: 60 * 60 * 1000,
      });
    });

    it('should have all limits as positive integers', () => {
      Object.values(RATE_LIMITS).forEach(limit => {
        expect(limit.maxCount).toBeGreaterThan(0);
        expect(Number.isInteger(limit.maxCount)).toBe(true);
        expect(limit.windowMs).toBeGreaterThan(0);
        expect(Number.isInteger(limit.windowMs)).toBe(true);
      });
    });

    it('should have reasonable window durations', () => {
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * 60 * 60 * 1000;

      expect(RATE_LIMITS.REGISTER_PER_IP.windowMs).toBe(oneHour);
      expect(RATE_LIMITS.TASK_REQUEST.windowMs).toBe(oneHour);
      expect(RATE_LIMITS.SUBMIT.windowMs).toBe(oneHour);
      expect(RATE_LIMITS.FITNESS_SYNC.windowMs).toBe(oneHour);
      expect(RATE_LIMITS.REGISTER_PER_WALLET.windowMs).toBe(oneDay);
      expect(RATE_LIMITS.FITNESS_ACTIVITY.windowMs).toBe(oneDay);
    });

    it('should have reasonable max counts', () => {
      // Registration should be more restrictive
      expect(RATE_LIMITS.REGISTER_PER_WALLET.maxCount).toBeLessThan(10);
      expect(RATE_LIMITS.REGISTER_PER_IP.maxCount).toBeLessThan(10);

      // Task operations should allow more throughput
      expect(RATE_LIMITS.TASK_REQUEST.maxCount).toBeGreaterThanOrEqual(60);
      expect(RATE_LIMITS.SUBMIT.maxCount).toBeGreaterThanOrEqual(60);

      // Fitness should be moderate
      expect(RATE_LIMITS.FITNESS_ACTIVITY.maxCount).toBeGreaterThanOrEqual(20);
      expect(RATE_LIMITS.FITNESS_SYNC.maxCount).toBeLessThanOrEqual(20);
    });
  });
});
