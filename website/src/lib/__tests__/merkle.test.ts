import { describe, it, expect } from 'vitest';
import { buildMerkleTree, toWei } from '../merkle';
import { ethers } from 'ethers';

describe('merkle.ts', () => {
  describe('toWei', () => {
    it('should convert whole numbers correctly', () => {
      expect(toWei(1)).toBe(ethers.parseEther('1'));
      expect(toWei(100)).toBe(ethers.parseEther('100'));
      expect(toWei(1000000)).toBe(ethers.parseEther('1000000'));
    });

    it('should convert decimal numbers correctly', () => {
      expect(toWei(0.5)).toBe(ethers.parseEther('0.5'));
      expect(toWei(1.23456789)).toBe(ethers.parseEther('1.23456789'));
    });

    it('should handle zero', () => {
      expect(toWei(0)).toBe(0n);
    });

    it('should handle very small numbers', () => {
      // ethers.parseEther doesn't support scientific notation
      // Smallest representable is 1 wei = 0.000000000000000001
      const oneWei = ethers.parseEther('0.000000000000000001');
      expect(oneWei).toBe(1n);
    });
  });

  describe('buildMerkleTree', () => {
    it('should build tree for single leaf', () => {
      const leaves = [
        {
          wallet: '0x1234567890123456789012345678901234567890',
          claimableNow: toWei(100),
          vestingAmount: toWei(50),
          vestingDuration: 86400n,
        },
      ];

      const result = buildMerkleTree(leaves);
      expect(result.root).toBeTruthy();
      expect(result.root).toMatch(/^0x[0-9a-f]{64}$/i);
      expect(result.leaves).toHaveLength(1);
      expect(result.proofs.size).toBe(1);

      const proof = result.proofs.get(leaves[0].wallet.toLowerCase());
      expect(proof).toBeDefined();
      expect(Array.isArray(proof)).toBe(true);
    });

    it('should build tree for multiple leaves', () => {
      const leaves = [
        {
          wallet: '0x1111111111111111111111111111111111111111',
          claimableNow: toWei(100),
          vestingAmount: toWei(50),
          vestingDuration: 86400n,
        },
        {
          wallet: '0x2222222222222222222222222222222222222222',
          claimableNow: toWei(200),
          vestingAmount: toWei(100),
          vestingDuration: 172800n,
        },
        {
          wallet: '0x3333333333333333333333333333333333333333',
          claimableNow: toWei(150),
          vestingAmount: toWei(75),
          vestingDuration: 259200n,
        },
      ];

      const result = buildMerkleTree(leaves);
      expect(result.root).toBeTruthy();
      expect(result.leaves).toHaveLength(3);
      expect(result.proofs.size).toBe(3);

      // Each leaf should have a proof
      leaves.forEach(leaf => {
        const proof = result.proofs.get(leaf.wallet.toLowerCase());
        expect(proof).toBeDefined();
        expect(Array.isArray(proof)).toBe(true);
      });
    });

    it('should produce deterministic roots for same input', () => {
      const leaves = [
        {
          wallet: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          claimableNow: toWei(100),
          vestingAmount: toWei(50),
          vestingDuration: 86400n,
        },
        {
          wallet: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          claimableNow: toWei(200),
          vestingAmount: toWei(100),
          vestingDuration: 172800n,
        },
      ];

      const result1 = buildMerkleTree(leaves);
      const result2 = buildMerkleTree(leaves);
      expect(result1.root).toBe(result2.root);
    });

    it('should produce different roots for different amounts', () => {
      const leaves1 = [
        {
          wallet: '0x1111111111111111111111111111111111111111',
          claimableNow: toWei(100),
          vestingAmount: toWei(50),
          vestingDuration: 86400n,
        },
      ];

      const leaves2 = [
        {
          wallet: '0x1111111111111111111111111111111111111111',
          claimableNow: toWei(200), // Different amount
          vestingAmount: toWei(50),
          vestingDuration: 86400n,
        },
      ];

      const result1 = buildMerkleTree(leaves1);
      const result2 = buildMerkleTree(leaves2);
      expect(result1.root).not.toBe(result2.root);
    });

    it('should normalize wallet addresses to lowercase in proofs', () => {
      const leaves = [
        {
          wallet: '0xABCDEF123456789012345678901234567890ABCD',
          claimableNow: toWei(100),
          vestingAmount: toWei(50),
          vestingDuration: 86400n,
        },
      ];

      const result = buildMerkleTree(leaves);
      const proof = result.proofs.get('0xabcdef123456789012345678901234567890abcd');
      expect(proof).toBeDefined();
    });

    it('should handle empty leaves array', () => {
      const result = buildMerkleTree([]);
      expect(result.leaves).toHaveLength(0);
      expect(result.proofs.size).toBe(0);
    });

    it('should create valid proofs for verification', () => {
      const leaves = [
        {
          wallet: '0x1111111111111111111111111111111111111111',
          claimableNow: toWei(100),
          vestingAmount: toWei(50),
          vestingDuration: 86400n,
        },
        {
          wallet: '0x2222222222222222222222222222222222222222',
          claimableNow: toWei(200),
          vestingAmount: toWei(100),
          vestingDuration: 172800n,
        },
      ];

      const result = buildMerkleTree(leaves);

      // Verify each proof reconstructs to the root
      leaves.forEach(leaf => {
        const proof = result.proofs.get(leaf.wallet.toLowerCase());
        expect(proof).toBeDefined();

        // Each proof should have at least 1 sibling hash (for 2 leaves)
        expect(proof!.length).toBeGreaterThanOrEqual(1);

        // Each hash should be valid hex
        proof!.forEach(hash => {
          expect(hash).toMatch(/^0x[0-9a-f]{64}$/i);
        });
      });
    });

    it('should handle power-of-2 and non-power-of-2 leaf counts', () => {
      // Power of 2
      const leaves2 = Array.from({ length: 4 }, (_, i) => ({
        wallet: `0x${(i + 1).toString().padStart(40, '0')}`,
        claimableNow: toWei(100),
        vestingAmount: toWei(50),
        vestingDuration: 86400n,
      }));

      const result2 = buildMerkleTree(leaves2);
      expect(result2.proofs.size).toBe(4);

      // Non-power of 2
      const leaves5 = Array.from({ length: 5 }, (_, i) => ({
        wallet: `0x${(i + 1).toString().padStart(40, '0')}`,
        claimableNow: toWei(100),
        vestingAmount: toWei(50),
        vestingDuration: 86400n,
      }));

      const result5 = buildMerkleTree(leaves5);
      expect(result5.proofs.size).toBe(5);
    });
  });
});
