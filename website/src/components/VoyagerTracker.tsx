"use client";

import { useState, useEffect } from "react";

/** Voyager 1 approximate distance from the Sun on Jan 1 2025 00:00:00 UTC (km). */
const REFERENCE_DISTANCE_KM = 24_526_000_000;

/** Reference timestamp: Jan 1 2025 00:00:00 UTC. */
const REFERENCE_EPOCH_MS = Date.UTC(2025, 0, 1);

/** Voyager 1 heliocentric speed in km/s. */
const VOYAGER_SPEED_KM_S = 17.0;

/** POH max supply — snapshot of Voyager 1 distance at project launch. */
const MAX_SUPPLY = 24_526_000_000;

function formatWithCommas(n: number): string {
  return Math.floor(n).toLocaleString("en-US");
}

function estimateDistance(): number {
  const elapsedSeconds = (Date.now() - REFERENCE_EPOCH_MS) / 1_000;
  return REFERENCE_DISTANCE_KM + elapsedSeconds * VOYAGER_SPEED_KM_S;
}

export function VoyagerTracker() {
  const [distance, setDistance] = useState<number>(estimateDistance);

  useEffect(() => {
    const id = setInterval(() => {
      setDistance(estimateDistance());
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
        {/* Outer ring */}
        <div
          className="absolute h-[320px] w-[320px] rounded-full border border-voyager-gold/10 sm:h-[400px] sm:w-[400px]"
          style={{ animation: "orbit-spin 60s linear infinite" }}
        >
          {/* Voyager marker dot */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-voyager-gold shadow-lg shadow-voyager-gold/50" />
        </div>
        {/* Inner ring */}
        <div
          className="absolute h-[220px] w-[220px] rounded-full border border-accent/10 sm:h-[280px] sm:w-[280px]"
          style={{ animation: "orbit-spin 40s linear infinite reverse" }}
        />
      </div>

      {/* Gold pulsing glow behind distance */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-48 w-[80%] max-w-md animate-[pulse-slow_3s_ease-in-out_infinite] rounded-full bg-voyager-gold/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Label with flanking lines */}
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
          {formatWithCommas(distance)}
        </p>

        {/* Unit */}
        <p className="text-lg font-medium text-foreground/60">km</p>

        {/* Gradient divider */}
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-voyager-gold/40 to-transparent" />

        {/* Max supply callout */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-mono text-sm text-foreground/70">
            POH Max Supply:{" "}
            <span className="text-voyager-gold">
              {formatWithCommas(MAX_SUPPLY)}
            </span>
          </p>
          <p className="text-xs text-foreground/40">Snapshot at launch</p>
        </div>
      </div>
    </div>
  );
}
