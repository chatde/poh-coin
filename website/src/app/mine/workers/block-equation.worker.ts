/**
 * Voyager Block Equation Worker — SHA-256 Proof of Work
 *
 * Runs a parallel PoW alongside the science compute worker.
 * Finds a nonce where SHA-256(blockHeight + deviceId + nonce) has N leading hex zeros.
 *
 * Uses WASM SHA-256 via hash-wasm for performance (avoids crypto.subtle Promise overhead).
 * Self-throttles to give science worker CPU priority.
 *
 * Messages IN:
 *   { type: "start", blockHeight, deviceId, difficulty }
 *   { type: "stop" }
 *   { type: "calibrate", deviceId }
 *
 * Messages OUT:
 *   { type: "progress", hashRate, noncesChecked, elapsed }
 *   { type: "solved", nonce, hash, hashRate, elapsed }
 *   { type: "stopped" }
 *   { type: "calibrated", difficulty, hashesPerSecond }
 */

// hash-wasm provides synchronous WASM SHA-256 after init
import { createSHA256 } from "hash-wasm";
import type { IHasher } from "hash-wasm";

// ── Types ──────────────────────────────────────────────────────────────

interface StartMessage {
  type: "start";
  blockHeight: number;
  deviceId: string;
  difficulty: number; // number of leading hex zeros required
}

interface StopMessage {
  type: "stop";
}

interface CalibrateMessage {
  type: "calibrate";
  deviceId: string;
}

type InMessage = StartMessage | StopMessage | CalibrateMessage;

// ── State ──────────────────────────────────────────────────────────────

let running = false;
let hasher: IHasher | null = null;

// ── Initialize WASM hasher ─────────────────────────────────────────────

async function ensureHasher(): Promise<IHasher> {
  if (!hasher) {
    hasher = await createSHA256();
  }
  return hasher;
}

// ── SHA-256 (synchronous after WASM init) ──────────────────────────────

function sha256Hex(h: IHasher, input: string): string {
  h.init();
  h.update(input);
  return h.digest("hex");
}

// ── Difficulty check ───────────────────────────────────────────────────

function meetsTarget(hash: string, difficulty: number): boolean {
  for (let i = 0; i < difficulty; i++) {
    if (hash[i] !== "0") return false;
  }
  return true;
}

// ── Throttle: yield every N hashes so science worker gets priority ─────

const YIELD_INTERVAL = 8_000; // hashes between yields
const PROGRESS_INTERVAL = 5_000; // ms between progress reports

// ── Mine loop ──────────────────────────────────────────────────────────

async function mine(blockHeight: number, deviceId: string, difficulty: number) {
  const h = await ensureHasher();
  running = true;

  const prefix = `${blockHeight}:${deviceId}:`;
  let nonce = 0;
  const startTime = performance.now();
  let lastProgressTime = startTime;

  while (running) {
    // Check batch of hashes
    for (let i = 0; i < YIELD_INTERVAL && running; i++) {
      const input = prefix + nonce;
      const hash = sha256Hex(h, input);

      if (meetsTarget(hash, difficulty)) {
        const elapsed = performance.now() - startTime;
        const hashRate = Math.floor(nonce / (elapsed / 1_000));

        self.postMessage({
          type: "solved",
          nonce,
          hash,
          hashRate,
          elapsed: Math.floor(elapsed),
        });

        running = false;
        return;
      }

      nonce++;
    }

    // Progress report
    const now = performance.now();
    if (now - lastProgressTime >= PROGRESS_INTERVAL) {
      const elapsed = now - startTime;
      const hashRate = Math.floor(nonce / (elapsed / 1_000));

      self.postMessage({
        type: "progress",
        hashRate,
        noncesChecked: nonce,
        elapsed: Math.floor(elapsed),
      });

      lastProgressTime = now;
    }

    // Yield to let science worker run — setTimeout(0) releases the thread
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  self.postMessage({ type: "stopped" });
}

// ── Calibration ────────────────────────────────────────────────────────

async function calibrate(deviceId: string) {
  const h = await ensureHasher();
  const prefix = `calibrate:${deviceId}:`;
  const testHashes = 100_000;

  const start = performance.now();
  for (let i = 0; i < testHashes; i++) {
    sha256Hex(h, prefix + i);
  }
  const elapsed = performance.now() - start;
  const hashesPerSecond = Math.floor(testHashes / (elapsed / 1_000));

  // Target 5-10 minute solve time
  // Expected attempts for N leading hex zeros: 16^N
  // 6 zeros = 16M attempts, 7 zeros = 268M attempts
  // At 200K h/s: 6 zeros = ~80s, 7 zeros = ~22 min
  // At 50K h/s: 6 zeros = ~320s (~5 min), 7 zeros = ~89 min
  let difficulty = 6;
  const expectedAttempts6 = Math.pow(16, 6); // ~16.7M
  const estimatedSeconds6 = expectedAttempts6 / hashesPerSecond;

  // If 6 zeros solves in < 2 min, bump to 7
  if (estimatedSeconds6 < 120) {
    difficulty = 7;
  }
  // If 6 zeros takes > 15 min, drop to 5
  if (estimatedSeconds6 > 900) {
    difficulty = 5;
  }

  self.postMessage({
    type: "calibrated",
    difficulty,
    hashesPerSecond,
  });
}

// ── Message Handler ────────────────────────────────────────────────────

self.addEventListener("message", (event: MessageEvent<InMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case "start":
      mine(msg.blockHeight, msg.deviceId, msg.difficulty);
      break;

    case "stop":
      running = false;
      break;

    case "calibrate":
      calibrate(msg.deviceId);
      break;
  }
});
