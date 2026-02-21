"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

interface FitnessActivity {
  id: number;
  activity_type: string;
  duration_min: number;
  effort_score: number;
  verified: boolean;
  submitted_at: string;
  source_provider: string;
}

interface FitnessState {
  connected: boolean;
  provider: string | null;
  lastSync: string | null;
  todayEffort: number;
  weekEffort: number;
  monthEffort: number;
  recentActivities: FitnessActivity[];
  streak: number;
  syncing: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function useFitness(walletAddress: string | null, deviceId: string | null) {
  const [state, setState] = useState<FitnessState>({
    connected: false,
    provider: null,
    lastSync: null,
    todayEffort: 0,
    weekEffort: 0,
    monthEffort: 0,
    recentActivities: [],
    streak: 0,
    syncing: false,
  });

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Fetch fitness status
  const fetchStatus = useCallback(async () => {
    if (!walletAddress || !deviceId) return;

    try {
      // Check connection status
      const connRes = await fetch(`/api/mine/fitness/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, deviceId }),
      });

      // Fetch recent activities (client-side from Supabase)
      // For now, just track the connection status
      if (connRes.ok) {
        const data = await connRes.json();
        setState((s) => ({
          ...s,
          connected: true,
          todayEffort: data.todayEffortScore || s.todayEffort,
        }));
      }
    } catch {
      // Will retry
    }
  }, [walletAddress, deviceId]);

  // Subscribe to fitness_activities changes via Supabase Realtime
  useEffect(() => {
    if (!walletAddress || !supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`fitness-${walletAddress}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fitness_activities",
          filter: `wallet_address=eq.${walletAddress.toLowerCase()}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as FitnessActivity;
            setState((s) => ({
              ...s,
              recentActivities: s.recentActivities.map((a) =>
                a.id === updated.id ? { ...a, verified: updated.verified } : a
              ),
            }));
          } else if (payload.eventType === "INSERT" && payload.new) {
            const newActivity = payload.new as FitnessActivity;
            setState((s) => ({
              ...s,
              recentActivities: [newActivity, ...s.recentActivities].slice(0, 20),
              todayEffort: s.todayEffort + (newActivity.effort_score || 0),
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [walletAddress]);

  // Manual sync trigger
  const syncActivities = useCallback(async () => {
    if (!walletAddress || !deviceId) return;
    setState((s) => ({ ...s, syncing: true }));

    try {
      const res = await fetch("/api/mine/fitness/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, deviceId }),
      });

      if (res.ok) {
        const data = await res.json();
        setState((s) => ({
          ...s,
          todayEffort: data.todayEffortScore || s.todayEffort,
          lastSync: new Date().toISOString(),
        }));
      }
    } catch {
      // Will retry
    } finally {
      setState((s) => ({ ...s, syncing: false }));
    }
  }, [walletAddress, deviceId]);

  // Disconnect wearable
  const disconnect = useCallback(async () => {
    if (!walletAddress) return;

    try {
      await fetch("/api/mine/fitness/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      setState((s) => ({
        ...s,
        connected: false,
        provider: null,
        lastSync: null,
      }));
    } catch {
      // Will retry
    }
  }, [walletAddress]);

  return {
    ...state,
    syncActivities,
    disconnect,
    fetchStatus,
  };
}
