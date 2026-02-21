/**
 * Proof of Planet — Compute Web Worker
 *
 * Runs science-style WASM tasks in a background thread.
 * Phase 1: TypeScript implementations (swap to WASM module in Phase C).
 *
 * Task types:
 *   1. protein  — Simplified protein energy minimization
 *   2. climate  — Finite-difference heat equation on a grid
 *   3. signal   — FFT on synthetic seismic waveform
 */

// Message types
interface TaskMessage {
  type: "run";
  taskId: string;
  taskType: "protein" | "climate" | "signal";
  payload: Record<string, unknown>;
}

interface ResultMessage {
  type: "result";
  taskId: string;
  result: unknown;
  computeTimeMs: number;
}

interface ProgressMessage {
  type: "progress";
  taskId: string;
  percent: number;
  step: string;
}

// ── Protein Structure Optimization ───────────────────────────────────
// Simplified Lennard-Jones energy minimization via gradient descent
function computeProtein(payload: Record<string, unknown>): unknown {
  const residues = payload.residues as Array<{ x: number; y: number; z: number; type: string }>;
  const iterations = (payload.iterations as number) || 1000;
  const temperature = (payload.temperature as number) || 300;

  // Copy positions for mutation
  const positions = residues.map((r) => ({ x: r.x, y: r.y, z: r.z }));
  let totalEnergy = 0;

  const lr = 0.01 / temperature; // Learning rate inversely proportional to temp

  for (let iter = 0; iter < iterations; iter++) {
    totalEnergy = 0;

    // Calculate pairwise Lennard-Jones energy
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dz = positions[i].z - positions[j].z;
        const r2 = dx * dx + dy * dy + dz * dz;
        const r6 = r2 * r2 * r2;
        const r12 = r6 * r6;

        // LJ potential: 4 * epsilon * ((sigma/r)^12 - (sigma/r)^6)
        const sigma6 = 1.0;
        totalEnergy += 4.0 * (sigma6 / r12 - sigma6 / r6);

        // Gradient step
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

    // Report progress every 10%
    if (iter % Math.floor(iterations / 10) === 0) {
      self.postMessage({
        type: "progress",
        percent: Math.round((iter / iterations) * 100),
        step: `Minimizing energy: ${totalEnergy.toFixed(4)}`,
      } as ProgressMessage);
    }
  }

  return {
    finalEnergy: totalEnergy,
    iterations,
    residueCount: positions.length,
    finalPositions: positions.slice(0, 5), // Return first 5 for verification
  };
}

// ── Climate Grid Simulation ──────────────────────────────────────────
// 2D heat equation using finite differences
function computeClimate(payload: Record<string, unknown>): unknown {
  const gridSize = (payload.gridSize as number) || 32;
  const timeSteps = (payload.timeSteps as number) || 500;
  const diffCoeff = (payload.diffusionCoeff as number) || 0.02;
  const initConds = payload.initialConditions as Array<{ x: number; y: number; temp: number }>;

  // Initialize grid
  const grid: number[][] = Array.from({ length: gridSize }, () =>
    new Array(gridSize).fill(0)
  );

  // Apply initial conditions
  if (initConds) {
    for (const cond of initConds) {
      const x = Math.min(cond.x, gridSize - 1);
      const y = Math.min(cond.y, gridSize - 1);
      grid[x][y] = cond.temp;
    }
  }

  // Run diffusion
  const dt = 0.5;
  const dx = 1.0;
  const alpha = diffCoeff * dt / (dx * dx);

  let maxTemp = 0;
  let avgTemp = 0;

  for (let t = 0; t < timeSteps; t++) {
    const newGrid: number[][] = grid.map((row) => [...row]);

    for (let i = 1; i < gridSize - 1; i++) {
      for (let j = 1; j < gridSize - 1; j++) {
        newGrid[i][j] = grid[i][j] + alpha * (
          grid[i + 1][j] + grid[i - 1][j] +
          grid[i][j + 1] + grid[i][j - 1] -
          4 * grid[i][j]
        );
      }
    }

    // Copy back
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        grid[i][j] = newGrid[i][j];
      }
    }

    if (t % Math.floor(timeSteps / 10) === 0) {
      self.postMessage({
        type: "progress",
        percent: Math.round((t / timeSteps) * 100),
        step: `Simulating heat diffusion: step ${t}/${timeSteps}`,
      } as ProgressMessage);
    }
  }

  // Calculate final statistics
  maxTemp = 0;
  let totalTemp = 0;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      maxTemp = Math.max(maxTemp, grid[i][j]);
      totalTemp += grid[i][j];
    }
  }
  avgTemp = totalTemp / (gridSize * gridSize);

  return {
    gridSize,
    timeSteps,
    maxTemperature: maxTemp,
    avgTemperature: avgTemp,
    centerTemp: grid[Math.floor(gridSize / 2)][Math.floor(gridSize / 2)],
  };
}

// ── Signal Analysis (FFT) ────────────────────────────────────────────
// Discrete Fourier Transform on synthetic seismic waveform
function computeSignal(payload: Record<string, unknown>): unknown {
  const sampleRate = (payload.sampleRate as number) || 1000;
  const duration = (payload.duration as number) || 5;
  const frequencies = payload.frequencies as Array<{ hz: number; amplitude: number; phase: number }>;
  const noiseLevel = (payload.noiseLevel as number) || 0.05;

  const numSamples = Math.floor(sampleRate * duration);
  // Use power of 2 for FFT
  const fftSize = Math.pow(2, Math.ceil(Math.log2(numSamples)));

  // Generate synthetic waveform
  const signal = new Float64Array(fftSize);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let value = 0;
    for (const freq of frequencies || []) {
      value += freq.amplitude * Math.sin(2 * Math.PI * freq.hz * t + freq.phase);
    }
    // Add noise
    value += (Math.random() - 0.5) * 2 * noiseLevel;
    signal[i] = value;
  }

  self.postMessage({
    type: "progress",
    percent: 30,
    step: "Waveform generated, computing DFT...",
  } as ProgressMessage);

  // Simple DFT (not FFT — intentionally slower for more compute work)
  const realPart = new Float64Array(fftSize / 2);
  const imagPart = new Float64Array(fftSize / 2);
  const magnitude = new Float64Array(fftSize / 2);

  for (let k = 0; k < fftSize / 2; k++) {
    let sumReal = 0;
    let sumImag = 0;
    for (let n = 0; n < fftSize; n++) {
      const angle = (2 * Math.PI * k * n) / fftSize;
      sumReal += signal[n] * Math.cos(angle);
      sumImag -= signal[n] * Math.sin(angle);
    }
    realPart[k] = sumReal;
    imagPart[k] = sumImag;
    magnitude[k] = Math.sqrt(sumReal * sumReal + sumImag * sumImag);

    if (k % Math.floor(fftSize / 20) === 0) {
      self.postMessage({
        type: "progress",
        percent: 30 + Math.round((k / (fftSize / 2)) * 60),
        step: `Analyzing frequency bin ${k}/${fftSize / 2}`,
      } as ProgressMessage);
    }
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

// ── Worker Message Handler ───────────────────────────────────────────
self.onmessage = (event: MessageEvent<TaskMessage>) => {
  const { type, taskId, taskType, payload } = event.data;

  if (type !== "run") return;

  const startTime = performance.now();

  let result: unknown;
  switch (taskType) {
    case "protein":
      result = computeProtein(payload);
      break;
    case "climate":
      result = computeClimate(payload);
      break;
    case "signal":
      result = computeSignal(payload);
      break;
    default:
      result = { error: `Unknown task type: ${taskType}` };
  }

  const computeTimeMs = Math.round(performance.now() - startTime);

  self.postMessage({
    type: "result",
    taskId,
    result,
    computeTimeMs,
  } as ResultMessage);
};
