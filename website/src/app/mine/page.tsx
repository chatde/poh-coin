"use client";

import { useState, useEffect, useCallback } from "react";
import { Terminal, TerminalHeader } from "./components/Terminal";
import MissionControl from "./components/MissionControl";
import NodeMap from "./components/NodeMap";
import { useCompute } from "./hooks/useCompute";
import { useHeartbeat } from "./hooks/useHeartbeat";
import { useBattery } from "./hooks/useBattery";

export default function MinePage() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [deviceCount, setDeviceCount] = useState(0);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [savingsWallet, setSavingsWallet] = useState<string | null>(null);

  const compute = useCompute(deviceId);
  const heartbeat = useHeartbeat(deviceId);
  const battery = useBattery();

  // Load device ID from localStorage on mount
  useEffect(() => {
    const storedDevice = localStorage.getItem("poh-device-id");
    const storedWallet = localStorage.getItem("poh-wallet");
    const storedSavings = localStorage.getItem("poh-savings-wallet");

    if (storedDevice && storedWallet) {
      setDeviceId(storedDevice);
      setWalletAddress(storedWallet);
      setSavingsWallet(storedSavings);
    } else {
      setNeedsSetup(true);
    }
  }, []);

  // Fetch points periodically
  useEffect(() => {
    if (!walletAddress) return;

    const fetchPoints = async () => {
      try {
        const res = await fetch(`/api/mine/points?address=${walletAddress}`);
        if (res.ok) {
          const data = await res.json();
          setPoints(data.points || 0);
          setStreak(data.streak || 0);
          setEpoch(data.epoch || 0);
          setDeviceCount(data.devices || 0);
        }
      } catch {
        // Will retry
      }
    };

    fetchPoints();
    const interval = setInterval(fetchPoints, 30_000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Keep screen awake while mining (Wake Lock API)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if (compute.isMining && "wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((wl) => {
        wakeLock = wl;
      }).catch(() => {});
    }
    return () => { wakeLock?.release(); };
  }, [compute.isMining]);

  // Auto-start heartbeat when mining resumes
  useEffect(() => {
    if (compute.isMining && !heartbeat.connected) {
      heartbeat.start();
    }
  }, [compute.isMining]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartMining = useCallback(() => {
    if (battery.shouldStop) return;
    heartbeat.start();
    compute.startMining();
  }, [battery.shouldStop, heartbeat, compute]);

  const handleStopMining = useCallback(() => {
    compute.stopMining();
    heartbeat.stop();
  }, [compute, heartbeat]);

  // Redirect to setup if needed
  if (needsSetup) {
    if (typeof window !== "undefined") {
      window.location.href = "/mine/setup";
    }
    return (
      <Terminal>
        <TerminalHeader />
        <div className="text-green-600 text-sm animate-pulse">
          Redirecting to setup...
        </div>
      </Terminal>
    );
  }

  return (
    <Terminal>
      <TerminalHeader />

      {/* Battery warning */}
      {battery.shouldStop && (
        <div className="border border-red-500 rounded p-3 mb-4 text-red-400 text-sm">
          THERMAL LIMIT REACHED — Mining paused. Device temperature too high.
          {!battery.charging && " Connect charger to resume."}
        </div>
      )}
      {battery.shouldThrottle && !battery.shouldStop && (
        <div className="border border-yellow-500 rounded p-3 mb-4 text-yellow-400 text-sm">
          THERMAL THROTTLE — Reducing compute intensity to protect device.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main dashboard — 2 columns on desktop */}
        <div className="lg:col-span-2">
          <MissionControl
            status={compute.status}
            taskDisplayName={compute.taskDisplayName}
            progress={compute.progress}
            progressStep={compute.progressStep}
            tasksCompleted={compute.tasksCompleted}
            totalComputeMs={compute.totalComputeMs}
            points={points}
            streak={streak}
            epoch={epoch}
            devices={deviceCount}
            connected={heartbeat.connected}
            batteryLevel={battery.level}
            charging={battery.charging}
            isMining={compute.isMining}
            onStartMining={handleStartMining}
            onStopMining={handleStopMining}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <NodeMap deviceId={deviceId} walletAddress={walletAddress} />

          {/* Wallet Management */}
          <div className="border border-green-800 rounded p-3">
            <button
              onClick={() => setShowWallet(!showWallet)}
              className="w-full flex justify-between items-center text-green-500 text-xs uppercase tracking-widest"
            >
              <span>Wallet</span>
              <span className="text-green-700">{showWallet ? "[-]" : "[+]"}</span>
            </button>

            {showWallet && (
              <div className="mt-3 space-y-3">
                {/* Mining Wallet */}
                <div>
                  <div className="text-green-700 text-xs mb-1">Mining Wallet (Hot)</div>
                  <div className="bg-black border border-green-900 rounded p-2 font-mono text-xs text-green-400 break-all select-all">
                    {walletAddress}
                  </div>
                  <div className="text-green-900 text-xs mt-1">
                    This wallet signs mining transactions. Keep minimal funds here.
                  </div>
                </div>

                {/* Savings Wallet */}
                <div>
                  <div className="text-green-700 text-xs mb-1">
                    Savings Wallet (Cold){" "}
                    {savingsWallet ? (
                      <span className="text-green-500">SET</span>
                    ) : (
                      <span className="text-yellow-500">NOT SET</span>
                    )}
                  </div>
                  {savingsWallet ? (
                    <div className="bg-black border border-green-900 rounded p-2 font-mono text-xs text-green-400 break-all select-all">
                      {savingsWallet}
                    </div>
                  ) : (
                    <div className="text-yellow-600 text-xs">
                      No savings wallet set. Rewards will be held in your mining wallet.
                      Set one in{" "}
                      <a href="/security" className="underline hover:text-green-400">
                        Security Settings
                      </a>.
                    </div>
                  )}
                </div>

                {/* Mnemonic Warning */}
                {sessionStorage.getItem("poh-mnemonic") && (
                  <div className="border border-yellow-800 rounded p-2">
                    <div className="text-yellow-500 text-xs font-bold mb-1">
                      BACKUP YOUR RECOVERY PHRASE
                    </div>
                    <div className="text-yellow-700 text-xs">
                      Your wallet was created on this device. If you clear browser data
                      without backing up, you lose access to any tokens.
                      Go to <a href="/security" className="underline hover:text-yellow-400">Security</a> to
                      learn how to secure your wallet.
                    </div>
                  </div>
                )}

                {/* How rewards work */}
                <div className="border-t border-green-900 pt-2">
                  <div className="text-green-700 text-xs mb-1">How Rewards Work</div>
                  <div className="text-green-800 text-xs space-y-1">
                    <div>1. Mine and earn points each week</div>
                    <div>2. Sunday: epoch closes, rewards calculated</div>
                    <div>3. Monday: merkle root posted (24h timelock)</div>
                    <div>4. Tuesday: claim your POH tokens</div>
                    <div>5. Tokens go to savings wallet (if set)</div>
                  </div>
                </div>

                {/* Points info */}
                <div className="border-t border-green-900 pt-2">
                  <div className="text-green-700 text-xs">
                    Points this epoch: <span className="text-green-400">{points}</span>
                    {" "}— POH rewards are calculated at epoch close based on your share of total network points.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="border border-green-800 rounded p-3">
            <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
              Navigation
            </div>
            <div className="space-y-1">
              <a href="/leaderboard" className="block text-green-600 text-xs hover:text-green-400">
                {">"} LEADERBOARD
              </a>
              <a href="/impact" className="block text-green-600 text-xs hover:text-green-400">
                {">"} IMPACT DASHBOARD
              </a>
              <a href="/security" className="block text-green-600 text-xs hover:text-green-400">
                {">"} SECURE YOUR TOKENS
              </a>
              <a href="/" className="block text-green-600 text-xs hover:text-green-400">
                {">"} MAIN SITE
              </a>
            </div>
          </div>
        </div>
      </div>
    </Terminal>
  );
}
