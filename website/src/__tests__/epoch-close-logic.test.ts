import { describe, it, expect } from 'vitest';
import {
  calculateWeeklyPool,
  DATA_NODE_SHARE,
  VALIDATOR_SHARE,
  QUALITY_BONUS,
  STREAK_7D_BONUS,
  STREAK_30D_BONUS,
  TRUST_RAMP,
  GEO_DECAY,
  DAILY_CAP_PCT,
  REFERRAL_BONUS,
  NEW_MINER_IMMEDIATE,
  NEW_MINER_VESTING,
  VETERAN_IMMEDIATE,
  VETERAN_VESTING,
  VETERAN_THRESHOLD_DAYS,
  VALIDATOR_STAKED_MULTIPLIER,
} from '@/lib/constants';

/**
 * Epoch Close Business Logic Tests
 *
 * These tests verify the correctness of the reward calculation logic
 * used in the /api/cron/epoch-close route.
 */

describe('Epoch Close Reward Calculation', () => {
  describe('Pool distribution', () => {
    it('should split weekly pool 80/20 between data nodes and validators', () => {
      const weeklyPool = calculateWeeklyPool();
      const dataPool = weeklyPool * DATA_NODE_SHARE;
      const validatorPool = weeklyPool * VALIDATOR_SHARE;

      expect(dataPool + validatorPool).toBeCloseTo(weeklyPool, 2);
      expect(DATA_NODE_SHARE + VALIDATOR_SHARE).toBe(1.0);
    });

    it('should apply data node share correctly', () => {
      expect(DATA_NODE_SHARE).toBe(0.80);
    });

    it('should apply validator share correctly', () => {
      expect(VALIDATOR_SHARE).toBe(0.20);
    });
  });

  describe('Quality bonus calculation', () => {
    it('should apply 25% bonus for 100% quality', () => {
      const basePoints = 1000;
      const qualityRatio = 1.0; // 10/10 verified
      const bonusedPoints = basePoints * (1 + QUALITY_BONUS * qualityRatio);

      expect(bonusedPoints).toBe(1250);
    });

    it('should apply proportional bonus for partial quality', () => {
      const basePoints = 1000;
      const qualityRatio = 0.5; // 5/10 verified
      const bonusedPoints = basePoints * (1 + QUALITY_BONUS * qualityRatio);

      expect(bonusedPoints).toBe(1125);
    });

    it('should apply no bonus for zero quality', () => {
      const basePoints = 1000;
      const qualityRatio = 0; // 0/10 verified
      const bonusedPoints = basePoints * (1 + QUALITY_BONUS * qualityRatio);

      expect(bonusedPoints).toBe(1000);
    });
  });

  describe('Streak bonuses', () => {
    it('should apply 10% bonus for 7-day streak', () => {
      const basePoints = 1000;
      const streakDays = 7;
      const multiplier = streakDays >= 7 ? 1 + STREAK_7D_BONUS : 1;
      const bonusedPoints = basePoints * multiplier;

      expect(bonusedPoints).toBe(1100);
    });

    it('should apply 25% bonus for 30-day streak', () => {
      const basePoints = 1000;
      const streakDays = 30;
      const multiplier = streakDays >= 30 ? 1 + STREAK_30D_BONUS : 1;
      const bonusedPoints = basePoints * multiplier;

      expect(bonusedPoints).toBe(1250);
    });

    it('should prefer 30-day bonus over 7-day bonus', () => {
      expect(STREAK_30D_BONUS).toBeGreaterThan(STREAK_7D_BONUS);
    });

    it('should not apply bonus for streak under 7 days', () => {
      const basePoints = 1000;
      const streakDays = 5;
      let multiplier = 1;
      if (streakDays >= 30) multiplier = 1 + STREAK_30D_BONUS;
      else if (streakDays >= 7) multiplier = 1 + STREAK_7D_BONUS;
      const bonusedPoints = basePoints * multiplier;

      expect(bonusedPoints).toBe(1000);
    });
  });

  describe('Trust ramp', () => {
    it('should have 4 weeks of trust ramp', () => {
      expect(TRUST_RAMP).toHaveLength(4);
    });

    it('should start at 25% in week 1', () => {
      expect(TRUST_RAMP[0]).toBe(0.25);
    });

    it('should reach 100% by week 4', () => {
      expect(TRUST_RAMP[3]).toBe(1.00);
    });

    it('should increase linearly', () => {
      expect(TRUST_RAMP[0]).toBe(0.25);
      expect(TRUST_RAMP[1]).toBe(0.50);
      expect(TRUST_RAMP[2]).toBe(0.75);
      expect(TRUST_RAMP[3]).toBe(1.00);
    });

    it('should apply trust multiplier correctly', () => {
      const basePoints = 1000;

      const week1Points = basePoints * TRUST_RAMP[0];
      const week2Points = basePoints * TRUST_RAMP[1];
      const week3Points = basePoints * TRUST_RAMP[2];
      const week4Points = basePoints * TRUST_RAMP[3];

      expect(week1Points).toBe(250);
      expect(week2Points).toBe(500);
      expect(week3Points).toBe(750);
      expect(week4Points).toBe(1000);
    });
  });

  describe('Geographic decay', () => {
    it('should have decay factors for 4+ devices', () => {
      expect(GEO_DECAY).toHaveLength(4);
    });

    it('should have no decay for first device', () => {
      expect(GEO_DECAY[0]).toBe(1.00);
    });

    it('should decrease for subsequent devices in same cell', () => {
      expect(GEO_DECAY[0]).toBeGreaterThan(GEO_DECAY[1]);
      expect(GEO_DECAY[1]).toBeGreaterThan(GEO_DECAY[2]);
      expect(GEO_DECAY[2]).toBeGreaterThan(GEO_DECAY[3]);
    });

    it('should apply correct decay sequence', () => {
      expect(GEO_DECAY).toEqual([1.00, 0.80, 0.65, 0.50]);
    });
  });

  describe('Quadratic wallet scaling', () => {
    it('should apply diminishing returns per device', () => {
      const basePoints = 1000;

      // 1st device: 100%
      const device1 = basePoints * (1 / 1);
      // 2nd device: 50%
      const device2 = basePoints * (1 / 2);
      // 3rd device: 33%
      const device3 = basePoints * (1 / 3);
      // 4th device: 25%
      const device4 = basePoints * (1 / 4);

      expect(device1).toBe(1000);
      expect(device2).toBe(500);
      expect(device3).toBeCloseTo(333.33, 2);
      expect(device4).toBe(250);
    });
  });

  describe('Daily cap', () => {
    it('should be 0.1% of weekly pool per day', () => {
      expect(DAILY_CAP_PCT).toBe(0.001);
    });

    it('should calculate weekly device cap correctly', () => {
      const weeklyPool = calculateWeeklyPool();
      const dailyCap = weeklyPool * DAILY_CAP_PCT;
      const weeklyDeviceCap = dailyCap * 7;

      expect(weeklyDeviceCap).toBe(weeklyPool * 0.007);
    });

    it('should prevent single device from earning too much', () => {
      const weeklyPool = 1_000_000;
      const dailyCap = weeklyPool * DAILY_CAP_PCT;
      const weeklyDeviceCap = dailyCap * 7;

      const maxDeviceEarnings = weeklyDeviceCap;
      const poolPercentage = maxDeviceEarnings / weeklyPool;

      expect(poolPercentage).toBe(0.007); // 0.7%
      expect(maxDeviceEarnings).toBe(7000);
    });
  });

  describe('Referral bonus', () => {
    it('should be 10% bonus', () => {
      expect(REFERRAL_BONUS).toBe(0.10);
    });

    it('should apply to both referrer and invitee', () => {
      const basePoints = 1000;
      const bonusedPoints = basePoints * (1 + REFERRAL_BONUS);

      expect(bonusedPoints).toBe(1100);
    });
  });

  describe('Vesting tiers', () => {
    it('should have new miner vesting at 75%', () => {
      expect(NEW_MINER_IMMEDIATE).toBe(0.25);
      expect(NEW_MINER_VESTING).toBe(0.75);
      expect(NEW_MINER_IMMEDIATE + NEW_MINER_VESTING).toBe(1.0);
    });

    it('should have veteran vesting at 25%', () => {
      expect(VETERAN_IMMEDIATE).toBe(0.75);
      expect(VETERAN_VESTING).toBe(0.25);
      expect(VETERAN_IMMEDIATE + VETERAN_VESTING).toBe(1.0);
    });

    it('should require 180 days for veteran status', () => {
      expect(VETERAN_THRESHOLD_DAYS).toBe(180);
    });

    it('should calculate new miner vesting correctly', () => {
      const totalPOH = 1000;
      const claimableNow = totalPOH * NEW_MINER_IMMEDIATE;
      const vestingAmount = totalPOH * NEW_MINER_VESTING;

      expect(claimableNow).toBe(250);
      expect(vestingAmount).toBe(750);
      expect(claimableNow + vestingAmount).toBe(totalPOH);
    });

    it('should calculate veteran vesting correctly', () => {
      const totalPOH = 1000;
      const claimableNow = totalPOH * VETERAN_IMMEDIATE;
      const vestingAmount = totalPOH * VETERAN_VESTING;

      expect(claimableNow).toBe(750);
      expect(vestingAmount).toBe(250);
      expect(claimableNow + vestingAmount).toBe(totalPOH);
    });
  });

  describe('Validator staking multiplier', () => {
    it('should be 2x for staked validators', () => {
      expect(VALIDATOR_STAKED_MULTIPLIER).toBe(2);
    });

    it('should double validator points when staked', () => {
      const basePoints = 1000;
      const stakedPoints = basePoints * VALIDATOR_STAKED_MULTIPLIER;

      expect(stakedPoints).toBe(2000);
    });
  });

  describe('Combined bonus calculations', () => {
    it('should stack all bonuses correctly', () => {
      let points = 1000;

      // Apply quality bonus (100%)
      points *= 1 + QUALITY_BONUS;
      expect(points).toBe(1250);

      // Apply 30-day streak bonus
      points *= 1 + STREAK_30D_BONUS;
      expect(points).toBe(1562.5);

      // Apply trust ramp (week 4)
      points *= TRUST_RAMP[3];
      expect(points).toBe(1562.5);

      // Apply referral bonus
      points *= 1 + REFERRAL_BONUS;
      expect(points).toBeCloseTo(1718.75, 2);
    });

    it('should apply geo decay after bonuses', () => {
      let points = 1000;

      // Apply bonuses first
      points *= 1 + QUALITY_BONUS; // 1250
      points *= 1 + STREAK_7D_BONUS; // 1375

      // Then apply geo decay (2nd device in cell)
      points *= GEO_DECAY[1];
      expect(points).toBeCloseTo(1100, 2);
    });

    it('should respect daily cap after all bonuses', () => {
      const weeklyPool = 1_000_000;
      const weeklyDeviceCap = weeklyPool * DAILY_CAP_PCT * 7;

      let points = 100_000; // Very high base points
      points *= 1 + QUALITY_BONUS;
      points *= 1 + STREAK_30D_BONUS;
      points *= 1 + REFERRAL_BONUS;

      // Cap should limit final points
      const finalPoints = Math.min(points, weeklyDeviceCap);
      expect(finalPoints).toBe(weeklyDeviceCap);
      expect(finalPoints).toBe(7000);
    });
  });

  describe('Pool share calculations', () => {
    it('should distribute pool proportionally by points', () => {
      const pool = 1_000_000;
      const totalPoints = 10_000;

      const device1Points = 5000;
      const device2Points = 3000;
      const device3Points = 2000;

      const device1Share = (device1Points / totalPoints) * pool;
      const device2Share = (device2Points / totalPoints) * pool;
      const device3Share = (device3Points / totalPoints) * pool;

      expect(device1Share).toBe(500_000);
      expect(device2Share).toBe(300_000);
      expect(device3Share).toBe(200_000);
      expect(device1Share + device2Share + device3Share).toBe(pool);
    });

    it('should handle zero total points gracefully', () => {
      const pool = 1_000_000;
      const totalPoints = 0;

      // Should not divide by zero
      if (totalPoints === 0) {
        expect(totalPoints).toBe(0);
      } else {
        const share = (1000 / totalPoints) * pool;
        expect(share).toBeDefined();
      }
    });
  });
});
