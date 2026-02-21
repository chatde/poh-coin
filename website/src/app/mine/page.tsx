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

  const compute = useCompute(deviceId);
  const heartbeat = useHeartbeat(deviceId);
  const battery = useBattery();

  // Load device ID from localStorage on mount
  useEffect(() => {
    const storedDevice = localStorage.getItem("poh-device-id");
    const storedWallet = localStorage.getItem("poh-wallet");

    if (storedDevice && storedWallet) {
      setDeviceId(storedDevice);
      setWalletAddress(storedWallet);
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
    return null;
  }

  return (
    <Terminal>
      <TerminalHeader />

      {/* Battery warning */}
      {battery.shouldStop && (
        <div className="border border-red-500 rounded p-3 mb-4 text-red-400 text-sm">
          ⚠ THERMAL LIMIT REACHED — Mining paused. Device temperature too high.
          {!battery.charging && " Connect charger to resume."}
        </div>
      )}
      {battery.shouldThrottle && !battery.shouldStop && (
        <div className="border border-yellow-500 rounded p-3 mb-4 text-yellow-400 text-sm">
          ⚡ THERMAL THROTTLE — Reducing compute intensity to protect device.
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

        {/* Sidebar — node map */}
        <div>
          <NodeMap />

          {/* Device info */}
          <div className="border border-green-800 rounded p-3 mt-4">
            <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
              Device Info
            </div>
            <div className="text-green-700 text-xs space-y-1">
              <div>ID: {deviceId?.slice(0, 16)}...</div>
              <div>Wallet: {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-6)}</div>
              <div>Battery API: {battery.supported ? "Yes" : "No"}</div>
            </div>
          </div>

          {/* Quick links */}
          <div className="border border-green-800 rounded p-3 mt-4">
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
