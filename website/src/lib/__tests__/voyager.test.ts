import { describe, it, expect } from 'vitest';
import {
  VOYAGER_REF_EPOCH_S,
  VOYAGER_REF_DISTANCE_KM,
  VOYAGER_VELOCITY_KM_DAY,
  VOYAGER_VELOCITY_KM_S,
  AU_KM,
  VOYAGER_LAUNCH_KM,
  BLOCK_SIZE_KM,
  getVoyagerDistanceKm,
  getVoyagerDistanceAU,
  getMinableDistanceKm,
  getBlockHeight,
  getBlocksPerDay,
  getNextBlockEta,
  getLightHoursDelay,
  isVoyagerActive,
  formatDistanceKm,
  formatDistanceAU,
  formatBlockHeight,
} from '../voyager';

describe('voyager.ts', () => {
  // ── Constants ────────────────────────────────────────────────────────

  describe('constants', () => {
    it('VOYAGER_LAUNCH_KM equals 24,526,000,000', () => {
      expect(VOYAGER_LAUNCH_KM).toBe(24_526_000_000);
    });

    it('VOYAGER_REF_DISTANCE_KM equals 25,316,070,000', () => {
      expect(VOYAGER_REF_DISTANCE_KM).toBe(25_316_070_000);
    });

    it('BLOCK_SIZE_KM equals 1,000', () => {
      expect(BLOCK_SIZE_KM).toBe(1_000);
    });

    it('VOYAGER_VELOCITY_KM_S equals 16.8825', () => {
      expect(VOYAGER_VELOCITY_KM_S).toBe(16.8825);
    });
  });

  // ── Distance Functions ───────────────────────────────────────────────

  describe('getVoyagerDistanceKm', () => {
    it('returns a number > 25 billion', () => {
      const distance = getVoyagerDistanceKm();
      expect(distance).toBeGreaterThan(25_000_000_000);
    });

    it('matches reference value at Jan 1, 2025 epoch', () => {
      // VOYAGER_REF_EPOCH_S = 1735689600 = Jan 1, 2025 00:00:00 UTC
      const refDate = new Date('2025-01-01T00:00:00Z');
      const distance = getVoyagerDistanceKm(refDate);
      expect(Math.round(distance)).toBe(VOYAGER_REF_DISTANCE_KM);
    });

    it('increases over time', () => {
      const dateA = new Date('2026-01-01T00:00:00Z');
      const dateB = new Date('2026-06-01T00:00:00Z');
      expect(getVoyagerDistanceKm(dateB)).toBeGreaterThan(getVoyagerDistanceKm(dateA));
    });
  });

  describe('getVoyagerDistanceAU', () => {
    it('returns > 169 AU', () => {
      const au = getVoyagerDistanceAU();
      expect(au).toBeGreaterThan(169);
    });

    it('equals distance in km divided by AU_KM', () => {
      const date = new Date('2026-03-15T00:00:00Z');
      const km = getVoyagerDistanceKm(date);
      const au = getVoyagerDistanceAU(date);
      expect(au).toBeCloseTo(km / AU_KM, 6);
    });
  });

  describe('getMinableDistanceKm', () => {
    it('returns > 0 (past launch distance)', () => {
      const minable = getMinableDistanceKm();
      expect(minable).toBeGreaterThan(0);
    });

    it('equals voyager distance minus launch distance', () => {
      const date = new Date('2026-06-01T00:00:00Z');
      const expected = getVoyagerDistanceKm(date) - VOYAGER_LAUNCH_KM;
      expect(getMinableDistanceKm(date)).toBeCloseTo(expected, 2);
    });

    it('returns 0 for dates before Voyager reached launch distance', () => {
      // VOYAGER_LAUNCH_KM = 24.526B, ref epoch = 25.316B
      // Time to go back: (25316070000 - 24526000000) / 1458648 = ~541.6 days before epoch
      // That puts us around mid-2024. Use a very early date.
      const earlyDate = new Date('2023-01-01T00:00:00Z');
      expect(getMinableDistanceKm(earlyDate)).toBe(0);
    });
  });

  // ── Block Functions ──────────────────────────────────────────────────

  describe('getBlockHeight', () => {
    it('returns > 0', () => {
      expect(getBlockHeight()).toBeGreaterThan(0);
    });

    it('increases with time (date A < date B means height A < height B)', () => {
      const dateA = new Date('2026-02-01T00:00:00Z');
      const dateB = new Date('2026-06-01T00:00:00Z');
      expect(getBlockHeight(dateB)).toBeGreaterThan(getBlockHeight(dateA));
    });

    it('equals floor of minable distance / block size', () => {
      const date = new Date('2026-04-15T12:00:00Z');
      const expected = Math.floor(getMinableDistanceKm(date) / BLOCK_SIZE_KM);
      expect(getBlockHeight(date)).toBe(expected);
    });
  });

  describe('getBlocksPerDay', () => {
    it('returns ~1459 (within 1%)', () => {
      const bpd = getBlocksPerDay();
      expect(bpd).toBeGreaterThan(1459 * 0.99);
      expect(bpd).toBeLessThan(1459 * 1.01);
    });

    it('equals floor of velocity / block size', () => {
      expect(getBlocksPerDay()).toBe(Math.floor(VOYAGER_VELOCITY_KM_DAY / BLOCK_SIZE_KM));
    });
  });

  describe('getNextBlockEta', () => {
    it('returns > 0 (ms until next block)', () => {
      const eta = getNextBlockEta();
      expect(eta).toBeGreaterThan(0);
    });

    it('returns less than one block period in ms', () => {
      // One block = 1000 km, velocity = 16.8825 km/s
      // Max time for one block = 1000 / 16.8825 = ~59.23 seconds = ~59230 ms
      const eta = getNextBlockEta();
      const maxBlockTimeMs = (BLOCK_SIZE_KM / VOYAGER_VELOCITY_KM_S) * 1_000;
      expect(eta).toBeLessThan(maxBlockTimeMs);
    });
  });

  // ── Signal & Status ──────────────────────────────────────────────────

  describe('getLightHoursDelay', () => {
    it('returns a reasonable value in the 20-25h range', () => {
      const hours = getLightHoursDelay();
      expect(hours).toBeGreaterThan(20);
      expect(hours).toBeLessThan(25);
    });

    it('increases with distance over time', () => {
      const dateA = new Date('2026-01-01T00:00:00Z');
      const dateB = new Date('2027-01-01T00:00:00Z');
      expect(getLightHoursDelay(dateB)).toBeGreaterThan(getLightHoursDelay(dateA));
    });
  });

  describe('isVoyagerActive', () => {
    it('returns true', () => {
      expect(isVoyagerActive()).toBe(true);
    });
  });

  // ── Formatting Helpers ───────────────────────────────────────────────

  describe('formatDistanceKm', () => {
    it('formats correctly with commas', () => {
      expect(formatDistanceKm(25_316_070_000)).toBe('25,316,070,000');
    });

    it('floors the value before formatting', () => {
      expect(formatDistanceKm(1234.567)).toBe('1,234');
    });

    it('handles small numbers', () => {
      expect(formatDistanceKm(42)).toBe('42');
    });
  });

  describe('formatDistanceAU', () => {
    it('formats AU with 4 decimal places by default', () => {
      expect(formatDistanceAU(169.2457)).toBe('169.2457');
    });

    it('respects custom decimal places', () => {
      expect(formatDistanceAU(169.2457, 2)).toBe('169.25');
    });
  });

  describe('formatBlockHeight', () => {
    it('formats correctly with commas', () => {
      expect(formatBlockHeight(790_000)).toBe('790,000');
    });

    it('handles small numbers', () => {
      expect(formatBlockHeight(0)).toBe('0');
    });

    it('handles large block heights', () => {
      expect(formatBlockHeight(1_234_567)).toBe('1,234,567');
    });
  });

  // ── Known-date verification ──────────────────────────────────────────

  describe('reference data verification', () => {
    it('distance at Jan 1, 2025 matches reference value exactly', () => {
      // VOYAGER_REF_EPOCH_S = 1735689600 = Jan 1, 2025 00:00:00 UTC
      const refDate = new Date('2025-01-01T00:00:00Z');
      const distance = getVoyagerDistanceKm(refDate);
      // Should be exact since this IS the reference epoch
      expect(Math.round(distance)).toBe(VOYAGER_REF_DISTANCE_KM);
    });

    it('distance increases by ~1,458,648 km per day', () => {
      const day0 = new Date('2026-01-01T00:00:00Z');
      const day1 = new Date('2026-01-02T00:00:00Z');
      const delta = getVoyagerDistanceKm(day1) - getVoyagerDistanceKm(day0);
      expect(delta).toBeCloseTo(VOYAGER_VELOCITY_KM_DAY, 0);
    });
  });
});
