"use client";

import { useState, useEffect } from "react";
import {
  getVoyagerDistanceKm,
  getMinableDistanceKm,
  getBlockHeight,
  getBlocksPerDay,
  getNextBlockEta,
  getLightHoursDelay,
  formatDistanceKm,
  formatBlockHeight,
  VOYAGER_LAUNCH_KM,
} from "@/lib/voyager";
import { getBlockReward, formatPOHAmount } from "@/lib/block-rewards";

interface TrackerState {
  distance: number;
  minableKm: number;
  blockHeight: number;
  blocksPerDay: number;
  nextBlockEtaMs: number;
  lightHours: number;
  blockReward: number;
}

function computeState(): TrackerState {
  const now = new Date();
  return {
    distance: getVoyagerDistanceKm(now),
    minableKm: getMinableDistanceKm(now),
    blockHeight: getBlockHeight(now),
    blocksPerDay: getBlocksPerDay(),
    nextBlockEtaMs: getNextBlockEta(now),
    lightHours: getLightHoursDelay(now),
    blockReward: getBlockReward(now),
  };
}

export function VoyagerTracker() {
  const [state, setState] = useState<TrackerState>(computeState);

  useEffect(() => {
    const id = setInterval(() => {
      setState(computeState());
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-card relative w-full overflow-hidden p-8 sm:p-12">
      {/* Orbit rings */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="absolute h-[320px] w-[320px] rounded-full border border-voyager-gold/10 sm:h-[400px] sm:w-[400px]"
          style={{ animation: "orbit-spin 60s linear infinite" }}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-voyager-gold shadow-lg shadow-voyager-gold/50" />
        </div>
        <div
          className="absolute h-[220px] w-[220px] rounded-full border border-accent/10 sm:h-[280px] sm:w-[280px]"
          style={{ animation: "orbit-spin 40s linear infinite reverse" }}
        />
      </div>

      {/* Gold pulsing glow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-48 w-[80%] max-w-md animate-[pulse-slow_3s_ease-in-out_infinite] rounded-full bg-voyager-gold/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Label */}
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-voyager-gold/30" />
          <p className="text-sm font-medium uppercase tracking-widest text-foreground/50">
            Voyager 1 Distance from the Sun
          </p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-voyager-gold/30" />
        </div>

        {/* Animated distance counter */}
        <p
          className="font-mono text-5xl font-bold leading-tight text-voyager-gold drop-shadow-[0_0_20px_rgba(245,158,11,0.3)] sm:text-6xl md:text-7xl"
          aria-live="polite"
        >
          {formatDistanceKm(state.distance)}
        </p>
        <p className="text-lg font-medium text-foreground/60">km</p>

        {/* Gradient divider */}
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-voyager-gold/40 to-transparent" />

        {/* Block stats grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          <div className="flex flex-col items-center">
            <p className="font-mono text-xl font-bold text-accent-light">
              {formatBlockHeight(state.blockHeight)}
            </p>
            <p className="text-xs text-foreground/50">Block Height</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-mono text-xl font-bold text-charity-green">
              {formatPOHAmount(state.blockReward, 0)}
            </p>
            <p className="text-xs text-foreground/50">POH / Block</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-mono text-xl font-bold text-foreground">
              ~{state.blocksPerDay.toLocaleString("en-US")}
            </p>
            <p className="text-xs text-foreground/50">Blocks / Day</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-mono text-xl font-bold text-foreground/70">
              {state.lightHours.toFixed(1)}h
            </p>
            <p className="text-xs text-foreground/50">Light Delay</p>
          </div>
        </div>

        {/* Max supply callout */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-mono text-sm text-foreground/70">
            POH Launch Supply:{" "}
            <span className="text-voyager-gold">
              {formatDistanceKm(VOYAGER_LAUNCH_KM)}
            </span>
          </p>
          <p className="text-xs text-foreground/50">
            +{formatDistanceKm(state.minableKm)} km minable beyond launch
          </p>
        </div>
      </div>
    </div>
  );
}
