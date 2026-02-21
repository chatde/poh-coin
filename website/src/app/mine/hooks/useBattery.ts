"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { THROTTLE_TEMP_C, STOP_TEMP_C } from "@/lib/constants";

interface BatteryState {
  level: number | null;       // 0-100%
  charging: boolean | null;
  temperature: number | null; // Celsius (if available)
  shouldThrottle: boolean;
  shouldStop: boolean;
  supported: boolean;
  memoryUsageMb: number | null; // Performance API memory tracking
  workerActive: boolean;
}

interface BatteryManager {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function useBattery() {
  const [state, setState] = useState<BatteryState>({
    level: null,
    charging: null,
    temperature: null,
    shouldThrottle: false,
    shouldStop: false,
    supported: false,
    memoryUsageMb: null,
    workerActive: false,
  });

  const batteryRef = useRef<BatteryManager | null>(null);
  const handlerRef = useRef<(() => void) | null>(null);

  const updateBattery = useCallback((battery: BatteryManager) => {
    const level = Math.round(battery.level * 100);
    const charging = battery.charging;

    setState((s) => ({
      ...s,
      level,
      charging,
      supported: true,
      shouldStop: s.temperature !== null ? s.temperature >= STOP_TEMP_C : !charging,
      shouldThrottle: s.temperature !== null ? s.temperature >= THROTTLE_TEMP_C : false,
    }));
  }, []);

  // Track memory usage via Performance API
  useEffect(() => {
    const updateMemory = () => {
      const perf = performance as unknown as { memory?: PerformanceMemory };
      if (perf.memory) {
        const usedMb = Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
        setState((s) => ({ ...s, memoryUsageMb: usedMb }));
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 30_000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!("getBattery" in navigator)) {
        setState((s) => ({ ...s, supported: false }));
        return;
      }

      try {
        const battery = await (navigator as unknown as { getBattery(): Promise<BatteryManager> }).getBattery();
        if (cancelled) return;

        batteryRef.current = battery;
        updateBattery(battery);

        const handler = () => updateBattery(battery);
        handlerRef.current = handler;
        battery.addEventListener("levelchange", handler);
        battery.addEventListener("chargingchange", handler);
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, supported: false }));
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (batteryRef.current && handlerRef.current) {
        batteryRef.current.removeEventListener("levelchange", handlerRef.current);
        batteryRef.current.removeEventListener("chargingchange", handlerRef.current);
      }
    };
  }, [updateBattery]);

  /** Update worker active status (called by useCompute) */
  const setWorkerActive = useCallback((active: boolean) => {
    setState((s) => ({ ...s, workerActive: active }));
  }, []);

  return { ...state, setWorkerActive };
}
