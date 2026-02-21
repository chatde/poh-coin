/**
 * Device Benchmark — CPU/Memory/Core Benchmark During Setup
 *
 * Determines device capability tier for task difficulty scaling:
 *   Tier 1 (Phone): Basic mobile device
 *   Tier 2 (Laptop): Mid-range laptop
 *   Tier 3 (Desktop): High-performance desktop
 */

export interface BenchmarkResult {
  cpuScoreMs: number;
  maxMemoryMb: number;
  cores: number;
  capabilityTier: 1 | 2 | 3;
}

/**
 * Run a CPU benchmark (5M iterations of math operations).
 * Returns time in ms — lower is faster.
 */
function benchmarkCpu(): number {
  const start = performance.now();
  let sum = 0;
  for (let i = 0; i < 5_000_000; i++) {
    sum += Math.sqrt(i) * Math.sin(i);
  }
  // Prevent dead code elimination
  if (sum === Infinity) console.log(sum);
  return Math.round(performance.now() - start);
}

/**
 * Get device memory in GB (uses navigator.deviceMemory if available).
 */
function getMemoryGb(): number {
  const nav = navigator as unknown as { deviceMemory?: number };
  return nav.deviceMemory || 2; // Default to 2GB if not available
}

/**
 * Determine capability tier from benchmark results.
 */
function determineTier(cpuMs: number, cores: number, memoryGb: number): 1 | 2 | 3 {
  // Tier 3: Fast CPU (< 200ms), 8+ cores, 8+ GB RAM
  if (cpuMs < 200 && cores >= 8 && memoryGb >= 8) return 3;

  // Tier 2: Moderate CPU (< 500ms), 4+ cores, 4+ GB RAM
  if (cpuMs < 500 && cores >= 4 && memoryGb >= 4) return 2;

  // Tier 1: Everything else
  return 1;
}

/**
 * Run the full device benchmark suite.
 */
export function runBenchmark(): BenchmarkResult {
  const cpuScoreMs = benchmarkCpu();
  const cores = navigator.hardwareConcurrency || 1;
  const memoryGb = getMemoryGb();
  const maxMemoryMb = memoryGb * 1024;
  const capabilityTier = determineTier(cpuScoreMs, cores, memoryGb);

  return {
    cpuScoreMs,
    maxMemoryMb,
    cores,
    capabilityTier,
  };
}
