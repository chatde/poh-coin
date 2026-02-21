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
    <div className="relative w-full overflow-hidden rounded-2xl border border-surface-light bg-surface p-8 sm:p-12">
      {/* Pulsing gold glow behind the number */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-40 w-[80%] max-w-md animate-[pulse-slow_3s_ease-in-out_infinite] rounded-full bg-voyager-gold/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Label */}
        <p className="text-sm font-medium uppercase tracking-widest text-foreground/50">
          Voyager 1 Distance from the Sun
        </p>

        {/* Animated distance counter */}
        <p
          className="font-mono text-4xl font-bold leading-tight text-voyager-gold sm:text-5xl md:text-6xl"
          aria-live="polite"
        >
          {formatWithCommas(distance)}
        </p>

        {/* Unit */}
        <p className="text-lg font-medium text-foreground/60">km</p>

        {/* Divider */}
        <div className="h-px w-24 bg-surface-light" />

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
