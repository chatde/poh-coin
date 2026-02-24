"use client";

import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";
import { CountUp } from "@/components/motion/CountUp";
import { TiltCard } from "@/components/motion/TiltCard";
import { ParallaxSection } from "@/components/motion/ParallaxSection";
import {
  StaggerParent,
  StaggerChild,
} from "@/components/motion/StaggerChildren";
import { BLOCK_EXPLORER, CONTRACTS } from "@/lib/contracts";
import {
  STARTING_ANNUAL_EMISSION,
  RTG_DECAY_RATE,
  LAUNCH_DATE,
  calculateWeeklyPool,
} from "@/lib/constants";

/* ── Emission math helpers ─────────────────────────────────────────── */

/** Total tokens ever distributed if the system runs forever */
const TOTAL_LIFETIME_EMISSION =
  STARTING_ANNUAL_EMISSION / -Math.log(RTG_DECAY_RATE); // ~10.45B

/** Total pool size */
const TOTAL_POOL = 12_263_000_000;

/** Safety buffer */
const SAFETY_BUFFER = TOTAL_POOL - TOTAL_LIFETIME_EMISSION;

/** Generate emission schedule data */
function getEmissionSchedule() {
  const years = [1, 2, 5, 10, 20, 30, 50, 100];
  let cumulative = 0;
  const data: {
    year: number;
    annual: number;
    cumulative: number;
    remaining: number;
  }[] = [];

  for (const y of years) {
    // Calculate annual emission for this specific year
    const annualEmission =
      STARTING_ANNUAL_EMISSION * Math.pow(RTG_DECAY_RATE, y - 1);

    // Calculate cumulative using integral: S(0,y) = E0 * (1 - r^y) / -ln(r)
    cumulative =
      (STARTING_ANNUAL_EMISSION * (1 - Math.pow(RTG_DECAY_RATE, y))) /
      -Math.log(RTG_DECAY_RATE);

    data.push({
      year: y,
      annual: annualEmission,
      cumulative,
      remaining: TOTAL_POOL - cumulative,
    });
  }

  return data;
}

/** Generate SVG path points for the emission curve */
function getEmissionCurvePoints(
  width: number,
  height: number,
  maxYear: number
) {
  const points: string[] = [];
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const year = (i / steps) * maxYear;
    const emission =
      STARTING_ANNUAL_EMISSION * Math.pow(RTG_DECAY_RATE, year);
    const x = (i / steps) * width;
    const y = height - (emission / STARTING_ANNUAL_EMISSION) * height;
    points.push(`${x},${y}`);
  }

  return points.join(" ");
}

/** Generate SVG path points for the cumulative curve */
function getCumulativeCurvePoints(
  width: number,
  height: number,
  maxYear: number
) {
  const points: string[] = [];
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const year = (i / steps) * maxYear;
    const cumulative =
      (STARTING_ANNUAL_EMISSION * (1 - Math.pow(RTG_DECAY_RATE, year))) /
      -Math.log(RTG_DECAY_RATE);
    const x = (i / steps) * width;
    const y = height - (cumulative / TOTAL_POOL) * height;
    points.push(`${x},${y}`);
  }

  return points.join(" ");
}

function formatNum(n: number, decimals = 0): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(decimals) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(decimals) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(decimals) + "K";
  return n.toFixed(decimals);
}

/* ── Icons ─────────────────────────────────────────────────────────── */

function IconInfinity({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
    </svg>
  );
}

function IconFlame({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconTrendingDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

function IconPickaxe({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.531 12.469 6.619 20.38a1 1 0 1 1-3-3l7.912-7.912" />
      <path d="M15.686 4.314A12.5 12.5 0 0 0 5.461 2.958 1 1 0 0 0 5.58 4.71a22 22 0 0 1 6.318 3.393" />
      <path d="M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4Z" />
      <path d="M19.686 8.314a12.5 12.5 0 0 1 1.356 10.225 1 1 0 0 1-1.751-.119 22 22 0 0 0-3.393-6.318" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/* ── Emission schedule data ─────────────────────────────────────────── */

const schedule = getEmissionSchedule();
const currentWeeklyPool = calculateWeeklyPool(new Date());

/* ── SVG chart dimensions ────────────────────────────────────────────── */

const CHART_W = 700;
const CHART_H = 300;
const CHART_MAX_YEAR = 100;
const emissionPoints = getEmissionCurvePoints(CHART_W, CHART_H, CHART_MAX_YEAR);
const cumulativePoints = getCumulativeCurvePoints(
  CHART_W,
  CHART_H,
  CHART_MAX_YEAR
);

/* ========== PAGE ========== */

export default function TokenomicsPage() {
  return (
    <div className="bg-background">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
        >
          <div className="h-[400px] w-[600px] rounded-full bg-voyager-gold/8 blur-[150px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-voyager-gold/30 bg-voyager-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-voyager-gold backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-charity-green animate-pulse" />
                Emission Model
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                The Pool{" "}
                <span className="gradient-text-animated">Never Empties</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/60">
                POH uses a 5% annual decay model &mdash; the same design pattern
                as Bitcoin&rsquo;s halvings. The rewards pool is mathematically
                guaranteed to last forever.
              </p>
            </div>
          </FadeIn>

          {/* Key stats */}
          <StaggerParent className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerChild>
              <TiltCard
                className="rounded-2xl"
                glowColor="rgba(245, 158, 11, 0.3)"
              >
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">
                    Rewards Pool
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-voyager-gold">
                    <CountUp end={12.263} duration={2} decimals={3} suffix="B" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">
                    50% of total supply
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard
                className="rounded-2xl"
                glowColor="rgba(16, 185, 129, 0.3)"
              >
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">
                    Lifetime Emissions
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-charity-green">
                    <CountUp
                      end={TOTAL_LIFETIME_EMISSION / 1e9}
                      duration={2.5}
                      decimals={2}
                      suffix="B"
                    />
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">
                    max ever distributed
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard
                className="rounded-2xl"
                glowColor="rgba(99, 102, 241, 0.3)"
              >
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">
                    Safety Buffer
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-accent-light">
                    <CountUp
                      end={SAFETY_BUFFER / 1e9}
                      duration={2}
                      decimals={2}
                      suffix="B"
                    />
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">
                    ~{((SAFETY_BUFFER / TOTAL_POOL) * 100).toFixed(0)}% buffer
                    forever
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard
                className="rounded-2xl"
                glowColor="rgba(245, 158, 11, 0.3)"
              >
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">
                    Current Weekly Pool
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                    <CountUp
                      end={currentWeeklyPool / 1e6}
                      duration={2}
                      decimals={1}
                      suffix="M"
                    />
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">
                    POH this week
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>
          </StaggerParent>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-voyager-gold/30 to-transparent" />

      {/* ═══════════════════ WHY THE POOL NEVER RUNS OUT ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-voyager-gold">
                The Math
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Why the pool{" "}
                <span className="gradient-text-animated">never runs out</span>
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mx-auto mt-12 max-w-3xl space-y-6 text-foreground/80">
              <div className="glass-card p-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-voyager-gold/10 text-voyager-gold">
                    <IconInfinity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Geometric Series Convergence
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed">
                      POH emits 536M tokens in year 1, then multiplies by 0.95
                      each year (5% decay). This creates a{" "}
                      <strong className="text-foreground">
                        converging geometric series
                      </strong>{" "}
                      &mdash; the total sum approaches a finite limit but never
                      reaches it.
                    </p>
                  </div>
                </div>

                <div className="ml-14 rounded-xl bg-surface/50 p-4 font-mono text-sm">
                  <p className="text-foreground/50">
                    Total if run forever:
                  </p>
                  <p className="mt-1 text-voyager-gold">
                    536M / -ln(0.95) = 536M / 0.05129 ={" "}
                    <strong>~{formatNum(TOTAL_LIFETIME_EMISSION, 2)} POH</strong>
                  </p>
                  <p className="mt-3 text-foreground/50">Pool size:</p>
                  <p className="mt-1 text-charity-green">
                    <strong>12.263B POH</strong> (1.81B more than will ever be
                    needed)
                  </p>
                </div>

                <p className="ml-14 text-sm leading-relaxed">
                  This is the{" "}
                  <strong className="text-foreground">
                    same design pattern as Bitcoin
                  </strong>
                  . Bitcoin&rsquo;s halvings create a geometric series converging
                  to 21M BTC. POH&rsquo;s 5% annual decay creates a series
                  converging to ~10.45B POH. Both pools are guaranteed to never
                  empty.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </ParallaxSection>

      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* ═══════════════════ EMISSION CURVE ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-light">
                Emission Curve
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Smooth decay,{" "}
                <span className="gradient-text-animated">forever rewards</span>
              </p>
              <p className="mt-4 text-foreground/60">
                Unlike Bitcoin&rsquo;s sharp halvings every 4 years, POH uses a
                continuous 5% annual decay &mdash; no sudden supply shocks,
                just a steady asymptotic approach to zero.
              </p>
            </div>
          </FadeIn>

          {/* SVG Chart */}
          <FadeIn delay={0.2}>
            <div className="mx-auto mt-12 max-w-4xl">
              <div className="glass-card overflow-hidden p-6 sm:p-8">
                <div className="overflow-x-auto">
                  <svg
                    viewBox={`-60 -30 ${CHART_W + 80} ${CHART_H + 60}`}
                    className="w-full min-w-[500px]"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                      <g key={`grid-${pct}`}>
                        <line
                          x1={0}
                          y1={CHART_H - pct * CHART_H}
                          x2={CHART_W}
                          y2={CHART_H - pct * CHART_H}
                          stroke="rgba(255,255,255,0.06)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={-8}
                          y={CHART_H - pct * CHART_H + 4}
                          textAnchor="end"
                          fill="rgba(255,255,255,0.35)"
                          fontSize="11"
                          fontFamily="monospace"
                        >
                          {formatNum(
                            pct * STARTING_ANNUAL_EMISSION
                          )}
                        </text>
                      </g>
                    ))}

                    {/* X-axis labels */}
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
                      (year) => (
                        <text
                          key={`x-${year}`}
                          x={(year / CHART_MAX_YEAR) * CHART_W}
                          y={CHART_H + 20}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.35)"
                          fontSize="11"
                          fontFamily="monospace"
                        >
                          {year}y
                        </text>
                      )
                    )}

                    {/* Pool capacity line */}
                    <line
                      x1={0}
                      y1={
                        CHART_H -
                        (TOTAL_POOL / TOTAL_POOL) *
                          CHART_H *
                          (STARTING_ANNUAL_EMISSION / TOTAL_POOL) *
                          0 // just for reference
                      }
                      x2={CHART_W}
                      y2={CHART_H}
                      stroke="transparent"
                    />

                    {/* Cumulative emissions (filled area) */}
                    <polygon
                      points={`0,${CHART_H} ${cumulativePoints} ${CHART_W},${CHART_H}`}
                      fill="url(#cumulativeGrad)"
                      opacity="0.15"
                    />

                    {/* Cumulative emissions curve */}
                    <polyline
                      points={cumulativePoints}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Pool limit line */}
                    <line
                      x1={0}
                      y1={CHART_H - (1) * CHART_H}
                      x2={CHART_W}
                      y2={CHART_H - (1) * CHART_H}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="8 4"
                      opacity="0.6"
                    />
                    <text
                      x={CHART_W + 4}
                      y={4}
                      fill="#f59e0b"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      Pool: 12.26B
                    </text>

                    {/* Lifetime limit line */}
                    <line
                      x1={0}
                      y1={
                        CHART_H -
                        (TOTAL_LIFETIME_EMISSION / TOTAL_POOL) * CHART_H
                      }
                      x2={CHART_W}
                      y2={
                        CHART_H -
                        (TOTAL_LIFETIME_EMISSION / TOTAL_POOL) * CHART_H
                      }
                      stroke="#818cf8"
                      strokeWidth="1.5"
                      strokeDasharray="8 4"
                      opacity="0.6"
                    />
                    <text
                      x={CHART_W + 4}
                      y={
                        CHART_H -
                        (TOTAL_LIFETIME_EMISSION / TOTAL_POOL) * CHART_H +
                        4
                      }
                      fill="#818cf8"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      Max: ~{formatNum(TOTAL_LIFETIME_EMISSION, 2)}
                    </text>

                    {/* Annual emission curve (filled area) */}
                    <polygon
                      points={`0,${CHART_H} ${emissionPoints} ${CHART_W},${CHART_H}`}
                      fill="url(#emissionGrad)"
                      opacity="0.2"
                    />

                    {/* Annual emission curve */}
                    <polyline
                      points={emissionPoints}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Gradient defs */}
                    <defs>
                      <linearGradient
                        id="emissionGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop
                          offset="100%"
                          stopColor="#f59e0b"
                          stopOpacity="0"
                        />
                      </linearGradient>
                      <linearGradient
                        id="cumulativeGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#10b981" />
                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    {/* Axis labels */}
                    <text
                      x={CHART_W / 2}
                      y={CHART_H + 40}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.4)"
                      fontSize="12"
                    >
                      Years Since Launch
                    </text>
                    <text
                      x={-CHART_H / 2}
                      y={-45}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.4)"
                      fontSize="12"
                      transform="rotate(-90)"
                    >
                      Annual Emission (POH)
                    </text>
                  </svg>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-foreground/70">
                    <span className="inline-block h-3 w-6 rounded-sm bg-voyager-gold" />
                    Annual Emission
                  </span>
                  <span className="inline-flex items-center gap-2 text-foreground/70">
                    <span className="inline-block h-3 w-6 rounded-sm bg-charity-green" />
                    Cumulative Distributed
                  </span>
                  <span className="inline-flex items-center gap-2 text-foreground/70">
                    <span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-voyager-gold" />
                    Pool Capacity (12.26B)
                  </span>
                  <span className="inline-flex items-center gap-2 text-foreground/70">
                    <span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-accent-light" />
                    Lifetime Max (~10.45B)
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </ParallaxSection>

      <div className="h-px bg-gradient-to-r from-transparent via-charity-green/30 to-transparent" />

      {/* ═══════════════════ EMISSION SCHEDULE TABLE ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-charity-green">
                Emission Schedule
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Year-by-year{" "}
                <span className="gradient-text-animated">breakdown</span>
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mx-auto mt-12 max-w-4xl">
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-surface-light">
                        <th className="px-6 py-4 font-semibold text-accent-light">
                          Year
                        </th>
                        <th className="px-6 py-4 font-semibold text-accent-light">
                          Annual Emission
                        </th>
                        <th className="px-6 py-4 font-semibold text-accent-light">
                          Cumulative Distributed
                        </th>
                        <th className="px-6 py-4 font-semibold text-accent-light">
                          Pool Remaining
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-light text-foreground/80">
                      {schedule.map((row) => (
                        <tr key={row.year} className="hover:bg-surface/30 transition-colors">
                          <td className="px-6 py-3 font-medium text-foreground">
                            {row.year}
                          </td>
                          <td className="px-6 py-3 font-mono text-voyager-gold">
                            {formatNum(row.annual, 0)}
                          </td>
                          <td className="px-6 py-3 font-mono">
                            {formatNum(row.cumulative, 2)}
                          </td>
                          <td className="px-6 py-3 font-mono text-charity-green">
                            {formatNum(row.remaining, 2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-surface/20 border-t-2 border-accent/20">
                        <td className="px-6 py-3 font-bold text-foreground">
                          Forever
                        </td>
                        <td className="px-6 py-3 font-mono text-voyager-gold">
                          &rarr; 0
                        </td>
                        <td className="px-6 py-3 font-mono">
                          ~{formatNum(TOTAL_LIFETIME_EMISSION, 2)}
                        </td>
                        <td className="px-6 py-3 font-mono font-bold text-charity-green">
                          ~{formatNum(SAFETY_BUFFER, 2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </ParallaxSection>

      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* ═══════════════════ HOW THE BURN FITS IN ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-voyager-gold">
                Dual Mechanism
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Mining + burn ={" "}
                <span className="gradient-text-animated">sustainability</span>
              </p>
            </div>
          </FadeIn>

          <StaggerParent className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
            <StaggerChild>
              <TiltCard
                className="h-full rounded-2xl"
                glowColor="rgba(245, 158, 11, 0.3)"
              >
                <div className="glass-card flex h-full flex-col p-8">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-voyager-gold/10 text-voyager-gold">
                    <IconPickaxe className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-voyager-gold">
                    Mining (Inflationary Track)
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    The POHRewards pool slowly distributes tokens to miners.
                    Starting at 536M/year, decaying 5% annually. The pool has
                    12.263B tokens but will only ever distribute ~10.45B &mdash;
                    leaving a permanent 1.81B buffer.
                  </p>
                  <div className="mt-auto pt-6">
                    <div className="flex items-center gap-2 text-xs text-foreground/40">
                      <span className="font-mono">Pool</span>
                      <span className="text-voyager-gold">&rarr;</span>
                      <span className="font-mono">Miners</span>
                      <span className="text-voyager-gold">&rarr;</span>
                      <span className="font-mono">Circulation</span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerChild>

            <StaggerChild>
              <TiltCard
                className="h-full rounded-2xl"
                glowColor="rgba(239, 68, 68, 0.3)"
              >
                <div className="glass-card flex h-full flex-col p-8">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                    <IconFlame className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-red-400">
                    Sell Burn (Deflationary Track)
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    1% of every sell is permanently burned (sent to address(0)).
                    This does NOT drain the rewards pool &mdash; it comes from
                    the seller&rsquo;s tokens. Over time, this shrinks total
                    supply, making remaining POH scarcer and potentially more
                    valuable.
                  </p>
                  <div className="mt-auto pt-6">
                    <div className="flex items-center gap-2 text-xs text-foreground/40">
                      <span className="font-mono">Sell</span>
                      <span className="text-red-400">&rarr;</span>
                      <span className="font-mono">1% burned</span>
                      <span className="text-red-400">&rarr;</span>
                      <span className="font-mono">address(0)</span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerChild>
          </StaggerParent>

          <FadeIn delay={0.2}>
            <div className="mx-auto mt-10 max-w-3xl">
              <div className="glass-card p-6 text-center">
                <p className="text-sm leading-relaxed text-foreground/70">
                  <strong className="text-foreground">Net effect:</strong>{" "}
                  Mining slowly releases tokens (inflationary) while the sell
                  burn permanently removes them (deflationary). As weekly
                  rewards shrink over time, each POH becomes scarcer &mdash;
                  keeping mining incentives alive even with smaller numerical
                  rewards.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </ParallaxSection>

      <div className="h-px bg-gradient-to-r from-transparent via-charity-green/30 to-transparent" />

      {/* ═══════════════════ COMPARISON TABLE ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-light">
                How We Compare
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                POH vs{" "}
                <span className="gradient-text-animated">the rest</span>
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mx-auto mt-12 max-w-4xl">
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-surface-light">
                        <th className="px-6 py-4 font-semibold text-accent-light">
                          Aspect
                        </th>
                        <th className="px-6 py-4 font-semibold text-voyager-gold">
                          Bitcoin
                        </th>
                        <th className="px-6 py-4 font-semibold text-charity-green">
                          POH
                        </th>
                        <th className="px-6 py-4 font-semibold text-foreground/50">
                          Typical Meme Token
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-light text-foreground/80">
                      <tr className="hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-foreground">
                          Mining Pool
                        </td>
                        <td className="px-6 py-3">Block rewards</td>
                        <td className="px-6 py-3 text-charity-green">
                          12.263B (50%)
                        </td>
                        <td className="px-6 py-3 text-foreground/40">None</td>
                      </tr>
                      <tr className="hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-foreground">
                          Emission Decay
                        </td>
                        <td className="px-6 py-3">50% halving / 4 years</td>
                        <td className="px-6 py-3 text-charity-green">
                          5% continuous annual
                        </td>
                        <td className="px-6 py-3 text-foreground/40">N/A</td>
                      </tr>
                      <tr className="hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-foreground">
                          Total Ever Mined
                        </td>
                        <td className="px-6 py-3">21M (exact)</td>
                        <td className="px-6 py-3 text-charity-green">
                          ~10.45B (asymptotic)
                        </td>
                        <td className="px-6 py-3 text-foreground/40">N/A</td>
                      </tr>
                      <tr className="hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-foreground">
                          Pool Lifetime
                        </td>
                        <td className="px-6 py-3">~130 years</td>
                        <td className="px-6 py-3 text-charity-green font-semibold">
                          Infinite (asymptotic)
                        </td>
                        <td className="px-6 py-3 text-foreground/40">N/A</td>
                      </tr>
                      <tr className="hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-foreground">
                          Burn Mechanism
                        </td>
                        <td className="px-6 py-3 text-foreground/40">None</td>
                        <td className="px-6 py-3 text-charity-green">
                          1% on sells
                        </td>
                        <td className="px-6 py-3 text-foreground/40">
                          Varies
                        </td>
                      </tr>
                      <tr className="hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-foreground">
                          Post-Mining Incentive
                        </td>
                        <td className="px-6 py-3">Transaction fees</td>
                        <td className="px-6 py-3 text-charity-green">
                          Rewards never reach zero
                        </td>
                        <td className="px-6 py-3 text-foreground/40">N/A</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </ParallaxSection>

      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* ═══════════════════ SAFETY BUFFER ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <div className="text-center">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-charity-green">
                  Built-In Safety
                </h2>
                <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  The ~{formatNum(SAFETY_BUFFER, 1)}{" "}
                  <span className="gradient-text-animated">buffer</span>
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="mt-12 space-y-4">
                {/* Visual: Pool bar showing buffer */}
                <div className="glass-card p-6">
                  <p className="mb-4 text-sm font-medium text-foreground/60">
                    Rewards Pool Capacity
                  </p>
                  <div className="flex h-10 overflow-hidden rounded-full shadow-inner shadow-black/30">
                    <div
                      className="bg-gradient-to-r from-charity-green to-emerald-600 flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        width: `${(TOTAL_LIFETIME_EMISSION / TOTAL_POOL) * 100}%`,
                      }}
                    >
                      ~10.45B distributed
                    </div>
                    <div
                      className="bg-gradient-to-r from-accent to-accent-light flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        width: `${(SAFETY_BUFFER / TOTAL_POOL) * 100}%`,
                      }}
                    >
                      ~1.81B buffer
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-foreground/40">
                    <span>0</span>
                    <span>12.263B total pool</span>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <p className="text-sm leading-relaxed text-foreground/80">
                    The pool has <strong className="text-foreground">~1.81B more POH</strong> than
                    will ever be distributed via the emission schedule. This buffer can be
                    used for:
                  </p>
                  <ul className="space-y-2 text-sm text-foreground/70">
                    <li className="flex items-start gap-3">
                      <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-charity-green" />
                      <span>
                        <strong className="text-foreground">Safety margin</strong> &mdash; permanent
                        insurance against edge cases
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <IconPickaxe className="mt-0.5 h-4 w-4 shrink-0 text-voyager-gold" />
                      <span>
                        <strong className="text-foreground">Bonus events</strong> &mdash; seasonal
                        mining events, hackathons, partnerships
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <IconTrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
                      <span>
                        <strong className="text-foreground">Emission adjustment</strong> &mdash; if
                        decay rate is ever adjusted, the buffer absorbs it
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <IconInfinity className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" />
                      <span>
                        <strong className="text-foreground">DAO decision</strong> &mdash; let the
                        community decide via POHGovernor
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </ParallaxSection>

      <div className="h-px bg-gradient-to-r from-transparent via-voyager-gold/30 to-transparent" />

      {/* ═══════════════════ CONTRACTS ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-light">
                Verify On-Chain
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Transparent &{" "}
                <span className="gradient-text-animated">verifiable</span>
              </p>
              <p className="mt-4 text-foreground/60">
                All contracts are open source and verified on Basescan. Don&rsquo;t
                trust &mdash; verify.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mx-auto mt-10 max-w-2xl">
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-surface-light">
                        <th className="px-6 py-3 font-semibold text-accent-light">
                          Contract
                        </th>
                        <th className="px-6 py-3 font-semibold text-accent-light">
                          Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-light text-foreground/80">
                      {[
                        { name: "POHToken", addr: CONTRACTS.token },
                        { name: "POHRewards", addr: CONTRACTS.rewards },
                        { name: "POHCharity", addr: CONTRACTS.charity },
                        { name: "POHVesting", addr: CONTRACTS.vesting },
                        { name: "POHNodeRegistry", addr: CONTRACTS.registry },
                      ].map((c) => (
                        <tr
                          key={c.name}
                          className="hover:bg-surface/30 transition-colors"
                        >
                          <td className="px-6 py-3 font-medium text-foreground">
                            {c.name}
                          </td>
                          <td className="px-6 py-3">
                            <a
                              href={`${BLOCK_EXPLORER}/address/${c.addr}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-accent-light underline underline-offset-2 hover:text-accent break-all"
                            >
                              {c.addr}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </ParallaxSection>

      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* ═══════════════════ BOTTOM CTA ═══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
        >
          <div className="h-[400px] w-[600px] rounded-full bg-accent/10 blur-[120px] animate-[pulse-slow_4s_ease-in-out_infinite]" />
        </div>

        <FadeIn>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Sustainable by{" "}
              <span className="gradient-text-animated">design</span>
            </h2>
            <p className="mt-6 text-lg text-foreground/60">
              The emission math is sound. The pool lasts forever. Start mining
              and be part of a system built to endure.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/mine"
                className="inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-105"
              >
                Start Mining
              </Link>
              <Link
                href="/whitepaper"
                className="inline-flex h-14 items-center gap-1 justify-center rounded-xl border border-foreground/20 bg-white/5 px-8 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-accent-light hover:text-accent-light hover:bg-white/10"
              >
                Read Whitepaper
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
