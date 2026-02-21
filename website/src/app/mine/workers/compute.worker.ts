/**
 * Proof of Planet — Compute Web Worker v2.0
 *
 * Runs science-style compute tasks in a background thread.
 * Now supports: deterministic seeding, computation proofs,
 * Cooley-Tukey FFT, larger data sizes, and fitness verification.
 *
 * Task types:
 *   1. protein       — Lennard-Jones energy minimization (50-300 residues)
 *   2. climate       — Finite-difference heat equation (64-256 grid, Float64Array)
 *   3. signal        — Cooley-Tukey FFT O(n log n) for 4K-64K samples
 *   4. drugscreen    — Molecular docking with 50+ binding site atoms
 *   5. fitness_verify — Cross-reference fitness submission plausibility
 */

// ── Types ────────────────────────────────────────────────────────────

interface TaskMessage {
  type: "run";
  taskId: string;
  taskType: "protein" | "climate" | "signal" | "drugscreen" | "fitness_verify";
  payload: Record<string, unknown>;
}

interface ResultMessage {
  type: "result";
  taskId: string;
  result: unknown;
  computeTimeMs: number;
  proof: ComputationProof;
}

interface ProgressMessage {
  type: "progress";
  taskId: string;
  percent: number;
  step: string;
}

interface ComputationProof {
  inputHash: string;
  outputHash: string;
  intermediateHashes: string[];  // 25%, 50%, 75%
  computeTimeMs: number;
  workerVersion: string;
}

// ── Deterministic PRNG (xorshift128+) ────────────────────────────────

class Xorshift128Plus {
  private s0: number;
  private s1: number;

  constructor(seed: string) {
    // Hash seed string into two 32-bit state values
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    this.s0 = h ^ 0xdeadbeef;
    this.s1 = (h * 0x41c64e6d + 0x3039) | 0;
    // Warm up
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
    // Return value in [0, 1)
    return ((this.s0 + this.s1) >>> 0) / 4294967296;
  }
}

// ── SHA-256 for proofs ───────────────────────────────────────────────

async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const WORKER_VERSION = "2.0.0";

// ── Protein Structure Optimization ───────────────────────────────────
// Lennard-Jones energy minimization via gradient descent (50-300 residues)

function computeProtein(payload: Record<string, unknown>, rng: Xorshift128Plus): unknown {
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

    if (iter % Math.floor(iterations / 10) === 0) {
      self.postMessage({
        type: "progress",
        percent: Math.round((iter / iterations) * 100),
        step: `Minimizing energy (${residues.length} residues): ${totalEnergy.toFixed(4)}`,
      } as ProgressMessage);
    }
  }

  return {
    finalEnergy: totalEnergy,
    iterations,
    residueCount: positions.length,
    finalPositions: positions.slice(0, 5),
  };
}

// ── Climate Grid Simulation ──────────────────────────────────────────
// 2D heat equation using finite differences (64-256 grid, Float64Array)

function computeClimate(payload: Record<string, unknown>): unknown {
  const gridSize = (payload.gridSize as number) || 128;
  const timeSteps = (payload.timeSteps as number) || 1000;
  const diffCoeff = (payload.diffusionCoeff as number) || 0.02;
  const initConds = payload.initialConditions as Array<{ x: number; y: number; temp: number }>;

  // Use Float64Array for precision
  const grid = new Float64Array(gridSize * gridSize);
  const newGrid = new Float64Array(gridSize * gridSize);

  // Apply initial conditions
  if (initConds) {
    for (const cond of initConds) {
      const x = Math.min(Math.max(0, cond.x), gridSize - 1);
      const y = Math.min(Math.max(0, cond.y), gridSize - 1);
      grid[x * gridSize + y] = cond.temp;
    }
  }

  const dt = 0.5;
  const dx = 1.0;
  const alpha = diffCoeff * dt / (dx * dx);

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

    if (t % Math.floor(timeSteps / 10) === 0) {
      self.postMessage({
        type: "progress",
        percent: Math.round((t / timeSteps) * 100),
        step: `Simulating heat diffusion (${gridSize}x${gridSize}): step ${t}/${timeSteps}`,
      } as ProgressMessage);
    }
  }

  let maxTemp = -Infinity;
  let totalTemp = 0;
  for (let i = 0; i < grid.length; i++) {
    maxTemp = Math.max(maxTemp, grid[i]);
    totalTemp += grid[i];
  }
  const avgTemp = totalTemp / (gridSize * gridSize);
  const centerIdx = Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2);

  return {
    gridSize,
    timeSteps,
    maxTemperature: maxTemp,
    avgTemperature: avgTemp,
    centerTemp: grid[centerIdx],
  };
}

// ── Signal Analysis — Cooley-Tukey FFT O(n log n) ────────────────────

function fftCooleyTukey(
  real: Float64Array,
  imag: Float64Array,
  n: number,
): void {
  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      let tmp = real[i]; real[i] = real[j]; real[j] = tmp;
      tmp = imag[i]; imag[i] = imag[j]; imag[j] = tmp;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Butterfly operations
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = -2 * Math.PI / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;
      for (let k = 0; k < halfLen; k++) {
        const tReal = curReal * real[i + k + halfLen] - curImag * imag[i + k + halfLen];
        const tImag = curReal * imag[i + k + halfLen] + curImag * real[i + k + halfLen];
        real[i + k + halfLen] = real[i + k] - tReal;
        imag[i + k + halfLen] = imag[i + k] - tImag;
        real[i + k] += tReal;
        imag[i + k] += tImag;
        const newReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = newReal;
      }
    }
  }
}

function computeSignal(payload: Record<string, unknown>, rng: Xorshift128Plus): unknown {
  const sampleRate = (payload.sampleRate as number) || 1000;
  const duration = (payload.duration as number) || 5;
  const frequencies = payload.frequencies as Array<{ hz: number; amplitude: number; phase: number }>;
  const noiseLevel = (payload.noiseLevel as number) || 0.05;

  const numSamples = Math.floor(sampleRate * duration);
  const fftSize = Math.pow(2, Math.ceil(Math.log2(numSamples)));

  // Generate synthetic waveform
  const real = new Float64Array(fftSize);
  const imag = new Float64Array(fftSize);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let value = 0;
    for (const freq of frequencies || []) {
      value += freq.amplitude * Math.sin(2 * Math.PI * freq.hz * t + freq.phase);
    }
    value += (rng.next() - 0.5) * 2 * noiseLevel;
    real[i] = value;
  }

  self.postMessage({
    type: "progress",
    percent: 30,
    step: `Waveform generated (${fftSize} samples), computing Cooley-Tukey FFT...`,
  } as ProgressMessage);

  // Cooley-Tukey FFT — O(n log n) instead of O(n²) DFT
  fftCooleyTukey(real, imag, fftSize);

  self.postMessage({
    type: "progress",
    percent: 80,
    step: `FFT complete, analyzing ${fftSize / 2} frequency bins...`,
  } as ProgressMessage);

  // Compute magnitudes
  const magnitude = new Float64Array(fftSize / 2);
  for (let k = 0; k < fftSize / 2; k++) {
    magnitude[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
  }

  // Find peak frequencies
  const peaks: Array<{ hz: number; magnitude: number }> = [];
  const freqResolution = sampleRate / fftSize;

  for (let k = 1; k < magnitude.length - 1; k++) {
    if (magnitude[k] > magnitude[k - 1] && magnitude[k] > magnitude[k + 1]) {
      if (magnitude[k] > numSamples * 0.1) {
        peaks.push({
          hz: k * freqResolution,
          magnitude: magnitude[k] / numSamples,
        });
      }
    }
  }

  peaks.sort((a, b) => b.magnitude - a.magnitude);

  return {
    sampleRate,
    duration,
    numSamples,
    fftSize,
    peakFrequencies: peaks.slice(0, 10),
    maxMagnitude: Math.max(...Array.from(magnitude)),
  };
}

// ── Drug Screening (Molecular Docking Score) ─────────────────────────
// 50+ binding site atoms, 720 orientations

function computeDrugScreen(payload: Record<string, unknown>): unknown {
  const compound = payload.compound as {
    name: string;
    atoms: Array<{ x: number; y: number; z: number; charge: number; vdwRadius: number }>;
  };
  const bindingSite = payload.bindingSite as Array<{
    x: number; y: number; z: number; charge: number; vdwRadius: number; residueType: string;
  }>;
  const orientations = (payload.orientations as number) || 720;
  const translationSteps = (payload.translationSteps as number) || 40;

  const compoundAtoms = compound.atoms;
  let bestScore = Infinity;
  let bestOrientation = 0;
  let bestTranslation = { x: 0, y: 0, z: 0 };
  let totalInteractions = 0;

  const siteCenter = { x: 0, y: 0, z: 0 };
  for (const atom of bindingSite) {
    siteCenter.x += atom.x;
    siteCenter.y += atom.y;
    siteCenter.z += atom.z;
  }
  siteCenter.x /= bindingSite.length;
  siteCenter.y /= bindingSite.length;
  siteCenter.z /= bindingSite.length;

  for (let rot = 0; rot < orientations; rot++) {
    const angle = (2 * Math.PI * rot) / orientations;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let t = 0; t < translationSteps; t++) {
      const offset = (t - translationSteps / 2) * 0.5;

      let vdwEnergy = 0;
      let electrostaticEnergy = 0;
      let desolvationEnergy = 0;
      let contacts = 0;

      for (const ligAtom of compoundAtoms) {
        const rx = ligAtom.x * cosA - ligAtom.z * sinA + siteCenter.x + offset;
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
          const r12 = r6 * r6;
          vdwEnergy += 4 * 0.15 * (r12 - r6);
          electrostaticEnergy += (332 * ligAtom.charge * siteAtom.charge) / (4 * dist);

          if (dist < sigma * 1.5) {
            desolvationEnergy += 0.01 * Math.exp(-dist / sigma);
            contacts++;
          }
        }
      }

      const totalScore = vdwEnergy + electrostaticEnergy + desolvationEnergy;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestOrientation = rot;
        bestTranslation = { x: offset, y: 0, z: 0 };
        totalInteractions = contacts;
      }
    }

    if (rot % Math.floor(orientations / 10) === 0) {
      self.postMessage({
        type: "progress",
        percent: Math.round((rot / orientations) * 100),
        step: `Screening orientation ${rot}/${orientations} — best: ${bestScore.toFixed(2)} kcal/mol`,
      } as ProgressMessage);
    }
  }

  return {
    compoundName: compound.name,
    bindingAffinity: bestScore,
    bestOrientation,
    bestTranslation,
    interactionCount: totalInteractions,
    bindingSiteResidues: bindingSite.length,
    orientationsScanned: orientations,
  };
}

// ── Fitness Verification ─────────────────────────────────────────────

interface FitnessVerifyPayload {
  activity_id: number;
  activity_type: string;
  duration_min: number;
  active_minutes: number;
  avg_heart_rate: number | null;
  hr_zone_minutes: Record<string, number> | null;
  calories: number | null;
  distance_m: number | null;
  effort_score: number;
  overlapping_activities: Array<{ start: string; end: string }>;
  user_history: Array<{
    activity_type: string;
    duration_min: number;
    avg_heart_rate: number | null;
    distance_m: number | null;
  }>;
}

interface FitnessVerifyResult {
  activity_id: number;
  verified: boolean;
  checks: Record<string, boolean>;
  confidence: number;
}

function checkPaceForActivity(activityType: string, distanceM: number | null, durationMin: number): boolean {
  if (!distanceM || distanceM <= 0 || durationMin <= 0) return true; // No distance data = can't check

  const speedKmh = (distanceM / 1000) / (durationMin / 60);

  switch (activityType) {
    case "walk":
    case "hike":
      return speedKmh >= 1 && speedKmh <= 10;
    case "run":
      return speedKmh >= 3 && speedKmh <= 30;
    case "cycle":
      return speedKmh >= 5 && speedKmh <= 80;
    case "swim":
      return speedKmh >= 0.5 && speedKmh <= 10;
    default:
      return true;
  }
}

function checkCalorieRate(calories: number | null, durationMin: number, activityType: string): boolean {
  if (!calories || calories <= 0 || durationMin <= 0) return true;

  const calPerMin = calories / durationMin;

  // Reasonable cal/min ranges by activity
  const ranges: Record<string, [number, number]> = {
    walk: [2, 10],
    run: [5, 25],
    cycle: [4, 20],
    swim: [5, 18],
    workout: [3, 20],
    hike: [3, 15],
    yoga: [1, 8],
  };

  const range = ranges[activityType] || [1, 30];
  return calPerMin >= range[0] && calPerMin <= range[1];
}

function checkHistoricalBaseline(
  history: FitnessVerifyPayload["user_history"],
  current: FitnessVerifyPayload,
): boolean {
  if (!history || history.length < 3) return true; // Not enough history

  const sameType = history.filter((h) => h.activity_type === current.activity_type);
  if (sameType.length < 3) return true;

  // Check if pace is within 3 std deviations of historical
  if (current.distance_m && current.distance_m > 0) {
    const currentPace = current.duration_min / (current.distance_m / 1000); // min/km
    const historicalPaces = sameType
      .filter((h) => h.distance_m && h.distance_m > 0)
      .map((h) => h.duration_min / (h.distance_m! / 1000));

    if (historicalPaces.length >= 3) {
      const mean = historicalPaces.reduce((a, b) => a + b, 0) / historicalPaces.length;
      const std = Math.sqrt(
        historicalPaces.reduce((acc, p) => acc + (p - mean) ** 2, 0) / historicalPaces.length
      );
      if (std > 0 && Math.abs(currentPace - mean) > 3 * std) {
        return false; // Pace is 3+ standard deviations from norm
      }
    }
  }

  return true;
}

function verifyFitness(payload: Record<string, unknown>): FitnessVerifyResult {
  const p = payload as unknown as FitnessVerifyPayload;

  const checks = {
    hrPlausible: p.avg_heart_rate === null || (p.avg_heart_rate >= 40 && p.avg_heart_rate <= 220),
    paceReasonable: checkPaceForActivity(p.activity_type, p.distance_m, p.duration_min),
    caloriesReasonable: checkCalorieRate(p.calories, p.duration_min, p.activity_type),
    noTimeOverlap: !p.overlapping_activities || p.overlapping_activities.length === 0,
    withinBaseline: checkHistoricalBaseline(p.user_history, p),
    durationReasonable: p.duration_min >= 5 && p.duration_min <= 480, // 5 min to 8 hours
    effortScoreSane: p.effort_score >= 0 && p.effort_score <= 500,
  };

  const passCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const confidence = passCount / totalChecks;

  return {
    activity_id: p.activity_id,
    verified: Object.values(checks).every(Boolean),
    checks,
    confidence,
  };
}

// ── Worker Message Handler ───────────────────────────────────────────

let currentTaskId: string | null = null;

const originalPostMessage = self.postMessage.bind(self);
self.postMessage = (msg: unknown) => {
  if (msg && typeof msg === "object" && "type" in msg && (msg as ProgressMessage).type === "progress") {
    (msg as ProgressMessage).taskId = currentTaskId!;
  }
  originalPostMessage(msg);
};

self.onmessage = async (event: MessageEvent<TaskMessage>) => {
  const { type, taskId, taskType, payload } = event.data;

  if (type !== "run") return;

  currentTaskId = taskId;
  const startTime = performance.now();

  // Create deterministic RNG from seed (if provided)
  const seed = (payload.seed as string) || taskId;
  const rng = new Xorshift128Plus(seed);

  // Compute input hash for proof
  const inputHash = await hashData(JSON.stringify(payload));

  let result: unknown;
  const intermediateHashes: string[] = [];

  switch (taskType) {
    case "protein":
      result = computeProtein(payload, rng);
      break;
    case "climate":
      result = computeClimate(payload);
      break;
    case "signal":
      result = computeSignal(payload, rng);
      break;
    case "drugscreen":
      result = computeDrugScreen(payload);
      break;
    case "fitness_verify":
      result = verifyFitness(payload);
      break;
    default:
      result = { error: `Unknown task type: ${taskType}` };
  }

  const computeTimeMs = Math.round(performance.now() - startTime);

  // Compute output hash for proof
  const outputHash = await hashData(JSON.stringify(result));

  // Generate intermediate hashes (we approximate 25/50/75% checkpoints)
  const resultStr = JSON.stringify(result);
  const quarter = Math.floor(resultStr.length / 4);
  intermediateHashes.push(
    await hashData(resultStr.slice(0, quarter)),
    await hashData(resultStr.slice(0, quarter * 2)),
    await hashData(resultStr.slice(0, quarter * 3)),
  );

  const proof: ComputationProof = {
    inputHash,
    outputHash,
    intermediateHashes,
    computeTimeMs,
    workerVersion: WORKER_VERSION,
  };

  originalPostMessage({
    type: "result",
    taskId,
    result,
    computeTimeMs,
    proof,
  } as ResultMessage);
};
