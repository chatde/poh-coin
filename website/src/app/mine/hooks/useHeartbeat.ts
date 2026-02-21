"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createHash } from "crypto";

interface HeartbeatState {
  connected: boolean;
  lastHeartbeat: Date | null;
  computeStatus: string | null;
  missedBeats: number;
}

export function useHeartbeat(deviceId: string | null) {
  const [state, setState] = useState<HeartbeatState>({
    connected: false,
    lastHeartbeat: null,
    computeStatus: null,
    missedBeats: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(false);

  const sendHeartbeat = useCallback(async () => {
    if (!deviceId) return;

    try {
      // Step 1: Request challenge
      const challengeRes = await fetch("/api/mine/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      if (!challengeRes.ok) {
        setState((s) => ({ ...s, missedBeats: s.missedBeats + 1 }));
        return;
      }

      const { challenge } = await challengeRes.json();

      // Step 2: Compute response = SHA256(challenge + deviceId)
      // In browser, use SubtleCrypto
      const encoder = new TextEncoder();
      const data = encoder.encode(challenge + deviceId);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const response = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Get battery info if available
      let batteryPct: number | undefined;
      let temperatureC: number | undefined;

      if ("getBattery" in navigator) {
        try {
          const battery = await (navigator as unknown as { getBattery(): Promise<{ level: number }> }).getBattery();
          batteryPct = Math.round(battery.level * 100);
        } catch {
          // Battery API not available
        }
      }

      // Step 3: Send response
      const res = await fetch("/api/mine/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          challenge,
          response,
          batteryPct,
          temperatureC,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setState({
          connected: true,
          lastHeartbeat: new Date(),
          computeStatus: data.computeStatus,
          missedBeats: 0,
        });
      } else {
        setState((s) => ({ ...s, missedBeats: s.missedBeats + 1 }));
      }
    } catch {
      setState((s) => ({ ...s, missedBeats: s.missedBeats + 1, connected: false }));
    }
  }, [deviceId]);

  const start = useCallback(() => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;

    // Send immediately, then every 15 minutes
    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, 15 * 60 * 1000);
  }, [sendHeartbeat]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((s) => ({ ...s, connected: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { ...state, start, stop };
}
