"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getTaskDisplayName } from "@/lib/science-data";
import { createClient } from "@supabase/supabase-js";
import { getBlockHeight, getBlockReward } from "@/lib/voyager-block";
import { TASKS_PER_BLOCK_MIN } from "@/lib/constants";

interface Task {
  task_id: string;
  task_type: string;
  payload: Record<string, unknown>;
  difficulty: number;
  seed?: string;
  task_version?: string;
  source?: string;
}

interface ComputeState {
  status: "idle" | "loading" | "computing" | "submitting" | "error";
  currentTask: Task | null;
  progress: number;
  progressStep: string;
  tasksCompleted: number;
  totalComputeMs: number;
  error: string | null;
  submissionStatus: "idle" | "verified" | "awaiting" | "failed";
}

/** Block equation worker state */
export interface BlockState {
  /** Tasks completed toward current block */
  blockTasksCompleted: number;
  /** Tasks required for current block (adaptive) */
  tasksPerBlock: number;
  /** Whether the block equation has been solved */
  equationSolved: boolean;
  /** Current hash rate from the equation worker (hashes/sec) */
  equationHashRate: number;
  /** Total blocks mined this session */
  blocksMined: number;
  /** Current block height from Voyager distance */
  currentBlockHeight: number;
  /** Current block reward in POH */
  currentBlockReward: number;
  /** Equation worker difficulty (leading hex zeros) */
  equationDifficulty: number;
}

// Persistence keys
const PERSIST_KEY = "poh-mining-state";
const BLOCK_PERSIST_KEY = "poh-block-state";

interface PersistedState {
  tasksCompleted: number;
  totalComputeMs: number;
  blocksMined: number;
}

function loadPersistedState(): Partial<ComputeState> & { blocksMined?: number } {
  try {
    const stored = localStorage.getItem(PERSIST_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PersistedState;
      return {
        tasksCompleted: parsed.tasksCompleted || 0,
        totalComputeMs: parsed.totalComputeMs || 0,
      };
    }
  } catch {}
  return {};
}

function loadBlockState(): { blocksMined: number } {
  try {
    const stored = localStorage.getItem(BLOCK_PERSIST_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { blocksMined: number };
      return { blocksMined: parsed.blocksMined || 0 };
    }
  } catch {}
  return { blocksMined: 0 };
}

function persistState(state: { tasksCompleted: number; totalComputeMs: number }) {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch {}
}

function persistBlockState(blocksMined: number) {
  try {
    localStorage.setItem(BLOCK_PERSIST_KEY, JSON.stringify({ blocksMined }));
  } catch {}
}

// Supabase Realtime client (anon key for subscriptions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getRealtimeClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function useCompute(deviceId: string | null) {
  const persisted = loadPersistedState();
  const blockPersisted = loadBlockState();
  const [state, setState] = useState<ComputeState>({
    status: "idle",
    currentTask: null,
    progress: 0,
    progressStep: "",
    tasksCompleted: persisted.tasksCompleted || 0,
    totalComputeMs: persisted.totalComputeMs || 0,
    error: null,
    submissionStatus: "idle",
  });

  const savedBlockTasks = (() => {
    try {
      const raw = localStorage.getItem("poh_block_tasks");
      return raw !== null ? parseInt(raw, 10) || 0 : 0;
    } catch {
      return 0;
    }
  })();

  const [blockState, setBlockState] = useState<BlockState>({
    blockTasksCompleted: savedBlockTasks,
    tasksPerBlock: TASKS_PER_BLOCK_MIN,
    equationSolved: false,
    equationHashRate: 0,
    blocksMined: blockPersisted.blocksMined,
    currentBlockHeight: getBlockHeight(),
    currentBlockReward: getBlockReward(),
    equationDifficulty: 6,
  });

  const [isMining, setIsMining] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const equationWorkerRef = useRef<Worker | null>(null);
  const isMiningRef = useRef(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const blockTasksRef = useRef(savedBlockTasks);
  const equationSolvedRef = useRef(false);
  // Fix 4: persist uptime start timestamp — restored from localStorage on mount
  const uptimeStartRef = useRef<number | null>((() => {
    try {
      const raw = localStorage.getItem("poh_uptime_start");
      // Only restore if mining was active when the page was last loaded
      const wasMining = localStorage.getItem("poh-was-mining") === "true";
      if (wasMining && raw !== null) {
        const parsed = parseInt(raw, 10);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    } catch {
      return null;
    }
  })());
  // Stable ref to checkBlockComplete so startEquationWorker's message handler
  // always calls the latest version without needing it in its deps array.
  const checkBlockCompleteRef = useRef<() => void>(() => {});

  // Persist stats whenever they change
  useEffect(() => {
    persistState({
      tasksCompleted: state.tasksCompleted,
      totalComputeMs: state.totalComputeMs,
    });
  }, [state.tasksCompleted, state.totalComputeMs]);

  // Persist block state
  useEffect(() => {
    persistBlockState(blockState.blocksMined);
  }, [blockState.blocksMined]);

  // Update block height and reward periodically
  useEffect(() => {
    const update = () => {
      setBlockState((s) => ({
        ...s,
        currentBlockHeight: getBlockHeight(),
        currentBlockReward: getBlockReward(),
      }));
    };
    update();
    const id = setInterval(update, 60_000); // every minute
    return () => clearInterval(id);
  }, []);

  // Start/stop equation worker when mining state changes
  const startEquationWorker = useCallback(() => {
    if (!deviceId || equationWorkerRef.current) return;

    try {
      equationWorkerRef.current = new Worker(
        new URL("../workers/block-equation.worker.ts", import.meta.url)
      );
    } catch (workerErr) {
      // Equation worker is non-critical — log and continue without it.
      // The science compute loop still works; blocks just won't be mined.
      console.warn("[Mining] Failed to create equation worker:", workerErr);
      return;
    }

    const worker = equationWorkerRef.current;

    worker.addEventListener("message", (event: MessageEvent) => {
      const msg = event.data;

      if (msg.type === "calibrated") {
        setBlockState((s) => ({ ...s, equationDifficulty: msg.difficulty }));
        // Start mining with calibrated difficulty
        worker.postMessage({
          type: "start",
          blockHeight: getBlockHeight(),
          deviceId,
          difficulty: msg.difficulty,
        });
      } else if (msg.type === "progress") {
        setBlockState((s) => ({ ...s, equationHashRate: msg.hashRate }));
      } else if (msg.type === "wasm_error") {
        // WASM init failed — worker continues with Web Crypto fallback, nothing to do here
        console.warn("[EquationWorker]", msg.message);
      } else if (msg.type === "solved") {
        equationSolvedRef.current = true;
        setBlockState((s) => ({
          ...s,
          equationSolved: true,
          equationHashRate: msg.hashRate,
        }));
        // Use the ref so we always call the latest checkBlockComplete without
        // needing it in the useCallback dependency array (it uses refs internally).
        checkBlockCompleteRef.current();
      }
    });

    // Calibrate first, then start
    worker.postMessage({ type: "calibrate", deviceId });
  }, [deviceId]);

  const stopEquationWorker = useCallback(() => {
    if (equationWorkerRef.current) {
      equationWorkerRef.current.postMessage({ type: "stop" });
      equationWorkerRef.current.terminate();
      equationWorkerRef.current = null;
    }
    equationSolvedRef.current = false;
    setBlockState((s) => ({
      ...s,
      equationSolved: false,
      equationHashRate: 0,
    }));
  }, []);

  // Check if a block is complete (both tasks and equation solved)
  const checkBlockComplete = useCallback(() => {
    const tasksNeeded = TASKS_PER_BLOCK_MIN; // Scales to TASKS_PER_BLOCK_MAX once 1000+ miners are active
    if (blockTasksRef.current >= tasksNeeded && equationSolvedRef.current) {
      // Block mined!
      setBlockState((s) => {
        // Restart equation worker for next block using the live difficulty from state
        if (equationWorkerRef.current && deviceId) {
          equationWorkerRef.current.postMessage({
            type: "start",
            blockHeight: getBlockHeight(),
            deviceId,
            difficulty: s.equationDifficulty,
          });
        }
        return {
          ...s,
          blocksMined: s.blocksMined + 1,
          blockTasksCompleted: 0,
          equationSolved: false,
        };
      });
      blockTasksRef.current = 0;
      try {
        localStorage.setItem("poh_block_tasks", "0");
      } catch {}
      equationSolvedRef.current = false;
    }
  }, [deviceId]);

  // Keep the ref in sync so startEquationWorker's message handler always has
  // the latest version without needing it listed as a dependency.
  checkBlockCompleteRef.current = checkBlockComplete;

  // Setup Supabase Realtime subscription for task assignments
  useEffect(() => {
    if (!deviceId) return;

    const supabase = getRealtimeClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`task-stream-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_assignments",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          // New task assigned — if idle, trigger mining loop
          if (!isMiningRef.current && payload.new) {
            setState((s) => ({
              ...s,
              progressStep: "New task assigned via realtime...",
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [deviceId]);

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
    async (
      taskId: string,
      result: unknown,
      computeTimeMs: number,
      proof: unknown
    ): Promise<"verified" | "awaiting" | "failed"> => {
      if (!deviceId) return "failed";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const body = JSON.stringify({ deviceId, taskId, result, computeTimeMs, proof });
        const res = await fetch("/api/mine/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json() as { verified: boolean; message: string };
        if (data.verified === true) {
          setState((s) => ({ ...s, submissionStatus: "verified" }));
          return "verified";
        } else if (res.ok) {
          setState((s) => ({ ...s, submissionStatus: "awaiting" }));
          return "awaiting";
        } else {
          setState((s) => ({ ...s, submissionStatus: "failed" }));
          return "failed";
        }
      } catch {
        clearTimeout(timeout);
        setState((s) => ({ ...s, submissionStatus: "failed" }));
        return "failed";
      }
    },
    [deviceId]
  );

  const runMiningLoop = useCallback(async () => {
    if (!deviceId || !isMiningRef.current) return;

    // Initialize worker — guard against CSP or memory failures so the loop
    // doesn't exit silently while isMining stays true.
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(
          new URL("../workers/compute.worker.ts", import.meta.url)
        );
      } catch (workerErr) {
        console.error("[Mining] Failed to create compute worker:", workerErr);
        isMiningRef.current = false;
        setIsMining(false);
        setState((s) => ({
          ...s,
          status: "error",
          error: "Web Workers are not available in this browser. Mining cannot start.",
          progressStep: "Error: Web Worker unavailable.",
        }));
        return;
      }
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
      const displayName = getTaskDisplayName(task.task_type, task.payload);
      setState((s) => ({
        ...s,
        status: "computing",
        currentTask: task,
        progress: 0,
        progressStep: `Computing: ${displayName}`,
      }));

      const computeResult = await new Promise<{
        result: unknown;
        computeTimeMs: number;
        proof: unknown;
      }>((resolve, reject) => {
        let resolved = false;
        const workerTimeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            worker.removeEventListener("message", handler);
            reject(new Error("Worker timeout"));
          }
        }, 5 * 60 * 1000);

        const handler = (event: MessageEvent) => {
          try {
            const msg = event.data as Record<string, unknown>;
            if (msg.taskId !== task.task_id) return;

            if (msg.type === "progress") {
              setState((s) => ({
                ...s,
                progress: typeof msg.percent === "number" ? msg.percent : s.progress,
                progressStep: typeof msg.step === "string" ? msg.step : s.progressStep,
              }));
            } else if (msg.type === "result") {
              if (!resolved) {
                resolved = true;
                clearTimeout(workerTimeout);
                worker.removeEventListener("message", handler);
                resolve({
                  result: msg.result,
                  computeTimeMs: msg.computeTimeMs as number,
                  proof: msg.proof,
                });
              }
            } else if (msg.type === "error") {
              if (!resolved) {
                resolved = true;
                clearTimeout(workerTimeout);
                worker.removeEventListener("message", handler);
                reject(new Error(typeof msg.error === "string" ? msg.error : "Worker error"));
              }
            }
          } catch (handlerErr) {
            if (!resolved) {
              resolved = true;
              clearTimeout(workerTimeout);
              worker.removeEventListener("message", handler);
              reject(handlerErr instanceof Error ? handlerErr : new Error(String(handlerErr)));
            }
          }
        };

        worker.addEventListener("message", handler);
        worker.postMessage({
          type: "run",
          taskId: task.task_id,
          taskType: task.task_type,
          payload: { ...task.payload, seed: task.seed },
        });
      }).catch(() => null);

      if (!computeResult || !isMiningRef.current) {
        if (!isMiningRef.current) break;
        workerRef.current?.terminate();
        workerRef.current = null;
        try {
          workerRef.current = new Worker(
            new URL("../workers/compute.worker.ts", import.meta.url)
          );
        } catch (workerErr) {
          console.error("[Mining] Failed to restart compute worker:", workerErr);
          isMiningRef.current = false;
          setIsMining(false);
          setState((s) => ({
            ...s,
            status: "error",
            error: "Web Workers are not available in this browser.",
            progressStep: "Error: Web Worker unavailable.",
          }));
          return;
        }
        setState((s) => ({ ...s, status: "idle", progressStep: "Task timed out. Retrying..." }));
        await new Promise((r) => setTimeout(r, 2_000));
        continue;
      }

      // 3. Submit with proof
      setState((s) => ({
        ...s,
        status: "submitting",
        progress: 100,
        progressStep: "Submitting results for verification...",
      }));

      const verificationStatus = await submitResult(
        task.task_id,
        computeResult.result,
        computeResult.computeTimeMs,
        computeResult.proof
      );

      if (verificationStatus === "verified") {
        setState((s) => ({
          ...s,
          tasksCompleted: s.tasksCompleted + 1,
          totalComputeMs: s.totalComputeMs + computeResult.computeTimeMs,
          progressStep: "Verified! Requesting next task...",
        }));

        // Track block progress — only count verified tasks
        blockTasksRef.current += 1;
        try {
          localStorage.setItem("poh_block_tasks", String(blockTasksRef.current));
        } catch {}
        setBlockState((s) => ({
          ...s,
          blockTasksCompleted: blockTasksRef.current,
        }));
        checkBlockCompleteRef.current();
      } else {
        setState((s) => ({
          ...s,
          progressStep:
            verificationStatus === "awaiting"
              ? "Submission received, awaiting verification..."
              : "Submission failed. Requesting next task...",
        }));
      }

      // Brief pause between tasks
      await new Promise((r) => setTimeout(r, 1_000));
    }
  }, [deviceId, fetchTask, submitResult]);

  // Auto-resume mining if was mining before (page refresh)
  // Runs when deviceId changes — handles the case where deviceId loads
  // from localStorage after the first render (common on mobile)
  useEffect(() => {
    if (!deviceId || isMiningRef.current) return;
    const wasMining = localStorage.getItem("poh-was-mining") === "true";
    if (!wasMining) return;

    // Fix 4: restore uptime start from localStorage (already set in uptimeStartRef at mount)
    // If no valid timestamp was restored, record now as the start time
    if (uptimeStartRef.current === null) {
      const now = Date.now();
      uptimeStartRef.current = now;
      try {
        localStorage.setItem("poh_uptime_start", String(now));
      } catch {}
    }

    isMiningRef.current = true;
    setIsMining(true);
    setState((s) => ({ ...s, status: "loading", error: null, progressStep: "Resuming mining after refresh..." }));
    runMiningLoop();
    // Fix 2: auto-resume was missing the equation worker call
    startEquationWorker();
  }, [deviceId, runMiningLoop, startEquationWorker]);

  const startMining = useCallback(() => {
    if (isMiningRef.current) return;
    isMiningRef.current = true;
    setIsMining(true);
    localStorage.setItem("poh-was-mining", "true");
    // Fix 4: record (or reset) uptime start timestamp on explicit start
    const now = Date.now();
    uptimeStartRef.current = now;
    try {
      localStorage.setItem("poh_uptime_start", String(now));
    } catch {}
    setState((s) => ({ ...s, status: "loading", error: null }));
    runMiningLoop();
    startEquationWorker();
  }, [runMiningLoop, startEquationWorker]);

  const stopMining = useCallback(() => {
    isMiningRef.current = false;
    setIsMining(false);
    localStorage.setItem("poh-was-mining", "false");
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    stopEquationWorker();
    setState((s) => ({ ...s, status: "idle", progressStep: "Mining stopped." }));
  }, [stopEquationWorker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMiningRef.current = false;
      workerRef.current?.terminate();
      equationWorkerRef.current?.terminate();
    };
  }, []);

  return {
    ...state,
    // Fix 5: explicitly surface submissionStatus (also included via ...state spread)
    submissionStatus: state.submissionStatus,
    blockState,
    taskDisplayName: state.currentTask
      ? getTaskDisplayName(state.currentTask.task_type, state.currentTask.payload)
      : null,
    isMining,
    // Fix 4: expose uptime start timestamp so consumers can compute session duration
    uptimeStart: uptimeStartRef.current,
    startMining,
    stopMining,
  };
}
