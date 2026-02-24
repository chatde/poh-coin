import { describe, it, expect, beforeAll } from 'vitest';
import {
  computeEffortScore,
  computeActivityHash,
  createOAuthState,
  verifyOAuthState,
} from '../fitness-data';

describe('fitness-data.ts', () => {
  beforeAll(() => {
    // Ensure crypto is available
    if (typeof globalThis.crypto === 'undefined') {
      const crypto = require('crypto');
      globalThis.crypto = {
        subtle: crypto.webcrypto.subtle,
        getRandomValues: (arr: Uint8Array) => crypto.randomFillSync(arr),
      } as unknown as Crypto;
    }
  });

  describe('computeEffortScore', () => {
    it('should compute base score from active minutes', () => {
      const result = computeEffortScore(60, null, 0);
      expect(result.base_score).toBe(60);
      expect(result.final_score).toBeGreaterThan(0);
    });

    it('should apply HR zone factor correctly', () => {
      const hrZones = {
        zone1: 10,
        zone2: 20,
        zone3: 30,
        zone4: 20,
        zone5: 20,
      };
      const result = computeEffortScore(100, hrZones, 0);
      expect(result.hr_zone_factor).toBeGreaterThan(1);
      expect(result.final_score).toBeGreaterThan(result.base_score);
    });

    it('should apply consistency bonus correctly', () => {
      const result = computeEffortScore(60, null, 5);
      // 5 consecutive days = 1.0 + 0.05*5 = 1.25
      expect(result.consistency_bonus).toBe(1.25);
      expect(result.final_score).toBe(60 * 1.0 * 1.25);
    });

    it('should cap consistency bonus at 1.5', () => {
      const result = computeEffortScore(60, null, 20);
      expect(result.consistency_bonus).toBe(1.5);
      expect(result.final_score).toBe(60 * 1.0 * 1.5);
    });

    it('should combine all factors correctly', () => {
      const hrZones = {
        zone1: 0,
        zone2: 0,
        zone3: 0,
        zone4: 0,
        zone5: 50, // All in zone 5 (factor 2.5)
      };
      const result = computeEffortScore(50, hrZones, 10);
      // base=50, hr_zone=2.5, consistency=1.5
      const expected = 50 * 2.5 * 1.5;
      expect(result.final_score).toBeCloseTo(expected, 2);
    });

    it('should return 1.0 HR zone factor when no zones provided', () => {
      const result = computeEffortScore(60, null, 0);
      expect(result.hr_zone_factor).toBe(1.0);
    });

    it('should handle empty HR zones object', () => {
      const result = computeEffortScore(60, {}, 0);
      expect(result.hr_zone_factor).toBe(1.0);
    });

    it('should round final score to 2 decimal places', () => {
      const result = computeEffortScore(33, null, 3);
      expect(result.final_score.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('computeActivityHash', () => {
    it('should generate deterministic hash for same inputs', async () => {
      const hash1 = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'run', 30);
      const hash2 = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'run', 30);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different users', async () => {
      const hash1 = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'run', 30);
      const hash2 = await computeActivityHash('user2', '2026-02-23T10:00:00Z', 'run', 30);
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different times', async () => {
      const hash1 = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'run', 30);
      const hash2 = await computeActivityHash('user1', '2026-02-23T11:00:00Z', 'run', 30);
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different activity types', async () => {
      const hash1 = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'run', 30);
      const hash2 = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'walk', 30);
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different durations', async () => {
      const hash1 = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'run', 30);
      const hash2 = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'run', 60);
      expect(hash1).not.toBe(hash2);
    });

    it('should return valid hex string', async () => {
      const hash = await computeActivityHash('user1', '2026-02-23T10:00:00Z', 'run', 30);
      expect(hash).toMatch(/^[0-9a-f]{64}$/); // SHA-256 = 64 hex chars
    });
  });

  describe('createOAuthState and verifyOAuthState', () => {
    it('should create and verify valid state token', async () => {
      const state = await createOAuthState('0x1234567890123456789012345678901234567890', 'device-123');
      expect(state).toBeTruthy();
      expect(state.split('.').length).toBe(2); // payload.signature

      const verified = await verifyOAuthState(state);
      expect(verified).not.toBeNull();
      expect(verified?.walletAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(verified?.deviceId).toBe('device-123');
    });

    it('should normalize wallet address to lowercase', async () => {
      const state = await createOAuthState('0xABCDEF123456789012345678901234567890', 'device-123');
      const verified = await verifyOAuthState(state);
      expect(verified?.walletAddress).toBe('0xabcdef123456789012345678901234567890');
    });

    it('should reject tampered payload', async () => {
      const state = await createOAuthState('0x1234567890123456789012345678901234567890', 'device-123');
      const [payload, sig] = state.split('.');
      const tamperedState = payload + 'X.' + sig; // Tamper with payload
      const verified = await verifyOAuthState(tamperedState);
      expect(verified).toBeNull();
    });

    it('should reject tampered signature', async () => {
      const state = await createOAuthState('0x1234567890123456789012345678901234567890', 'device-123');
      const [payload, sig] = state.split('.');
      const tamperedState = payload + '.' + sig + 'X'; // Tamper with signature
      const verified = await verifyOAuthState(tamperedState);
      expect(verified).toBeNull();
    });

    it('should reject malformed state string', async () => {
      const verified1 = await verifyOAuthState('no-dot-separator');
      expect(verified1).toBeNull();

      const verified2 = await verifyOAuthState('');
      expect(verified2).toBeNull();

      const verified3 = await verifyOAuthState('a.b.c'); // Too many parts
      expect(verified3).toBeNull();
    });

    it('should reject expired state (>10 minutes old)', async () => {
      // Create state with mocked old timestamp
      const oldPayload = JSON.stringify({
        walletAddress: '0x1234567890123456789012345678901234567890',
        deviceId: 'device-123',
        timestamp: Date.now() - 11 * 60 * 1000, // 11 minutes ago
      });

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(process.env.OAUTH_STATE_SECRET || ''),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(oldPayload));
      const sig = Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const b64Payload = btoa(oldPayload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const b64Sig = btoa(sig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const expiredState = `${b64Payload}.${b64Sig}`;

      const verified = await verifyOAuthState(expiredState);
      expect(verified).toBeNull();
    });
  });
});
