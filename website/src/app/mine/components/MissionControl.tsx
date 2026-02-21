"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TerminalStatus,
  TerminalProgress,
  TerminalLine,
  TerminalLog,
  BlinkingCursor,
} from "./Terminal";

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
}: MissionControlProps) {
  const [log, setLog] = useState<string[]>([]);
  const [uptime, setUptime] = useState(0);

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
          value={epoch || "—"}
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
            value={`${batteryLevel}%${charging ? " ⚡" : ""}`}
            color={batteryLevel > 20 ? "green" : "red"}
          />
        )}
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
