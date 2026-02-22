"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import {
  Terminal,
  TerminalHeader,
  TerminalLine,
  BlinkingCursor,
} from "../components/Terminal";

type Step = "wallet" | "seed-phrase" | "permissions" | "wearable" | "fah" | "benchmark" | "savings";

export default function SetupPage() {
  const [step, setStep] = useState<Step>("wallet");
  const [walletMethod, setWalletMethod] = useState<"create" | "connect" | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [savingsWallet, setSavingsWallet] = useState("");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fingerprintHash, setFingerprintHash] = useState<string | null>(null);
  const [sigVerified, setSigVerified] = useState(false);
  const [fitnessProvider, setFitnessProvider] = useState<string | null>(null);
  const [benchmarkTier, setBenchmarkTier] = useState<number | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  // Store ethers wallet for signing
  const [ethersWallet, setEthersWallet] = useState<ethers.HDNodeWallet | null>(null);
  // Seed phrase display
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [seedConfirmed, setSeedConfirmed] = useState(false);
  const [seedCopied, setSeedCopied] = useState(false);

  // Handle OAuth redirect-back (after Strava/Fitbit authorization)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fitnessResult = params.get("fitness");
    const providerParam = params.get("provider");
    const stepParam = params.get("step");

    // If redirected back from OAuth callback
    if (fitnessResult === "success" && providerParam) {
      // Restore wallet/device from localStorage
      const storedWallet = localStorage.getItem("poh-wallet");
      const storedDevice = localStorage.getItem("poh-device-id");
      if (storedWallet) setWalletAddress(storedWallet);
      if (storedDevice) setDeviceId(storedDevice);

      setFitnessProvider(providerParam);
      setStep("wearable");

      // Clean URL
      window.history.replaceState({}, "", "/mine/setup");
    } else if (fitnessResult === "failed") {
      const reason = params.get("reason") || "unknown";
      const storedWallet = localStorage.getItem("poh-wallet");
      const storedDevice = localStorage.getItem("poh-device-id");
      if (storedWallet) setWalletAddress(storedWallet);
      if (storedDevice) setDeviceId(storedDevice);

      setError(`Wearable connection failed: ${reason}`);
      setStep("wearable");

      window.history.replaceState({}, "", "/mine/setup");
    } else if (stepParam === "wearable") {
      // Coming from mine page to connect wearable
      const storedWallet = localStorage.getItem("poh-wallet");
      const storedDevice = localStorage.getItem("poh-device-id");
      if (storedWallet) setWalletAddress(storedWallet);
      if (storedDevice) setDeviceId(storedDevice);

      setStep("wearable");
      window.history.replaceState({}, "", "/mine/setup");
    }
  }, []);

  const totalSteps = 7;

  // Generate a unique device ID
  const generateDeviceId = useCallback(() => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }, []);

  // Generate device fingerprint
  const generateFingerprint = useCallback(async (): Promise<string> => {
    try {
      // Canvas fingerprint
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext("2d");
      let canvasData = "no-canvas";
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("POH DePIN", 2, 15);
        canvasData = canvas.toDataURL();
      }

      // WebGL fingerprint
      let webglData = "no-webgl";
      try {
        const glCanvas = document.createElement("canvas");
        const gl = glCanvas.getContext("webgl");
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "unknown";
          const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "unknown";
          webglData = `${vendor}|${renderer}`;
        }
      } catch { /* noop */ }

      // Hardware info
      const hwData = [
        `screen:${screen.width}x${screen.height}x${screen.colorDepth}`,
        `cores:${navigator.hardwareConcurrency || "unknown"}`,
        `platform:${navigator.platform}`,
        `tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        `touch:${navigator.maxTouchPoints}`,
      ].join("|");

      const combined = [canvasData, webglData, hwData].join("||");
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      return "fingerprint-error";
    }
  }, []);

  // Step 1: Create a new wallet
  const handleCreateWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;
      const mnemonic = wallet.mnemonic?.phrase || "";

      localStorage.setItem("poh-mnemonic", mnemonic);
      localStorage.setItem("poh-wallet", address);

      const newDeviceId = generateDeviceId();
      localStorage.setItem("poh-device-id", newDeviceId);

      setWalletAddress(address);
      setDeviceId(newDeviceId);
      setWalletMethod("create");
      setEthersWallet(wallet);
      setSeedPhrase(mnemonic);
      setStep("seed-phrase");
    } catch {
      setError("Failed to create wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [generateDeviceId]);

  // Step 1: Connect existing wallet
  const handleConnectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<string[] | string> } }).ethereum;
      if (!ethereum) {
        setError("No wallet detected. Install MetaMask or use 'Create New Wallet'.");
        setLoading(false);
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" }) as string[];
      if (accounts.length === 0) {
        setError("No accounts found.");
        setLoading(false);
        return;
      }

      const address = accounts[0];
      localStorage.setItem("poh-wallet", address);

      const newDeviceId = generateDeviceId();
      localStorage.setItem("poh-device-id", newDeviceId);

      setWalletAddress(address);
      setDeviceId(newDeviceId);
      setWalletMethod("connect");
      setStep("permissions");
    } catch {
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [generateDeviceId]);

  // Step 2: Request permissions, sign message, generate fingerprint, register device
  const handlePermissions = useCallback(async () => {
    if (!deviceId || !walletAddress) return;
    setLoading(true);
    setError(null);

    try {
      // Generate device fingerprint
      const fp = await generateFingerprint();
      setFingerprintHash(fp);

      // Sign registration message (EIP-191)
      let signature: string | undefined;
      let signedMessage: string | undefined;
      const timestamp = Date.now().toString();

      const message = `POH Mining Registration\nWallet: ${walletAddress}\nDevice: ${deviceId}\nTimestamp: ${timestamp}`;

      if (ethersWallet) {
        // Created wallet — sign with ethers
        signature = await ethersWallet.signMessage(message);
        signedMessage = message;
        setSigVerified(true);
      } else if (walletMethod === "connect") {
        // Connected wallet — sign with provider
        try {
          const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params: unknown[] }) => Promise<string> } }).ethereum;
          if (ethereum) {
            signature = await ethereum.request({
              method: "personal_sign",
              params: [message, walletAddress],
            });
            signedMessage = message;
            setSigVerified(true);
          }
        } catch {
          // Signature optional — continue without
        }
      }

      // Register device with backend
      const res = await fetch("/api/mine/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          walletAddress,
          tier: 1,
          signature,
          signedMessage,
          timestamp,
          fingerprint: fp,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      setStep("wearable");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [deviceId, walletAddress, generateFingerprint, ethersWallet, walletMethod]);

  // Step 3: Connect wearable via OAuth (Strava or Fitbit)
  const handleConnectProvider = useCallback(async (provider: string) => {
    if (!walletAddress || !deviceId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mine/fitness/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, deviceId, provider }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to start wearable connection.");
        setLoading(false);
        return;
      }

      const { authUrl } = await res.json();

      // Full page redirect to OAuth provider
      window.location.href = authUrl;
    } catch {
      setError("Failed to connect wearable.");
      setLoading(false);
    }
  }, [walletAddress, deviceId]);

  const handleSkipWearable = useCallback(() => {
    setStep("fah");
  }, []);

  // Step 4: Device benchmark
  const handleBenchmark = useCallback(async () => {
    if (!deviceId) return;
    setBenchmarking(true);
    setError(null);

    try {
      // Simple CPU benchmark: time a tight loop
      const start = performance.now();
      let sum = 0;
      for (let i = 0; i < 5_000_000; i++) {
        sum += Math.sqrt(i) * Math.sin(i);
      }
      const cpuScoreMs = Math.round(performance.now() - start);
      // Prevent dead code elimination
      if (sum === Infinity) console.log(sum);

      const cores = navigator.hardwareConcurrency || 1;
      const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 2;
      const maxMemoryMb = memory * 1024;

      // Determine tier
      let tier = 1;
      if (cpuScoreMs < 200 && cores >= 8 && memory >= 8) {
        tier = 3; // Desktop
      } else if (cpuScoreMs < 500 && cores >= 4 && memory >= 4) {
        tier = 2; // Laptop
      }

      // Store benchmark in DB
      await fetch("/api/mine/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          cpuScoreMs: cpuScoreMs,
          maxMemoryMb: maxMemoryMb,
          cores,
          capabilityTier: tier,
        }),
      });

      setBenchmarkTier(tier);

      // Also store client-side for local reference
      localStorage.setItem("poh-benchmark", JSON.stringify({
        cpu_score_ms: cpuScoreMs,
        max_memory_mb: maxMemoryMb,
        cores,
        capability_tier: tier,
      }));

      setStep("savings");
    } catch {
      setError("Benchmark failed.");
    } finally {
      setBenchmarking(false);
    }
  }, [deviceId]);

  // Step 5: Set savings wallet (optional)
  const handleSavingsWallet = useCallback(async () => {
    if (savingsWallet && !/^0x[0-9a-fA-F]{40}$/.test(savingsWallet)) {
      setError("Invalid address format. Must be 0x followed by 40 hex characters.");
      return;
    }

    if (savingsWallet) {
      localStorage.setItem("poh-savings-wallet", savingsWallet);
    }

    window.location.href = "/mine";
  }, [savingsWallet]);

  const stepNumber = step === "wallet" ? 1 : step === "seed-phrase" ? 2 : step === "permissions" ? 3 : step === "wearable" ? 4 : step === "fah" ? 5 : step === "benchmark" ? 6 : 7;

  return (
    <Terminal>
      <TerminalHeader />

      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div
              key={n}
              className={`flex-1 h-1 rounded ${
                n <= stepNumber ? "bg-green-500" : "bg-green-900"
              }`}
            />
          ))}
        </div>

        <div className="text-green-500 text-xs uppercase tracking-widest mb-4">
          Setup — Step {stepNumber} of {totalSteps}
        </div>

        {/* Step 1: Connect Wallet */}
        {step === "wallet" && (
          <div className="space-y-4">
            <TerminalLine prefix="$">
              INITIALIZING MISSION CONTROL...
            </TerminalLine>
            <TerminalLine prefix="$">
              WALLET REQUIRED FOR TOKEN DISTRIBUTION
            </TerminalLine>

            <div className="border border-green-800 rounded p-4 mt-4 space-y-3">
              <div className="text-green-400 text-sm mb-2">
                Choose wallet method:
              </div>

              <button
                onClick={handleCreateWallet}
                disabled={loading}
                className="w-full border border-green-600 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors text-left"
              >
                <div className="font-bold">[1] CREATE NEW WALLET</div>
                <div className="text-green-700 text-xs mt-1">
                  Best for beginners. A wallet is created on this device.
                </div>
              </button>

              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="w-full border border-green-600 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors text-left"
              >
                <div className="font-bold">[2] CONNECT EXISTING WALLET</div>
                <div className="text-green-700 text-xs mt-1">
                  MetaMask, WalletConnect, or other Web3 wallet.
                </div>
              </button>
            </div>

            {loading && (
              <TerminalLine prefix="...">
                Generating secure wallet <BlinkingCursor />
              </TerminalLine>
            )}
          </div>
        )}

        {/* Step 2: Show Seed Phrase (only for created wallets) */}
        {step === "seed-phrase" && seedPhrase && (
          <div className="space-y-4">
            <TerminalLine prefix="$">
              WALLET CREATED: {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-6)}
            </TerminalLine>
            <TerminalLine prefix="$">
              SAVE YOUR RECOVERY PHRASE
            </TerminalLine>

            <div className="border border-yellow-800 rounded p-4 space-y-3">
              <div className="text-yellow-400 text-sm mb-2">
                Your 12-word recovery phrase is the ONLY way to recover your wallet.
                Write it down and store it somewhere safe.
              </div>

              <div className="grid grid-cols-3 gap-2 bg-black border border-green-900 rounded p-3">
                {seedPhrase.split(" ").map((word, i) => (
                  <div key={i} className="text-xs font-mono">
                    <span className="text-green-900">{i + 1}.</span>{" "}
                    <span className="text-green-400">{word}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(seedPhrase);
                  setSeedCopied(true);
                  setTimeout(() => setSeedCopied(false), 2000);
                }}
                className="w-full border border-green-700 text-green-400 py-2 px-3 rounded font-mono text-xs hover:bg-green-900/30 transition-colors"
              >
                {seedCopied ? "COPIED TO CLIPBOARD" : "[ COPY TO CLIPBOARD ]"}
              </button>

              <div className="border-t border-green-900 pt-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seedConfirmed}
                    onChange={(e) => setSeedConfirmed(e.target.checked)}
                    className="mt-0.5 accent-green-500"
                  />
                  <span className="text-green-600 text-xs">
                    I have saved my recovery phrase in a safe location.
                    I understand that if I lose it, I cannot recover my wallet.
                  </span>
                </label>
              </div>

              <button
                onClick={() => setStep("permissions")}
                disabled={!seedConfirmed}
                className={`w-full border py-3 px-4 rounded font-mono text-sm transition-colors ${
                  seedConfirmed
                    ? "border-green-500 text-green-400 hover:bg-green-900/30"
                    : "border-green-900 text-green-900 cursor-not-allowed"
                }`}
              >
                [ CONTINUE ]
              </button>
            </div>

            <div className="text-yellow-900 text-xs">
              Never share your recovery phrase. POH support will never ask for it.
            </div>
          </div>
        )}

        {/* Step 3: Permissions + Signature + Fingerprint */}
        {step === "permissions" && (
          <div className="space-y-4">
            <TerminalLine prefix="$">
              WALLET CONNECTED: {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-6)}
            </TerminalLine>

            <div className="border border-green-800 rounded p-4 space-y-3">
              <div className="text-green-400 text-sm mb-2">
                Grant permissions to begin mining:
              </div>

              <div className="space-y-2 text-green-600 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-green-400">[+]</span>
                  <span>Background compute — Run science tasks using spare CPU</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">[+]</span>
                  <span>Heartbeat — Send status updates every 15 minutes</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">[+]</span>
                  <span>Battery monitoring — Auto-throttle to protect your device</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">[+]</span>
                  <span>Wallet signature — Cryptographically verify device ownership</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">[+]</span>
                  <span>Device fingerprint — Sybil resistance (one device per wallet)</span>
                </div>
              </div>

              <button
                onClick={handlePermissions}
                disabled={loading}
                className="w-full border border-green-500 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors mt-4"
              >
                {loading ? "SIGNING & REGISTERING..." : "[ SIGN & REGISTER DEVICE ]"}
              </button>
            </div>

            <div className="text-green-900 text-xs">
              Your wallet will sign a registration message to prove ownership.
              This does not cost gas.
            </div>
          </div>
        )}

        {/* Step 3: Connect Wearable (Optional) */}
        {step === "wearable" && (
          <div className="space-y-4">
            <TerminalLine prefix="$">
              DEVICE REGISTERED {sigVerified ? "(SIGNATURE VERIFIED)" : ""}
            </TerminalLine>
            <TerminalLine prefix="$">
              CONNECT WEARABLE FOR FITNESS MINING (OPTIONAL)
            </TerminalLine>

            <div className="border border-green-800 rounded p-4 space-y-3">
              <div className="text-green-400 text-sm mb-2">
                Earn POH by exercising — connect your wearable
              </div>
              <div className="text-green-700 text-xs mb-3">
                Your workouts earn Effort Score points alongside compute mining.
                Both paths share the same daily reward pool.
              </div>

              {fitnessProvider ? (
                <div className="border border-green-500 rounded p-3 text-green-400 text-sm">
                  Wearable connected! Provider: {fitnessProvider}
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleConnectProvider("strava")}
                    disabled={loading}
                    className="w-full border border-green-600 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors text-left"
                  >
                    <div className="font-bold">[1] STRAVA</div>
                    <div className="text-green-700 text-xs mt-1">
                      Best coverage: runs, rides, swims, yoga. Apple Health syncs here too.
                    </div>
                  </button>

                  <button
                    onClick={() => handleConnectProvider("fitbit")}
                    disabled={loading}
                    className="w-full border border-green-600 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors text-left"
                  >
                    <div className="font-bold">[2] FITBIT</div>
                    <div className="text-green-700 text-xs mt-1">
                      Fitbit wearables with heart rate tracking.
                    </div>
                  </button>
                </div>
              )}

              {loading && (
                <TerminalLine prefix="...">
                  Redirecting to provider <BlinkingCursor />
                </TerminalLine>
              )}

              <button
                onClick={handleSkipWearable}
                className="w-full text-green-700 text-xs hover:text-green-400 transition-colors mt-2"
              >
                {fitnessProvider ? "[ CONTINUE ]" : "[ SKIP — COMPUTE MINING ONLY ]"}
              </button>
            </div>

            <div className="text-green-900 text-xs">
              Wearable connection is optional. You can always add it later from the mining dashboard.
            </div>
          </div>
        )}

        {/* Step 5: Folding@Home (Optional) */}
        {step === "fah" && (
          <div className="space-y-4">
            <TerminalLine prefix="$">
              BOOST MINING WITH FOLDING@HOME (OPTIONAL)
            </TerminalLine>

            <div className="border border-green-800 rounded p-4 space-y-3">
              <div className="text-green-400 text-sm mb-2">
                Folding@Home — Real Science Bonus
              </div>
              <div className="text-green-700 text-xs mb-3">
                Run the official Folding@Home client on your desktop to earn
                bonus mining points. Your compute power helps researchers fold
                proteins and discover new drugs.
              </div>

              <div className="text-green-600 text-xs space-y-1">
                <div>1. Download F@H from foldingathome.org</div>
                <div>2. Join the POH team in the F@H client</div>
                <div>3. Link your F@H username in the mining dashboard</div>
              </div>

              <button
                onClick={() => setStep("benchmark")}
                className="w-full border border-green-500 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors mt-2"
              >
                [ CONTINUE ]
              </button>
            </div>

            <div className="text-green-900 text-xs">
              This is optional. You can set up Folding@Home later from the mining dashboard.
            </div>
          </div>
        )}

        {/* Step 6: Device Benchmark */}
        {step === "benchmark" && (
          <div className="space-y-4">
            <TerminalLine prefix="$">
              BENCHMARKING DEVICE CAPABILITIES...
            </TerminalLine>

            <div className="border border-green-800 rounded p-4 space-y-3">
              <div className="text-green-400 text-sm mb-2">
                Device Performance Test
              </div>
              <div className="text-green-700 text-xs mb-3">
                A quick benchmark determines your device tier, which controls
                task difficulty and compute point scaling.
              </div>

              {benchmarkTier !== null ? (
                <div className="border border-green-500 rounded p-3">
                  <div className="text-green-400 text-sm">
                    Capability Tier: <span className="font-bold">
                      {benchmarkTier === 3 ? "3 (Desktop)" : benchmarkTier === 2 ? "2 (Laptop)" : "1 (Phone)"}
                    </span>
                  </div>
                  <div className="text-green-700 text-xs mt-1">
                    {benchmarkTier === 3
                      ? "High-performance: 150-300 residue proteins, 256x256 climate grids"
                      : benchmarkTier === 2
                      ? "Mid-range: 50-150 residue proteins, 128x128 climate grids"
                      : "Mobile: 20-50 residue proteins, 64x64 climate grids"}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleBenchmark}
                  disabled={benchmarking}
                  className="w-full border border-green-500 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors"
                >
                  {benchmarking ? "BENCHMARKING..." : "[ RUN BENCHMARK ]"}
                </button>
              )}

              {benchmarkTier !== null && (
                <button
                  onClick={() => setStep("savings")}
                  className="w-full border border-green-500 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors mt-2"
                >
                  [ CONTINUE ]
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Savings Wallet */}
        {step === "savings" && (
          <div className="space-y-4">
            <TerminalLine prefix="$">
              DEVICE REGISTERED SUCCESSFULLY
            </TerminalLine>
            <TerminalLine prefix="$">
              CONFIGURE SAVINGS WALLET (OPTIONAL)
            </TerminalLine>

            <div className="border border-green-800 rounded p-4 space-y-3">
              <div className="text-green-400 text-sm mb-2">
                Savings Wallet — Cold Storage
              </div>
              <div className="text-green-700 text-xs mb-3">
                Send claimed rewards directly to a hardware wallet (Ledger, etc.)
                so your mining phone never holds valuable tokens. This is optional
                but strongly recommended.
              </div>

              <input
                type="text"
                value={savingsWallet}
                onChange={(e) => setSavingsWallet(e.target.value)}
                placeholder="0x... (Ledger / cold wallet address)"
                className="w-full bg-black border border-green-800 text-green-400 py-2 px-3 rounded font-mono text-sm focus:border-green-500 focus:outline-none placeholder:text-green-900"
              />

              {/* Fitness connection reminder if skipped */}
              {!fitnessProvider && (
                <div className="border border-green-700 rounded p-3 mt-2">
                  <div className="text-green-600 text-xs mb-2">
                    Earn more POH — connect <span className="text-green-400">Strava</span> or <span className="text-green-400">Fitbit</span> to
                    mine with your workouts too
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnectProvider("strava")}
                      disabled={loading}
                      className="flex-1 border border-green-600 text-green-400 py-2 px-3 rounded font-mono text-xs hover:bg-green-900/30 transition-colors"
                    >
                      STRAVA
                    </button>
                    <button
                      onClick={() => handleConnectProvider("fitbit")}
                      disabled={loading}
                      className="flex-1 border border-green-600 text-green-400 py-2 px-3 rounded font-mono text-xs hover:bg-green-900/30 transition-colors"
                    >
                      FITBIT
                    </button>
                  </div>
                  <div className="text-green-900 text-xs mt-1">
                    Or connect later from the mining dashboard.
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSavingsWallet}
                  className="flex-1 border border-green-500 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors"
                >
                  {savingsWallet ? "[ SET & START MINING ]" : "[ SKIP — START MINING ]"}
                </button>
              </div>
            </div>

            <div className="text-green-900 text-xs">
              You can change your savings wallet later from the mining dashboard.
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="border border-red-500 rounded p-3 mt-4 text-red-400 text-sm">
            ERROR: {error}
          </div>
        )}
      </div>
    </Terminal>
  );
}
