/**
 * Device Attestation — Browser Fingerprinting for Sybil Resistance
 *
 * Generates a SHA-256 fingerprint from:
 *   - Canvas rendering
 *   - WebGL renderer/vendor strings
 *   - AudioContext oscillator signature
 *   - Hardware info (screen, cores, memory, timezone)
 *
 * Same fingerprint + different wallet = rejected (sybil detected).
 */

// ── Canvas Fingerprint ───────────────────────────────────────────────

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";

    // Draw unique pattern
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("POH DePIN 🌍", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("POH DePIN 🌍", 4, 17);

    return canvas.toDataURL();
  } catch {
    return "canvas-error";
  }
}

// ── WebGL Fingerprint ────────────────────────────────────────────────

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "no-webgl";

    const glCtx = gl as WebGLRenderingContext;
    const debugInfo = glCtx.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? glCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : "unknown";
    const vendor = debugInfo
      ? glCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : "unknown";

    return `${vendor}|${renderer}`;
  } catch {
    return "webgl-error";
  }
}

// ── Audio Context Fingerprint ────────────────────────────────────────

async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return "no-audio";

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const analyser = ctx.createAnalyser();
    const gain = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);

    oscillator.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(0);

    // Get frequency data
    const data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);

    oscillator.stop();
    await ctx.close();

    // Use sum of frequency bins as fingerprint component
    const sum = data.reduce((a, b) => a + b, 0);
    return `audio:${sum.toFixed(6)}`;
  } catch {
    return "audio-error";
  }
}

// ── Hardware Fingerprint ─────────────────────────────────────────────

function getHardwareFingerprint(): string {
  const parts = [
    `screen:${screen.width}x${screen.height}x${screen.colorDepth}`,
    `cores:${navigator.hardwareConcurrency || "unknown"}`,
    `memory:${(navigator as unknown as { deviceMemory?: number }).deviceMemory || "unknown"}`,
    `platform:${navigator.platform}`,
    `timezone:${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    `languages:${navigator.languages?.join(",") || navigator.language}`,
    `touch:${navigator.maxTouchPoints}`,
  ];

  return parts.join("|");
}

// ── SHA-256 Hash ─────────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Public API ───────────────────────────────────────────────────────

/** Generate a unique device fingerprint hash */
export async function generateFingerprint(): Promise<string> {
  const canvas = getCanvasFingerprint();
  const webgl = getWebGLFingerprint();
  const audio = await getAudioFingerprint();
  const hardware = getHardwareFingerprint();

  const combined = [canvas, webgl, audio, hardware].join("||");
  return sha256(combined);
}

/** Verify a fingerprint is not already bound to a different wallet */
export async function verifyFingerprintUnique(
  fingerprintHash: string,
  walletAddress: string,
): Promise<{ ok: boolean; error?: string }> {
  // This is called server-side via API route
  // Client calls generateFingerprint(), sends hash to register route
  // Server checks device_fingerprints table
  return { ok: true }; // Placeholder — actual check in register route
}
