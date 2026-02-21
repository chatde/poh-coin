/**
 * Reference Computation — Server-side spot-check verification
 *
 * Runs identical compute functions to the worker (without Web Worker context).
 * 10% of tasks are spot-checked: if node result deviates beyond tolerance,
 * the node is flagged.
 */

// ── Deterministic PRNG (must match worker) ───────────────────────────

class Xorshift128Plus {
  private s0: number;
  private s1: number;

  constructor(seed: string) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    this.s0 = h ^ 0xdeadbeef;
    this.s1 = (h * 0x41c64e6d + 0x3039) | 0;
    for (let i = 0; i < 20; i++) this.next();
  }

  next(): number {
    let s1 = this.s0;
    const s0 = this.s1;
    this.s0 = s0;
    s1 ^= s1 << 23;
    s1 ^= s1 >>> 17;
    s1 ^= s0;
    s1 ^= s0 >>> 26;
    this.s1 = s1;
    return ((this.s0 + this.s1) >>> 0) / 4294967296;
  }
}

// ── Reference Protein Computation ────────────────────────────────────

function referenceProtein(payload: Record<string, unknown>): Record<string, unknown> {
  const residues = payload.residues as Array<{ x: number; y: number; z: number; type: string }>;
  const iterations = (payload.iterations as number) || 5000;
  const temperature = (payload.temperature as number) || 310;

  const positions = residues.map((r) => ({ x: r.x, y: r.y, z: r.z }));
  let totalEnergy = 0;
  const lr = 0.01 / temperature;

  for (let iter = 0; iter < iterations; iter++) {
    totalEnergy = 0;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dz = positions[i].z - positions[j].z;
        const r2 = dx * dx + dy * dy + dz * dz;
        const r6 = r2 * r2 * r2;
        const r12 = r6 * r6;

        const sigma6 = 1.0;
        totalEnergy += 4.0 * (sigma6 / r12 - sigma6 / r6);

        const force = 24.0 * (2.0 * sigma6 / r12 - sigma6 / r6) / r2;
        const fx = force * dx;
        const fy = force * dy;
        const fz = force * dz;

        positions[i].x -= lr * fx;
        positions[i].y -= lr * fy;
        positions[i].z -= lr * fz;
        positions[j].x += lr * fx;
        positions[j].y += lr * fy;
        positions[j].z += lr * fz;
      }
    }
  }

  return {
    finalEnergy: totalEnergy,
    iterations,
    residueCount: positions.length,
  };
}

// ── Reference Climate Computation ────────────────────────────────────

function referenceClimate(payload: Record<string, unknown>): Record<string, unknown> {
  const gridSize = (payload.gridSize as number) || 128;
  const timeSteps = (payload.timeSteps as number) || 1000;
  const diffCoeff = (payload.diffusionCoeff as number) || 0.02;
  const initConds = payload.initialConditions as Array<{ x: number; y: number; temp: number }>;

  const grid = new Float64Array(gridSize * gridSize);
  const newGrid = new Float64Array(gridSize * gridSize);

  if (initConds) {
    for (const cond of initConds) {
      const x = Math.min(Math.max(0, cond.x), gridSize - 1);
      const y = Math.min(Math.max(0, cond.y), gridSize - 1);
      grid[x * gridSize + y] = cond.temp;
    }
  }

  const alpha = diffCoeff * 0.5 / (1.0 * 1.0);

  for (let t = 0; t < timeSteps; t++) {
    newGrid.set(grid);
    for (let i = 1; i < gridSize - 1; i++) {
      for (let j = 1; j < gridSize - 1; j++) {
        const idx = i * gridSize + j;
        newGrid[idx] = grid[idx] + alpha * (
          grid[(i + 1) * gridSize + j] + grid[(i - 1) * gridSize + j] +
          grid[i * gridSize + (j + 1)] + grid[i * gridSize + (j - 1)] -
          4 * grid[idx]
        );
      }
    }
    grid.set(newGrid);
  }

  let maxTemp = -Infinity;
  let totalTemp = 0;
  for (let i = 0; i < grid.length; i++) {
    maxTemp = Math.max(maxTemp, grid[i]);
    totalTemp += grid[i];
  }

  return {
    gridSize,
    timeSteps,
    maxTemperature: maxTemp,
    avgTemperature: totalTemp / (gridSize * gridSize),
    centerTemp: grid[Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2)],
  };
}

// ── Reference Signal Computation ─────────────────────────────────────

function referenceSignal(payload: Record<string, unknown>, rng: Xorshift128Plus): Record<string, unknown> {
  const sampleRate = (payload.sampleRate as number) || 1000;
  const duration = (payload.duration as number) || 5;
  const frequencies = payload.frequencies as Array<{ hz: number; amplitude: number; phase: number }>;
  const noiseLevel = (payload.noiseLevel as number) || 0.05;

  const numSamples = Math.floor(sampleRate * duration);
  const fftSize = Math.pow(2, Math.ceil(Math.log2(numSamples)));

  // We only compute basic stats for verification, not full FFT
  let maxSignalValue = 0;
  let signalEnergy = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let value = 0;
    for (const freq of frequencies || []) {
      value += freq.amplitude * Math.sin(2 * Math.PI * freq.hz * t + freq.phase);
    }
    value += (rng.next() - 0.5) * 2 * noiseLevel;
    maxSignalValue = Math.max(maxSignalValue, Math.abs(value));
    signalEnergy += value * value;
  }

  return {
    sampleRate,
    duration,
    numSamples,
    fftSize,
    maxSignalValue,
    signalEnergy,
  };
}

// ── Reference Drug Screen ────────────────────────────────────────────

function referenceDrugScreen(payload: Record<string, unknown>): Record<string, unknown> {
  const compound = payload.compound as {
    name: string;
    atoms: Array<{ x: number; y: number; z: number; charge: number; vdwRadius: number }>;
  };
  const bindingSite = payload.bindingSite as Array<{
    x: number; y: number; z: number; charge: number; vdwRadius: number;
  }>;
  const orientations = (payload.orientations as number) || 720;

  // Only check a subset of orientations for spot-check
  const checkOrientations = Math.min(orientations, 36); // Every 10 degrees
  let bestScore = Infinity;

  const siteCenter = { x: 0, y: 0, z: 0 };
  for (const atom of bindingSite) {
    siteCenter.x += atom.x;
    siteCenter.y += atom.y;
    siteCenter.z += atom.z;
  }
  siteCenter.x /= bindingSite.length;
  siteCenter.y /= bindingSite.length;
  siteCenter.z /= bindingSite.length;

  for (let rot = 0; rot < checkOrientations; rot++) {
    const angle = (2 * Math.PI * rot) / checkOrientations;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let totalScore = 0;
    for (const ligAtom of compound.atoms) {
      const rx = ligAtom.x * cosA - ligAtom.z * sinA + siteCenter.x;
      const ry = ligAtom.y + siteCenter.y;
      const rz = ligAtom.x * sinA + ligAtom.z * cosA + siteCenter.z;

      for (const siteAtom of bindingSite) {
        const dx = rx - siteAtom.x;
        const dy = ry - siteAtom.y;
        const dz = rz - siteAtom.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.1) continue;

        const sigma = (ligAtom.vdwRadius + siteAtom.vdwRadius) / 2;
        const ratio = sigma / dist;
        const r6 = ratio ** 6;
        totalScore += 4 * 0.15 * (r6 * r6 - r6);
        totalScore += (332 * ligAtom.charge * siteAtom.charge) / (4 * dist);
      }
    }

    bestScore = Math.min(bestScore, totalScore);
  }

  return {
    compoundName: compound.name,
    bindingAffinity: bestScore,
    bindingSiteResidues: bindingSite.length,
  };
}

// ── Public API ───────────────────────────────────────────────────────

interface SpotCheckResult {
  passed: boolean;
  tolerance: number;
  deviation: number;
  referenceValues: Record<string, number>;
  submittedValues: Record<string, number>;
}

/**
 * Should this task be spot-checked? (10% probability)
 */
export function shouldSpotCheck(): boolean {
  return Math.random() < 0.1;
}

/**
 * Run reference computation and compare against submitted result.
 */
export function spotCheckResult(
  taskType: string,
  payload: Record<string, unknown>,
  submittedResult: Record<string, unknown>,
): SpotCheckResult {
  const seed = (payload.seed as string) || "";
  const rng = new Xorshift128Plus(seed);

  let refResult: Record<string, unknown>;

  switch (taskType) {
    case "protein":
      refResult = referenceProtein(payload);
      break;
    case "climate":
      refResult = referenceClimate(payload);
      break;
    case "signal":
      refResult = referenceSignal(payload, rng);
      break;
    case "drugscreen":
      refResult = referenceDrugScreen(payload);
      break;
    default:
      return { passed: true, tolerance: 0, deviation: 0, referenceValues: {}, submittedValues: {} };
  }

  // Compare key numeric fields with tolerance
  const tolerances: Record<string, Record<string, number>> = {
    protein: { finalEnergy: 0.1 },       // 10% tolerance
    climate: { maxTemperature: 0.05, avgTemperature: 0.05 },
    signal: { numSamples: 0, fftSize: 0 },   // Exact match for sizes
    drugscreen: { bindingSiteResidues: 0 },    // Exact match for atom count
  };

  const fields = tolerances[taskType] || {};
  let maxDeviation = 0;
  const refValues: Record<string, number> = {};
  const subValues: Record<string, number> = {};

  for (const [field, tolerance] of Object.entries(fields)) {
    const refVal = refResult[field] as number;
    const subVal = submittedResult[field] as number;

    if (refVal === undefined || subVal === undefined) continue;

    refValues[field] = refVal;
    subValues[field] = subVal;

    if (tolerance === 0) {
      // Exact match
      if (refVal !== subVal) maxDeviation = 1;
    } else {
      // Relative tolerance
      const absRef = Math.abs(refVal);
      const deviation = absRef > 0 ? Math.abs(refVal - subVal) / absRef : Math.abs(refVal - subVal);
      maxDeviation = Math.max(maxDeviation, deviation);
    }
  }

  const maxTolerance = Math.max(...Object.values(fields), 0.1);
  const passed = maxDeviation <= maxTolerance;

  return {
    passed,
    tolerance: maxTolerance,
    deviation: maxDeviation,
    referenceValues: refValues,
    submittedValues: subValues,
  };
}
