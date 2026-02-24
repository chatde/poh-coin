import { describe, it, expect } from 'vitest';
import { spotCheckResult, shouldSpotCheck } from '../reference-compute';

describe('reference-compute.ts', () => {
  describe('shouldSpotCheck', () => {
    it('should return boolean', () => {
      const result = shouldSpotCheck();
      expect(typeof result).toBe('boolean');
    });

    it('should return true approximately 10% of the time', () => {
      const trials = 10000;
      let trueCount = 0;
      for (let i = 0; i < trials; i++) {
        if (shouldSpotCheck()) trueCount++;
      }
      const percentage = trueCount / trials;
      // Allow 3% margin of error (0.07 to 0.13)
      expect(percentage).toBeGreaterThan(0.07);
      expect(percentage).toBeLessThan(0.13);
    });
  });

  describe('spotCheckResult - protein task', () => {
    const proteinPayload = {
      residues: [
        { x: 0, y: 0, z: 0, type: 'A' },
        { x: 1, y: 1, z: 1, type: 'B' },
        { x: 2, y: 2, z: 2, type: 'C' },
      ],
      iterations: 100,
      temperature: 310,
      seed: 'test-seed-123',
    };

    it('should pass when submitted result matches reference', () => {
      // Run reference computation
      const referenceResult = spotCheckResult('protein', proteinPayload, {});

      // Use reference values as submitted values
      const submittedResult = {
        finalEnergy: referenceResult.referenceValues.finalEnergy,
        iterations: 100,
        residueCount: 3,
      };

      const result = spotCheckResult('protein', proteinPayload, submittedResult);
      expect(result.passed).toBe(true);
      expect(result.deviation).toBeLessThanOrEqual(result.tolerance);
    });

    it('should fail when submitted result deviates significantly', () => {
      const submittedResult = {
        finalEnergy: 999999, // Clearly wrong
        iterations: 100,
        residueCount: 3,
      };

      const result = spotCheckResult('protein', proteinPayload, submittedResult);
      expect(result.passed).toBe(false);
      expect(result.deviation).toBeGreaterThan(result.tolerance);
    });

    it('should return reference and submitted values', () => {
      const submittedResult = {
        finalEnergy: 123.45,
        iterations: 100,
        residueCount: 3,
      };

      const result = spotCheckResult('protein', proteinPayload, submittedResult);
      expect(result.referenceValues).toHaveProperty('finalEnergy');
      expect(result.submittedValues).toHaveProperty('finalEnergy');
      expect(result.submittedValues.finalEnergy).toBe(123.45);
    });
  });

  describe('spotCheckResult - climate task', () => {
    const climatePayload = {
      gridSize: 32,
      timeSteps: 100,
      diffusionCoeff: 0.02,
      initialConditions: [
        { x: 16, y: 16, temp: 100 },
        { x: 10, y: 10, temp: 50 },
      ],
      seed: 'test-seed-123',
    };

    it('should validate climate computation', () => {
      const submittedResult = {
        gridSize: 32,
        timeSteps: 100,
        maxTemperature: 85.5,
        avgTemperature: 15.2,
        centerTemp: 45.3,
      };

      const result = spotCheckResult('climate', climatePayload, submittedResult);
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('tolerance');
      expect(result).toHaveProperty('deviation');
    });

    it('should fail with incorrect grid size', () => {
      const submittedResult = {
        gridSize: 64, // Wrong size
        timeSteps: 100,
        maxTemperature: 85.5,
        avgTemperature: 15.2,
        centerTemp: 45.3,
      };

      const result = spotCheckResult('climate', climatePayload, submittedResult);
      // Grid size mismatch should cause high deviation
      expect(result.passed).toBe(false);
    });
  });

  describe('spotCheckResult - signal task', () => {
    const signalPayload = {
      sampleRate: 1000,
      duration: 2,
      frequencies: [
        { hz: 440, amplitude: 1.0, phase: 0 },
        { hz: 880, amplitude: 0.5, phase: 0 },
      ],
      noiseLevel: 0.05,
      seed: 'test-seed-123',
    };

    it('should validate signal computation with deterministic seed', () => {
      // Run twice with same seed - should get same results
      const result1 = spotCheckResult('signal', signalPayload, {});
      const result2 = spotCheckResult('signal', signalPayload, {});

      expect(result1.referenceValues).toEqual(result2.referenceValues);
    });

    it('should enforce exact match for numSamples', () => {
      const submittedResult = {
        sampleRate: 1000,
        duration: 2,
        numSamples: 2001, // Should be 2000
        fftSize: 2048,
        maxSignalValue: 1.5,
        signalEnergy: 4000,
      };

      const result = spotCheckResult('signal', signalPayload, submittedResult);
      expect(result.passed).toBe(false); // Exact match required
    });

    it('should enforce exact match for fftSize', () => {
      const submittedResult = {
        sampleRate: 1000,
        duration: 2,
        numSamples: 2000,
        fftSize: 1024, // Should be 2048
        maxSignalValue: 1.5,
        signalEnergy: 4000,
      };

      const result = spotCheckResult('signal', signalPayload, submittedResult);
      expect(result.passed).toBe(false); // Exact match required
    });
  });

  describe('spotCheckResult - drugscreen task', () => {
    const drugScreenPayload = {
      compound: {
        name: 'Aspirin',
        atoms: [
          { x: 0, y: 0, z: 0, charge: -0.5, vdwRadius: 1.7 },
          { x: 1.5, y: 0, z: 0, charge: 0.5, vdwRadius: 1.5 },
          { x: 0, y: 1.5, z: 0, charge: 0.0, vdwRadius: 1.2 },
        ],
      },
      bindingSite: [
        { x: 5, y: 5, z: 5, charge: -0.3, vdwRadius: 1.8 },
        { x: 6, y: 5, z: 5, charge: 0.3, vdwRadius: 1.6 },
      ],
      orientations: 360,
      seed: 'test-seed-123',
    };

    it('should validate drug screening computation', () => {
      const submittedResult = {
        compoundName: 'Aspirin',
        bindingAffinity: -25.5,
        bindingSiteResidues: 2,
      };

      const result = spotCheckResult('drugscreen', drugScreenPayload, submittedResult);
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('tolerance');
    });

    it('should enforce exact match for bindingSiteResidues', () => {
      const submittedResult = {
        compoundName: 'Aspirin',
        bindingAffinity: -25.5,
        bindingSiteResidues: 3, // Wrong count
      };

      const result = spotCheckResult('drugscreen', drugScreenPayload, submittedResult);
      expect(result.passed).toBe(false);
    });
  });

  describe('spotCheckResult - unknown task type', () => {
    it('should pass unknown task types without validation', () => {
      const result = spotCheckResult('unknown-task', {}, {});
      expect(result.passed).toBe(true);
      expect(result.deviation).toBe(0);
      expect(result.tolerance).toBe(0);
    });
  });
});
