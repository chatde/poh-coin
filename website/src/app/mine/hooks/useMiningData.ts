"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
});

/** SWR options: refresh every 30s, retry on error with backoff */
const POLL_OPTIONS = {
  refreshInterval: 30_000,
  errorRetryCount: 5,
  dedupingInterval: 10_000,
} as const;

// ── Points / Epoch / Streak / Devices ──────────────────────────────────

export interface PointsData {
  status?: "ok" | "no_active_epoch" | "no_nodes";
  points: number;
  epoch: number | null;
  streak: number;
  longestStreak: number;
  devices: number;
  tasksCompleted: number;
  verifiedTasks: number;
  message?: string;
}

export function usePoints(walletAddress: string | null) {
  const { data, error, isLoading } = useSWR<PointsData>(
    walletAddress ? `/api/mine/points?address=${walletAddress}` : null,
    fetcher,
    POLL_OPTIONS,
  );

  return {
    points: data?.points ?? 0,
    streak: data?.streak ?? 0,
    epoch: data?.epoch ?? 0,
    devices: data?.devices ?? 0,
    status: data?.status ?? null,
    message: data?.message ?? null,
    isLoading,
    error,
  };
}

// ── Lifetime Stats ─────────────────────────────────────────────────────

export interface LifetimeStatsData {
  verifiedTasks: number;
  totalPoints: number;
  consensusRate: number;
}

export function useLifetimeStats(deviceId: string | null, walletAddress: string | null) {
  const { data, error, isLoading } = useSWR<LifetimeStatsData>(
    deviceId && walletAddress
      ? `/api/mine/stats?deviceId=${deviceId}&wallet=${walletAddress}`
      : null,
    fetcher,
    POLL_OPTIONS,
  );

  return {
    lifetimeStats: {
      verifiedTasks: data?.verifiedTasks ?? 0,
      totalPoints: data?.totalPoints ?? 0,
      consensusRate: data?.consensusRate ?? 0,
    },
    isLoading,
    error,
  };
}
