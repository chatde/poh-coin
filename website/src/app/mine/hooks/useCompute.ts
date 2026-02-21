"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TASK_DESCRIPTIONS } from "@/lib/science-data";

interface Task {
  task_id: string;
  task_type: string;
  payload: Record<string, unknown>;
  difficulty: number;
}

interface ComputeState {
  status: "idle" | "loading" | "computing" | "submitting" | "error";
  currentTask: Task | null;
  progress: number;
  progressStep: string;
  tasksCompleted: number;
  totalComputeMs: number;
  error: string | null;
}

// Persistence keys
const PERSIST_KEY = "poh-mining-state";

function loadPersistedState(): Partial<ComputeState> {
  try {
    const stored = localStorage.getItem(PERSIST_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        tasksCompleted: parsed.tasksCompleted || 0,
        totalComputeMs: parsed.totalComputeMs || 0,
      };
    }
  } catch {}
  return {};
}

function persistState(state: { tasksCompleted: number; totalComputeMs: number }) {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch {}
}

function getTaskDisplayName(task: Task): string {
  const category = task.task_type;
  const payload = task.payload;

  // Check if task has a science data ID we can look up
  const scienceId = payload.scienceId as string | undefined;
  if (scienceId && TASK_DESCRIPTIONS[category]?.[scienceId]) {
    return TASK_DESCRIPTIONS[category][scienceId];
  }

  // Fallback to generic names
  const genericNames: Record<string, string> = {
    protein: "Protein Structure Optimization",
    climate: "Climate Grid Simulation",
    signal: "Seismic Signal Analysis",
  };
  return genericNames[category] || category;
}

export function useCompute(deviceId: string | null) {
  const persisted = loadPersistedState();
  const [state, setState] = useState<ComputeState>({
    status: "idle",
    currentTask: null,
    progress: 0,
    progressStep: "",
    tasksCompleted: persisted.tasksCompleted || 0,
    totalComputeMs: persisted.totalComputeMs || 0,
    error: null,
  });

  const [isMining, setIsMining] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const isMiningRef = useRef(false);

  // Persist stats whenever they change
  useEffect(() => {
    persistState({
      tasksCompleted: state.tasksCompleted,
      totalComputeMs: state.totalComputeMs,
    });
  }, [state.tasksCompleted, state.totalComputeMs]);

  // Auto-resume mining if was mining before (page refresh)
  useEffect(() => {
    const wasMining = localStorage.getItem("poh-was-mining") === "true";
    if (wasMining && deviceId && !isMiningRef.current) {
      // Small delay to let other hooks initialize
      const timer = setTimeout(() => {
        isMiningRef.current = true;
        setIsMining(true);
        setState((s) => ({ ...s, status: "loading", error: null, progressStep: "Resuming mining after refresh..." }));
        runMiningLoop();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTask = useCallback(async (): Promise<Task | null> => {
    if (!deviceId) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(`/api/mine/task?deviceId=${deviceId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      return data.task || null;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }, [deviceId]);

  const submitResult = useCallback(
    async (taskId: string, result: unknown, computeTimeMs: number) => {
      if (!deviceId) return;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        await fetch("/api/mine/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, taskId, result, computeTimeMs }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
      } catch {
        clearTimeout(timeout);
        // Submission failed — will not block mining loop
      }
    },
    [deviceId]
  );

  const runMiningLoop = useCallback(async () => {
    if (!deviceId || !isMiningRef.current) return;

    // Initialize worker
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/compute.worker.ts", import.meta.url)
      );
    }

    const worker = workerRef.current;

    while (isMiningRef.current) {
      // 1. Fetch task
      setState((s) => ({ ...s, status: "loading", progress: 0, progressStep: "Requesting work unit..." }));

      const task = await fetchTask();
      if (!task) {
        setState((s) => ({ ...s, status: "idle", progressStep: "No tasks available. Retrying in 10s..." }));
        await new Promise((r) => setTimeout(r, 10_000));
        if (!isMiningRef.current) break;
        continue;
      }

      // 2. Compute
      const displayName = getTaskDisplayName(task);
      setState((s) => ({
        ...s,
        status: "computing",
        currentTask: task,
        progress: 0,
        progressStep: `Computing: ${displayName}`,
      }));

      const result = await new Promise<{ result: unknown; computeTimeMs: number }>((resolve, reject) => {
        let resolved = false;
        // Timeout: if worker doesn't respond in 5 minutes, fail
        const workerTimeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            worker.removeEventListener("message", handler);
            reject(new Error("Worker timeout"));
          }
        }, 5 * 60 * 1000);

        const handler = (event: MessageEvent) => {
          const msg = event.data;
          if (msg.taskId !== task.task_id) return;

          if (msg.type === "progress") {
            setState((s) => ({
              ...s,
              progress: msg.percent,
              progressStep: msg.step,
            }));
          } else if (msg.type === "result") {
            if (!resolved) {
              resolved = true;
              clearTimeout(workerTimeout);
              worker.removeEventListener("message", handler);
              resolve({ result: msg.result, computeTimeMs: msg.computeTimeMs });
            }
          }
        };

        worker.addEventListener("message", handler);
        worker.postMessage({
          type: "run",
          taskId: task.task_id,
          taskType: task.task_type,
          payload: task.payload,
        });
      }).catch(() => null);

      if (!result || !isMiningRef.current) {
        if (!isMiningRef.current) break;
        // Worker timed out — recreate worker and continue
        workerRef.current?.terminate();
        workerRef.current = new Worker(
          new URL("../workers/compute.worker.ts", import.meta.url)
        );
        setState((s) => ({ ...s, status: "idle", progressStep: "Task timed out. Retrying..." }));
        await new Promise((r) => setTimeout(r, 2_000));
        continue;
      }

      // 3. Submit
      setState((s) => ({
        ...s,
        status: "submitting",
        progress: 100,
        progressStep: "Submitting results for verification...",
      }));

      await submitResult(task.task_id, result.result, result.computeTimeMs);

      setState((s) => ({
        ...s,
        tasksCompleted: s.tasksCompleted + 1,
        totalComputeMs: s.totalComputeMs + result.computeTimeMs,
        progressStep: "Verified! Requesting next task...",
      }));

      // Brief pause between tasks
      await new Promise((r) => setTimeout(r, 1_000));
    }
  }, [deviceId, fetchTask, submitResult]);

  const startMining = useCallback(() => {
    if (isMiningRef.current) return;
    isMiningRef.current = true;
    setIsMining(true);
    localStorage.setItem("poh-was-mining", "true");
    setState((s) => ({ ...s, status: "loading", error: null }));
    runMiningLoop();
  }, [runMiningLoop]);

  const stopMining = useCallback(() => {
    isMiningRef.current = false;
    setIsMining(false);
    localStorage.setItem("poh-was-mining", "false");
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setState((s) => ({ ...s, status: "idle", progressStep: "Mining stopped." }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMiningRef.current = false;
      workerRef.current?.terminate();
    };
  }, []);

  return {
    ...state,
    taskDisplayName: state.currentTask
      ? getTaskDisplayName(state.currentTask)
      : null,
    isMining,
    startMining,
    stopMining,
  };
}
