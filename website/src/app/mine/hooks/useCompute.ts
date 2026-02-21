"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

const TASK_DISPLAY_NAMES: Record<string, string> = {
  protein: "Protein Structure Optimization",
  climate: "Climate Grid Simulation",
  signal: "Seismic Signal Analysis",
};

export function useCompute(deviceId: string | null) {
  const [state, setState] = useState<ComputeState>({
    status: "idle",
    currentTask: null,
    progress: 0,
    progressStep: "",
    tasksCompleted: 0,
    totalComputeMs: 0,
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const isMiningRef = useRef(false);

  const fetchTask = useCallback(async (): Promise<Task | null> => {
    if (!deviceId) return null;
    try {
      const res = await fetch(`/api/mine/task?deviceId=${deviceId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.task || null;
    } catch {
      return null;
    }
  }, [deviceId]);

  const submitResult = useCallback(
    async (taskId: string, result: unknown, computeTimeMs: number) => {
      if (!deviceId) return;
      try {
        await fetch("/api/mine/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, taskId, result, computeTimeMs }),
        });
      } catch {
        // Will retry on next cycle
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
        setState((s) => ({ ...s, status: "idle", progressStep: "No tasks available. Waiting..." }));
        await new Promise((r) => setTimeout(r, 10_000));
        continue;
      }

      // 2. Compute
      setState((s) => ({
        ...s,
        status: "computing",
        currentTask: task,
        progress: 0,
        progressStep: `Computing: ${TASK_DISPLAY_NAMES[task.task_type] || task.task_type}`,
      }));

      const result = await new Promise<{ result: unknown; computeTimeMs: number }>((resolve) => {
        const handler = (event: MessageEvent) => {
          const msg = event.data;
          if (msg.type === "progress" && msg.taskId === task.task_id) {
            setState((s) => ({
              ...s,
              progress: msg.percent,
              progressStep: msg.step,
            }));
          } else if (msg.type === "result" && msg.taskId === task.task_id) {
            worker.removeEventListener("message", handler);
            resolve({ result: msg.result, computeTimeMs: msg.computeTimeMs });
          }
        };

        worker.addEventListener("message", handler);
        worker.postMessage({
          type: "run",
          taskId: task.task_id,
          taskType: task.task_type,
          payload: task.payload,
        });
      });

      if (!isMiningRef.current) break;

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
    setState((s) => ({ ...s, status: "loading", error: null }));
    runMiningLoop();
  }, [runMiningLoop]);

  const stopMining = useCallback(() => {
    isMiningRef.current = false;
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
      ? TASK_DISPLAY_NAMES[state.currentTask.task_type] || state.currentTask.task_type
      : null,
    isMining: isMiningRef.current,
    startMining,
    stopMining,
  };
}
