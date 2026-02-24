import { describe, it, expect } from 'vitest';
import {
  CONTRACTS,
  IS_MAINNET,
  formatPOH,
  BASE_CHAIN_ID,
  RPC_URL,
  BLOCK_EXPLORER,
} from '../contracts';

describe('contracts.ts', () => {
  describe('CONTRACTS addresses', () => {
    it('should have all required contract addresses', () => {
      expect(CONTRACTS.token).toBeDefined();
      expect(CONTRACTS.charity).toBeDefined();
      expect(CONTRACTS.vesting).toBeDefined();
      expect(CONTRACTS.rewards).toBeDefined();
      expect(CONTRACTS.registry).toBeDefined();
    });

    it('should have valid Ethereum addresses', () => {
      Object.values(CONTRACTS).forEach(address => {
        if (address !== 'TBD') {
          expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
        }
      });
    });

    it('should use Sepolia addresses in test environment', () => {
      expect(IS_MAINNET).toBe(false);
      expect(CONTRACTS.token).toBe('0xe75DC31C1D4F1f8b1160e84a6B3228115d1135a2');
    });
  });

  describe('formatPOH', () => {
    it('should format small amounts without suffix', () => {
      expect(formatPOH(100n)).toBe('0');
      expect(formatPOH(999n)).toBe('0');
    });

    it('should format thousands with K suffix', () => {
      expect(formatPOH(1000n * 10n**18n)).toBe('1K');
      expect(formatPOH(5500n * 10n**18n)).toBe('6K');
      expect(formatPOH(999_000n * 10n**18n)).toBe('999K');
    });

    it('should format millions with M suffix', () => {
      expect(formatPOH(1_000_000n * 10n**18n)).toBe('1M');
      expect(formatPOH(5_500_000n * 10n**18n)).toBe('6M');
      expect(formatPOH(999_000_000n * 10n**18n)).toBe('999M');
    });

    it('should format billions with B suffix', () => {
      expect(formatPOH(1_000_000_000n * 10n**18n)).toBe('1B');
      expect(formatPOH(5_500_000_000n * 10n**18n)).toBe('6B');
    });

    it('should respect decimals parameter', () => {
      expect(formatPOH(1_234_567n * 10n**18n, 0)).toBe('1M');
      expect(formatPOH(1_234_567n * 10n**18n, 1)).toBe('1.2M');
      expect(formatPOH(1_234_567n * 10n**18n, 2)).toBe('1.23M');
      expect(formatPOH(1_234_567n * 10n**18n, 3)).toBe('1.235M');
    });

    it('should handle zero', () => {
      expect(formatPOH(0n)).toBe('0');
      expect(formatPOH(0n, 2)).toBe('0.00');
    });

    it('should handle very small wei amounts', () => {
      expect(formatPOH(1n)).toBe('0');
      expect(formatPOH(1n, 18)).toContain('0.000000000000000001');
    });
  });

  describe('Network configuration', () => {
    it('should have valid chain ID', () => {
      expect(BASE_CHAIN_ID).toBe(84532); // Base Sepolia
      expect(Number.isInteger(BASE_CHAIN_ID)).toBe(true);
    });

    it('should have valid RPC URL', () => {
      expect(RPC_URL).toMatch(/^https?:\/\//);
      expect(RPC_URL).toContain('base.org');
    });

    it('should have valid block explorer URL', () => {
      expect(BLOCK_EXPLORER).toMatch(/^https?:\/\//);
      expect(BLOCK_EXPLORER).toContain('basescan.org');
    });

    it('should use Sepolia endpoints in test environment', () => {
      expect(RPC_URL).toBe('https://sepolia.base.org');
      expect(BLOCK_EXPLORER).toBe('https://sepolia.basescan.org');
    });
  });
});
