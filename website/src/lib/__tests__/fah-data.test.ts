import { describe, it, expect } from 'vitest';
import { calculateFahBonus, FAH_TEAM_ID } from '../fah-data';

describe('fah-data.ts', () => {
  describe('calculateFahBonus', () => {
    it('should calculate 10 points per WU', () => {
      expect(calculateFahBonus(1)).toBe(10);
      expect(calculateFahBonus(10)).toBe(100);
      expect(calculateFahBonus(100)).toBe(1000);
    });

    it('should handle zero WUs', () => {
      expect(calculateFahBonus(0)).toBe(0);
    });

    it('should handle fractional WUs', () => {
      expect(calculateFahBonus(1.5)).toBe(15);
      expect(calculateFahBonus(2.7)).toBe(27);
    });

    it('should handle negative WUs (edge case)', () => {
      // In practice, delta WUs should never be negative, but test behavior
      expect(calculateFahBonus(-5)).toBe(-50);
    });

    it('should handle very large WU counts', () => {
      expect(calculateFahBonus(1000000)).toBe(10000000);
    });
  });

  describe('FAH_TEAM_ID', () => {
    it('should be defined', () => {
      expect(FAH_TEAM_ID).toBeDefined();
    });

    it('should be a positive integer', () => {
      expect(FAH_TEAM_ID).toBeGreaterThan(0);
      expect(Number.isInteger(FAH_TEAM_ID)).toBe(true);
    });

    it('should match expected POH team ID', () => {
      expect(FAH_TEAM_ID).toBe(1067948);
    });
  });
});
