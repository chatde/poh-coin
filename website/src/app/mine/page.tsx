"use client";

import { useState, useEffect, useCallback } from "react";
import { Terminal, TerminalHeader } from "./components/Terminal";
import MissionControl from "./components/MissionControl";
import NodeMap from "./components/NodeMap";
import FitnessPanel from "./components/FitnessPanel";
import FitnessLeaderboard from "./components/FitnessLeaderboard";
import WalletManager from "./components/WalletManager";
import FAHPanel from "./components/FAHPanel";
import { useCompute } from "./hooks/useCompute";
import { useHeartbeat } from "./hooks/useHeartbeat";
import { useBattery } from "./hooks/useBattery";
import { useFitness } from "./hooks/useFitness";

export default function MinePage() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [deviceCount, setDeviceCount] = useState(0);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [savingsWallet, setSavingsWallet] = useState<string | null>(null);
  const [miningView, setMiningView] = useState<"compute" | "fitness" | "both">("both");

  const compute = useCompute(deviceId);
  const heartbeat = useHeartbeat(deviceId);
  const battery = useBattery();
  const fitness = useFitness(walletAddress, deviceId);

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

  const handleConnectWearable = useCallback(() => {
    window.location.href = "/mine/setup?step=wearable";
  }, []);

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

  // Combined earning rate display
  const computeRate = compute.isMining ? "active" : "paused";
  const fitnessRate = fitness.connected ? `${Math.round(fitness.todayEffort)} effort` : "not connected";

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

      {/* Fitness + F@H connection prompts — visible at top on mobile */}
      {!fitness.connected && (
        <div className="border border-green-700 rounded p-3 mb-4 flex items-center justify-between gap-3">
          <div className="text-green-600 text-xs">
            Earn more POH — connect <span className="text-green-400">Strava</span> to mine with your workouts
          </div>
          <button
            onClick={handleConnectWearable}
            className="shrink-0 border border-green-500 text-green-400 py-2.5 px-4 rounded font-mono text-xs hover:bg-green-900/30 transition-colors"
          >
            [ CONNECT ]
          </button>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        {(["both", "compute", "fitness"] as const).map((view) => (
          <button
            key={view}
            onClick={() => setMiningView(view)}
            className={`text-xs font-mono px-4 py-2 rounded border transition-colors ${
              miningView === view
                ? "border-green-500 text-green-400 bg-green-900/20"
                : "border-green-900 text-green-700 hover:text-green-400"
            }`}
          >
            {view.toUpperCase()}
          </button>
        ))}
        <div className="flex-1" />
        <div className="text-green-700 text-xs self-center">
          Compute: {computeRate} | Fitness: {fitnessRate}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main dashboard — 2 columns on desktop */}
        <div className="lg:col-span-2">
          {(miningView === "both" || miningView === "compute") && (
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
              blockState={compute.blockState}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Fitness Panel */}
          {(miningView === "both" || miningView === "fitness") && (
            <FitnessPanel
              connected={fitness.connected}
              provider={fitness.provider}
              lastSync={fitness.lastSync}
              todayEffort={fitness.todayEffort}
              weekEffort={fitness.weekEffort}
              streak={fitness.streak}
              recentActivities={fitness.recentActivities}
              syncing={fitness.syncing}
              onSync={fitness.syncActivities}
              onDisconnect={fitness.disconnect}
              onConnect={handleConnectWearable}
            />
          )}

          {/* Fitness Leaderboard */}
          {(miningView === "both" || miningView === "fitness") && (
            <FitnessLeaderboard walletAddress={walletAddress} />
          )}

          <NodeMap deviceId={deviceId} walletAddress={walletAddress} />

          {/* Folding@Home Panel */}
          {walletAddress && <FAHPanel walletAddress={walletAddress} />}

          {/* Wallet Management */}
          {walletAddress && (
            <WalletManager
              walletAddress={walletAddress}
              savingsWallet={savingsWallet}
              points={points}
            />
          )}

          {/* Quick links */}
          <div className="border border-green-800 rounded p-3">
            <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
              Navigation
            </div>
            <div className="space-y-1">
              <a href="/blocks" className="block text-green-600 text-xs hover:text-green-400">
                {">"} BLOCK EXPLORER
              </a>
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
