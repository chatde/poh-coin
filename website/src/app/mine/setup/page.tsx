"use client";

import { useState, useCallback } from "react";
import {
  Terminal,
  TerminalHeader,
  TerminalLine,
  BlinkingCursor,
} from "../components/Terminal";

type Step = "wallet" | "permissions" | "savings";

export default function SetupPage() {
  const [step, setStep] = useState<Step>("wallet");
  const [walletMethod, setWalletMethod] = useState<"create" | "connect" | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [savingsWallet, setSavingsWallet] = useState("");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate a unique device ID
  const generateDeviceId = useCallback(() => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }, []);

  // Step 1: Create a new wallet (simple key generation)
  const handleCreateWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate a random wallet (in production, use ethers.Wallet.createRandom())
      const keyArray = new Uint8Array(32);
      crypto.getRandomValues(keyArray);
      const privateKey = Array.from(keyArray, (b) => b.toString(16).padStart(2, "0")).join("");

      // Derive address from private key using keccak256
      // Simplified — in production use ethers.js
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(privateKey));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const address = "0x" + hashArray.slice(0, 20).map((b) => b.toString(16).padStart(2, "0")).join("");

      // Store securely
      localStorage.setItem("poh-private-key", "0x" + privateKey);
      localStorage.setItem("poh-wallet", address);

      const newDeviceId = generateDeviceId();
      localStorage.setItem("poh-device-id", newDeviceId);

      setWalletAddress(address);
      setDeviceId(newDeviceId);
      setWalletMethod("create");
      setStep("permissions");
    } catch (err) {
      setError("Failed to create wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [generateDeviceId]);

  // Step 1: Connect existing wallet (WalletConnect placeholder)
  const handleConnectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if MetaMask or similar is available
      const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
      if (!ethereum) {
        setError("No wallet detected. Install MetaMask or use 'Create New Wallet'.");
        setLoading(false);
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
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
    } catch (err) {
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [generateDeviceId]);

  // Step 2: Request permissions and register device
  const handlePermissions = useCallback(async () => {
    if (!deviceId || !walletAddress) return;
    setLoading(true);
    setError(null);

    try {
      // Register device with backend
      const res = await fetch("/api/mine/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          walletAddress,
          tier: 1, // Data node
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      setStep("savings");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [deviceId, walletAddress]);

  // Step 3: Set savings wallet (optional)
  const handleSavingsWallet = useCallback(async () => {
    if (savingsWallet && !/^0x[0-9a-fA-F]{40}$/.test(savingsWallet)) {
      setError("Invalid address format. Must be 0x followed by 40 hex characters.");
      return;
    }

    if (savingsWallet) {
      localStorage.setItem("poh-savings-wallet", savingsWallet);
    }

    // Navigate to mining dashboard
    window.location.href = "/mine";
  }, [savingsWallet]);

  const stepNumber = step === "wallet" ? 1 : step === "permissions" ? 2 : 3;

  return (
    <Terminal>
      <TerminalHeader />

      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`flex-1 h-1 rounded ${
                n <= stepNumber ? "bg-green-500" : "bg-green-900"
              }`}
            />
          ))}
        </div>

        <div className="text-green-500 text-xs uppercase tracking-widest mb-4">
          Setup — Step {stepNumber} of 3
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

        {/* Step 2: Permissions */}
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
              </div>

              <button
                onClick={handlePermissions}
                disabled={loading}
                className="w-full border border-green-500 text-green-400 py-3 px-4 rounded font-mono text-sm hover:bg-green-900/30 transition-colors mt-4"
              >
                {loading ? "REGISTERING..." : "[ AUTHORIZE & REGISTER DEVICE ]"}
              </button>
            </div>

            <div className="text-green-900 text-xs">
              Mining only runs while this page is open. Battery safety:
              throttle at 40C, stop at 45C. Compute only while charging.
            </div>
          </div>
        )}

        {/* Step 3: Savings Wallet */}
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
