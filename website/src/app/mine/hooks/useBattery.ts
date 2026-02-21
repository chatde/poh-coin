"use client";

import { useState, useEffect, useCallback } from "react";
import { THROTTLE_TEMP_C, STOP_TEMP_C } from "@/lib/constants";

interface BatteryState {
  level: number | null;       // 0-100%
  charging: boolean | null;
  temperature: number | null; // Celsius (if available)
  shouldThrottle: boolean;
  shouldStop: boolean;
  supported: boolean;
}

interface BatteryManager {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export function useBattery() {
  const [state, setState] = useState<BatteryState>({
    level: null,
    charging: null,
    temperature: null,
    shouldThrottle: false,
    shouldStop: false,
    supported: false,
  });

  const updateBattery = useCallback((battery: BatteryManager) => {
    const level = Math.round(battery.level * 100);
    const charging = battery.charging;

    setState((s) => ({
      ...s,
      level,
      charging,
      supported: true,
      // Only compute when charging (per design decision)
      shouldStop: s.temperature !== null ? s.temperature >= STOP_TEMP_C : !charging,
      shouldThrottle: s.temperature !== null ? s.temperature >= THROTTLE_TEMP_C : false,
    }));
  }, []);

  useEffect(() => {
    let battery: BatteryManager | null = null;

    const init = async () => {
      if (!("getBattery" in navigator)) {
        setState((s) => ({ ...s, supported: false }));
        return;
      }

      try {
        battery = await (navigator as unknown as { getBattery(): Promise<BatteryManager> }).getBattery();
        updateBattery(battery);

        const handler = () => updateBattery(battery!);
        battery.addEventListener("levelchange", handler);
        battery.addEventListener("chargingchange", handler);

        return () => {
          battery?.removeEventListener("levelchange", handler);
          battery?.removeEventListener("chargingchange", handler);
        };
      } catch {
        setState((s) => ({ ...s, supported: false }));
      }
    };

    init();
  }, [updateBattery]);

  return state;
}
