"use client";

import { useState, useEffect } from "react";
import {
  TerminalStatus,
  TerminalProgress,
  TerminalLine,
  TerminalLog,
  BlinkingCursor,
} from "./Terminal";
import { calculateWeeklyPool } from "@/lib/constants";
import type { BlockState } from "../hooks/useCompute";

interface MissionControlProps {
  status: "idle" | "loading" | "computing" | "submitting" | "error";
  taskDisplayName: string | null;
  progress: number;
  progressStep: string;
  tasksCompleted: number;
  totalComputeMs: number;
  points: number;
  streak: number;
  epoch: number;
  devices: number;
  connected: boolean;
  batteryLevel: number | null;
  charging: boolean | null;
  isMining: boolean;
  onStartMining: () => void;
  onStopMining: () => void;
  blockState?: BlockState;
}

function formatEpoch(epoch: number): string {
  if (!epoch) return "—";
  // Epoch is a week number. Show as "Week N" with date range
  // Epochs start from launch date (Feb 21, 2026)
  const launchDate = new Date("2026-02-21T00:00:00Z");
  const weekStart = new Date(launchDate.getTime() + (epoch - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Week ${epoch} (${fmt(weekStart)} - ${fmt(weekEnd)})`;
}

export default function MissionControl({
  status,
  taskDisplayName,
  progress,
  progressStep,
  tasksCompleted,
  totalComputeMs,
  points,
  streak,
  epoch,
  devices,
  connected,
  batteryLevel,
  charging,
  isMining,
  onStartMining,
  onStopMining,
  blockState,
}: MissionControlProps) {
  const [log, setLog] = useState<string[]>([]);
  const [uptime, setUptime] = useState(0);
  const [stats, setStats] = useState<{
    verifiedTasks: number;
    activeNodes: number;
  } | null>(null);

  // Track uptime
  useEffect(() => {
    if (!isMining) return;
    const start = Date.now();
    const timer = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isMining]);

  // Add to log on progress changes
  useEffect(() => {
    if (progressStep) {
      setLog((l) => [...l.slice(-99), `${new Date().toLocaleTimeString()} — ${progressStep}`]);
    }
  }, [progressStep]);

  // Fetch global stats for the impact section
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/data/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({
            verifiedTasks: data.verifiedTasks || 0,
            activeNodes: data.activeNodes || 0,
          });
        }
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const statusDisplay = {
    idle: "STANDBY",
    loading: "ACQUIRING TARGET",
    computing: "COMPUTING",
    submitting: "TRANSMITTING",
    error: "ERROR",
  };

  const statusColor = {
    idle: "yellow" as const,
    loading: "blue" as const,
    computing: "green" as const,
    submitting: "blue" as const,
    error: "red" as const,
  };

  return (
    <div className="space-y-4">
      {/* Mission Status Header */}
      <div className="border border-green-800 rounded p-3">
        <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
          Mission Status
        </div>
        <TerminalStatus
          label="STATUS"
          value={statusDisplay[status]}
          color={statusColor[status]}
        />
        <TerminalStatus
          label="EPOCH"
          value={formatEpoch(epoch)}
        />
        <TerminalStatus
          label="UPTIME"
          value={isMining ? formatTime(uptime) : "00:00:00"}
        />
        <TerminalStatus
          label="HEARTBEAT"
          value={connected ? "CONNECTED" : "DISCONNECTED"}
          color={connected ? "green" : "red"}
        />
      </div>

      {/* Current Task */}
      {isMining && (
        <div className="border border-green-800 rounded p-3">
          <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
            Current Task
          </div>
          <TerminalLine>
            {taskDisplayName || "Waiting for assignment..."}
            {status === "computing" && <BlinkingCursor />}
          </TerminalLine>
          {status === "computing" && (
            <div className="mt-2">
              <TerminalProgress percent={progress} />
              <div className="text-green-700 text-xs mt-1">{progressStep}</div>
            </div>
          )}
        </div>
      )}

      {/* Voyager Block Progress */}
      {blockState && (
        <div className="border border-green-800 rounded p-3">
          <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
            Voyager Block Mining
          </div>
          <TerminalStatus
            label="BLOCK HEIGHT"
            value={blockState.currentBlockHeight.toLocaleString()}
          />
          <TerminalStatus
            label="BLOCK REWARD"
            value={`${Math.round(blockState.currentBlockReward).toLocaleString()} POH`}
            color="green"
          />
          <TerminalStatus
            label="BLOCKS MINED"
            value={blockState.blocksMined}
            color="green"
          />

          {/* Task progress toward block */}
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-600">TASKS → BLOCK</span>
              <span className="text-green-400">
                {blockState.blockTasksCompleted}/{blockState.tasksPerBlock}
              </span>
            </div>
            <div className="w-full bg-green-900/30 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (blockState.blockTasksCompleted / blockState.tasksPerBlock) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Equation solver status */}
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-600">EQUATION</span>
              <span className={blockState.equationSolved ? "text-green-400" : "text-yellow-400"}>
                {blockState.equationSolved
                  ? "SOLVED"
                  : isMining
                    ? `${blockState.equationHashRate.toLocaleString()} H/s`
                    : "IDLE"}
              </span>
            </div>
            <div className="w-full bg-green-900/30 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  blockState.equationSolved
                    ? "bg-green-400 w-full"
                    : isMining
                      ? "bg-yellow-500/70 w-1/2 animate-pulse"
                      : "w-0"
                }`}
              />
            </div>
          </div>

          {/* Difficulty */}
          <div className="mt-2 text-green-700 text-xs">
            Difficulty: {blockState.equationDifficulty} leading zeros
            {" | "}SHA-256 PoW (WASM)
          </div>
        </div>
      )}

      {/* Telemetry */}
      <div className="border border-green-800 rounded p-3">
        <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
          Telemetry
        </div>
        <TerminalStatus label="POINTS THIS EPOCH" value={points} />
        <TerminalStatus label="TASKS COMPLETED" value={tasksCompleted} />
        <TerminalStatus
          label="COMPUTE TIME"
          value={`${(totalComputeMs / 1000).toFixed(1)}s`}
        />
        <TerminalStatus
          label="STREAK"
          value={streak > 0 ? `${streak} days` : "—"}
          color={streak >= 30 ? "green" : streak >= 7 ? "yellow" : "green"}
        />
        <TerminalStatus label="DEVICES" value={devices} />
        {batteryLevel !== null && (
          <TerminalStatus
            label="BATTERY"
            value={`${batteryLevel}%${charging ? " [CHARGING]" : ""}`}
            color={batteryLevel > 20 ? "green" : "red"}
          />
        )}
      </div>

      {/* Rewards Explainer */}
      <div className="border border-green-800 rounded p-3">
        <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
          Epoch Rewards
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-green-600">WEEKLY POOL</span>
            <span className="text-green-400 font-bold">
              {Math.round(calculateWeeklyPool()).toLocaleString()} POH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600">YOUR SHARE</span>
            <span className="text-green-400 font-bold">
              {points > 0 && stats?.activeNodes
                ? "Proportional to your points"
                : "Start mining to earn"}
            </span>
          </div>
          <div className="mt-2 border-t border-green-900 pt-2">
            <div className="text-green-700 leading-relaxed">
              Each epoch = 1 week. You earn 1 point per verified task.
              At epoch end, ~{(calculateWeeklyPool() / 1_000_000).toFixed(1)}M POH
              is split among all miners proportional to points earned.
              Fewer miners = more POH per point. Bonuses for streaks,
              quality, and referrals.
            </div>
          </div>
        </div>
      </div>

      {/* Global Impact */}
      <div className="border border-green-800 rounded p-3">
        <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
          Global Impact
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-green-600 text-xs">YOUR CONTRIBUTION</span>
            <span className="text-green-400 text-xs font-bold">{tasksCompleted} tasks verified</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 text-xs">NETWORK TASKS</span>
            <span className="text-green-400 text-xs font-bold">
              {(stats?.verifiedTasks || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 text-xs">ACTIVE NODES</span>
            <span className="text-green-400 text-xs font-bold">
              {stats?.activeNodes || 1}
            </span>
          </div>

          {/* Research categories */}
          <div className="mt-3 border-t border-green-900 pt-2">
            <div className="text-green-700 text-xs mb-1">Research Areas:</div>
            <div className="space-y-1">
              <div className="text-green-600 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Protein Folding — Parkinson's, Cancer, Drug Design
              </div>
              <div className="text-green-600 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                Climate Modeling — Arctic Ice, Ocean Dynamics, Urban Heat
              </div>
              <div className="text-green-600 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Seismic Analysis — Earthquake Early Warning Systems
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mining Control */}
      <div className="flex gap-4">
        {!isMining ? (
          <button
            onClick={onStartMining}
            className="flex-1 border border-green-500 text-green-400 py-3 px-6 rounded font-mono text-sm uppercase tracking-widest hover:bg-green-900/30 transition-colors"
          >
            [ START MINING ]
          </button>
        ) : (
          <button
            onClick={onStopMining}
            className="flex-1 border border-red-500 text-red-400 py-3 px-6 rounded font-mono text-sm uppercase tracking-widest hover:bg-red-900/30 transition-colors"
          >
            [ STOP MINING ]
          </button>
        )}
      </div>

      {/* Activity Log */}
      <div>
        <div className="text-green-500 text-xs uppercase tracking-widest mb-1">
          Activity Log
        </div>
        <TerminalLog entries={log} />
      </div>
    </div>
  );
}
