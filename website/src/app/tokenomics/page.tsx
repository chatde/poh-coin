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
  BLOCKS_PER_DAY,
  BLOCKS_PER_WEEK,
  BLOCK_SIZE_KM,
  TASKS_PER_BLOCK_MIN,
  TASKS_PER_BLOCK_MAX,
  BLOCK_REWARD_SPLIT,
  calculateWeeklyPool,
} from "@/lib/constants";
import {
  REWARDS_POOL,
  MAX_DISTRIBUTABLE,
  PERMANENTLY_LOCKED,
  getEmissionSchedule,
  getDecommissionState,
  formatPOHAmount,
} from "@/lib/block-rewards";
import {
  getVoyagerDistanceKm,
  getBlockHeight,
  formatDistanceKm,
  formatBlockHeight,
  VOYAGER_LAUNCH_KM,
} from "@/lib/voyager";

/* ── Emission math helpers ─────────────────────────────────────────── */

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
      (1 - RTG_DECAY_RATE);
    const x = (i / steps) * width;
    const y = height - (cumulative / REWARDS_POOL) * height;
    points.push(`${x},${y}`);
  }

  return points.join(" ");
}

/* ── Icons ─────────────────────────────────────────────────────────── */

function IconInfinity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
    </svg>
  );
}

function IconRocket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/* ── Data ─────────────────────────────────────────────────────────── */

const schedule = getEmissionSchedule();
const currentWeeklyPool = calculateWeeklyPool(new Date());
const decommission10 = getDecommissionState(10);
const decommission15 = getDecommissionState(15);

/* ── SVG chart dimensions ────────────────────────────────────────── */

const CHART_W = 700;
const CHART_H = 300;
const CHART_MAX_YEAR = 50;
const emissionPoints = getEmissionCurvePoints(CHART_W, CHART_H, CHART_MAX_YEAR);
const cumulativePoints = getCumulativeCurvePoints(CHART_W, CHART_H, CHART_MAX_YEAR);

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
                Voyager Block Model
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Voyager Flies.{" "}
                <span className="gradient-text-animated">Blocks Grow.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/60">
                POH&rsquo;s supply expands with Voyager&nbsp;1&rsquo;s distance.
                Every 1,000&nbsp;km = 1 new block. When Voyager goes silent,
                blocks stop forever. The remaining POH becomes the{" "}
                <strong className="text-voyager-gold">Voyager Chase Fund</strong>.
              </p>
            </div>
          </FadeIn>

          {/* Key stats */}
          <StaggerParent className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerChild>
              <TiltCard className="rounded-2xl" glowColor="rgba(245, 158, 11, 0.3)">
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">Block Reward Pool</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-voyager-gold">
                    <CountUp end={12.263} duration={2} decimals={3} suffix="B" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/50">50% of supply for block mining</p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard className="rounded-2xl" glowColor="rgba(16, 185, 129, 0.3)">
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">Max Ever Mined</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-charity-green">
                    <CountUp end={MAX_DISTRIBUTABLE / 1e9} duration={2.5} decimals={2} suffix="B" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/50">RTG decay convergence limit</p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard className="rounded-2xl" glowColor="rgba(99, 102, 241, 0.3)">
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">Permanently Locked</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-accent-light">
                    <CountUp end={PERMANENTLY_LOCKED / 1e9} duration={2} decimals={2} suffix="B" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/50">Chase Fund seed forever</p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard className="rounded-2xl" glowColor="rgba(245, 158, 11, 0.3)">
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">Blocks / Day</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                    <CountUp end={BLOCKS_PER_DAY} duration={2} suffix="" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/50">~{BLOCK_SIZE_KM.toLocaleString()} km each</p>
                </div>
              </TiltCard>
            </StaggerChild>
          </StaggerParent>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-voyager-gold/30 to-transparent" />

      {/* ═══════════════════ HOW BLOCKS WORK ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-voyager-gold">
                Block Mining
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Dual-work{" "}
                <span className="gradient-text-animated">proof of contribution</span>
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mx-auto mt-12 max-w-3xl space-y-6">
              {/* Block mining flow */}
              <div className="glass-card p-8 space-y-4">
                <h3 className="text-lg font-bold text-foreground">How a Block is Mined</h3>
                <div className="space-y-3 text-sm text-foreground/80">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-voyager-gold/20 text-xs font-bold text-voyager-gold">1</span>
                    <span><strong className="text-foreground">Science tasks</strong> run in a Web Worker — protein folding, climate modeling, signal analysis. Each verified task = 1 point toward the block.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent-light">2</span>
                    <span><strong className="text-foreground">Block equation</strong> runs in a parallel Web Worker — SHA-256 proof of work. Finds a nonce with {6}-{7} leading hex zeros. Targets 5-10 min on phones.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-charity-green/20 text-xs font-bold text-charity-green">3</span>
                    <span><strong className="text-foreground">Block mined</strong> when BOTH conditions met: {TASKS_PER_BLOCK_MIN}-{TASKS_PER_BLOCK_MAX} verified tasks + equation solved. Reward added to weekly epoch merkle tree.</span>
                  </div>
                </div>

                {/* Reward split */}
                <div className="mt-6 rounded-xl bg-surface/50 p-4">
                  <p className="text-xs font-medium text-foreground/50 mb-3">Block Reward Split</p>
                  <div className="flex h-6 overflow-hidden rounded-full">
                    <div className="bg-voyager-gold flex items-center justify-center text-[10px] font-bold text-black" style={{ width: `${BLOCK_REWARD_SPLIT.EQUATION_SOLVER * 100}%` }}>
                      {BLOCK_REWARD_SPLIT.EQUATION_SOLVER * 100}% Solver
                    </div>
                    <div className="bg-accent-light flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${BLOCK_REWARD_SPLIT.TASK_CONTRIBUTORS * 100}%` }}>
                      {BLOCK_REWARD_SPLIT.TASK_CONTRIBUTORS * 100}% Tasks
                    </div>
                    <div className="bg-charity-green flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${BLOCK_REWARD_SPLIT.SCIENCE_BONUS * 100}%` }}>
                      {BLOCK_REWARD_SPLIT.SCIENCE_BONUS * 100}%
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-foreground/50">
                    <span>Equation Solver</span>
                    <span>Compute Contributors</span>
                    <span>F@H/BOINC Bonus</span>
                  </div>
                </div>
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
                RTG Decay Curve
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Block rewards decay{" "}
                <span className="gradient-text-animated">like Voyager&rsquo;s power</span>
              </p>
              <p className="mt-4 text-foreground/60">
                5% annual reduction — matching the real decay of Voyager&rsquo;s
                radioisotope thermoelectric generator. Smooth, continuous,
                and mathematically guaranteed to never empty.
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
                        <line x1={0} y1={CHART_H - pct * CHART_H} x2={CHART_W} y2={CHART_H - pct * CHART_H} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                        <text x={-8} y={CHART_H - pct * CHART_H + 4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="monospace">
                          {formatPOHAmount(pct * STARTING_ANNUAL_EMISSION)}
                        </text>
                      </g>
                    ))}

                    {/* X-axis labels */}
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((year) => (
                      <text key={`x-${year}`} x={(year / CHART_MAX_YEAR) * CHART_W} y={CHART_H + 20} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="monospace">
                        {year}y
                      </text>
                    ))}

                    {/* Cumulative emissions (filled area) */}
                    <polygon points={`0,${CHART_H} ${cumulativePoints} ${CHART_W},${CHART_H}`} fill="url(#cumulativeGrad)" opacity="0.15" />
                    <polyline points={cumulativePoints} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

                    {/* Pool limit line */}
                    <line x1={0} y1={0} x2={CHART_W} y2={0} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.6" />
                    <text x={CHART_W + 4} y={4} fill="#f59e0b" fontSize="10" fontFamily="monospace">Pool: 12.26B</text>

                    {/* Lifetime limit line */}
                    <line x1={0} y1={CHART_H - (MAX_DISTRIBUTABLE / REWARDS_POOL) * CHART_H} x2={CHART_W} y2={CHART_H - (MAX_DISTRIBUTABLE / REWARDS_POOL) * CHART_H} stroke="#818cf8" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.6" />
                    <text x={CHART_W + 4} y={CHART_H - (MAX_DISTRIBUTABLE / REWARDS_POOL) * CHART_H + 4} fill="#818cf8" fontSize="10" fontFamily="monospace">
                      Max: ~{formatPOHAmount(MAX_DISTRIBUTABLE, 2)}
                    </text>

                    {/* Voyager death zone (~10 years) */}
                    <rect x={(10 / CHART_MAX_YEAR) * CHART_W} y={0} width={(5 / CHART_MAX_YEAR) * CHART_W} height={CHART_H} fill="rgba(239,68,68,0.05)" />
                    <text x={(12.5 / CHART_MAX_YEAR) * CHART_W} y={15} textAnchor="middle" fill="rgba(239,68,68,0.5)" fontSize="9" fontFamily="monospace">
                      Voyager silent?
                    </text>

                    {/* Annual emission curve */}
                    <polygon points={`0,${CHART_H} ${emissionPoints} ${CHART_W},${CHART_H}`} fill="url(#emissionGrad)" opacity="0.2" />
                    <polyline points={emissionPoints} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

                    <defs>
                      <linearGradient id="emissionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <text x={CHART_W / 2} y={CHART_H + 40} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12">Years Since Launch</text>
                    <text x={-CHART_H / 2} y={-45} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12" transform="rotate(-90)">Annual Emission (POH)</text>
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
                    Pool (12.26B)
                  </span>
                  <span className="inline-flex items-center gap-2 text-foreground/70">
                    <span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-accent-light" />
                    Max (~{formatPOHAmount(MAX_DISTRIBUTABLE, 2)})
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </ParallaxSection>

      <div className="h-px bg-gradient-to-r from-transparent via-charity-green/30 to-transparent" />

      {/* ═══════════════════ BLOCK REWARD SCHEDULE ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-charity-green">
                Block Reward Schedule
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Year-by-year{" "}
                <span className="gradient-text-animated">block rewards</span>
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
                        <th className="px-3 sm:px-6 py-4 font-semibold text-accent-light">Year</th>
                        <th className="px-3 sm:px-6 py-4 font-semibold text-accent-light">Annual Emission</th>
                        <th className="px-3 sm:px-6 py-4 font-semibold text-accent-light">POH / Block</th>
                        <th className="px-3 sm:px-6 py-4 font-semibold text-accent-light">Cumulative</th>
                        <th className="px-3 sm:px-6 py-4 font-semibold text-accent-light">Pool Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-light text-foreground/80">
                      {schedule.map((row) => (
                        <tr key={row.year} className="hover:bg-surface/30 transition-colors">
                          <td className="px-3 sm:px-6 py-3 font-medium text-foreground">{row.year}</td>
                          <td className="px-3 sm:px-6 py-3 font-mono text-voyager-gold">{formatPOHAmount(row.annual, 0)}</td>
                          <td className="px-3 sm:px-6 py-3 font-mono text-accent-light">{formatPOHAmount(row.blockReward, 0)}</td>
                          <td className="px-3 sm:px-6 py-3 font-mono">{formatPOHAmount(row.cumulative, 2)}</td>
                          <td className="px-3 sm:px-6 py-3 font-mono text-charity-green">{formatPOHAmount(row.remaining, 2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-surface/20 border-t-2 border-accent/20">
                        <td className="px-3 sm:px-6 py-3 font-bold text-foreground">Forever</td>
                        <td className="px-3 sm:px-6 py-3 font-mono text-voyager-gold">&rarr; 0</td>
                        <td className="px-3 sm:px-6 py-3 font-mono text-accent-light">&rarr; 0</td>
                        <td className="px-3 sm:px-6 py-3 font-mono">~{formatPOHAmount(MAX_DISTRIBUTABLE, 2)}</td>
                        <td className="px-3 sm:px-6 py-3 font-mono font-bold text-charity-green">~{formatPOHAmount(PERMANENTLY_LOCKED, 2)}</td>
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

      {/* ═══════════════════ VOYAGER DEATH & CHASE FUND ═══════════════════ */}
      <ParallaxSection className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-voyager-gold">
                The Endgame
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                When Voyager goes{" "}
                <span className="gradient-text-animated">silent</span>
              </p>
              <p className="mt-4 text-foreground/60">
                Voyager 1&rsquo;s RTG will run out of power around 2030-2036.
                When that happens, POH transforms.
              </p>
            </div>
          </FadeIn>

          <StaggerParent className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
            <StaggerChild>
              <TiltCard className="h-full rounded-2xl" glowColor="rgba(239, 68, 68, 0.3)">
                <div className="glass-card flex h-full flex-col p-8">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                    <IconLock className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-red-400">The Freeze</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    No new blocks. No new rewards. Remaining POH in the Rewards
                    contract is locked forever — like lost Bitcoin, permanently
                    unreachable. At year 10: ~{formatPOHAmount(decommission10.pohLockedForever, 2)} POH
                    frozen. At year 15: ~{formatPOHAmount(decommission15.pohLockedForever, 2)} POH frozen.
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>

            <StaggerChild>
              <TiltCard className="h-full rounded-2xl" glowColor="rgba(245, 158, 11, 0.4)">
                <div className="glass-card flex h-full flex-col p-8">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-voyager-gold/10 text-voyager-gold">
                    <IconRocket className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-voyager-gold">The Voyager Chase Fund</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    The DAO votes on &ldquo;The Transition&rdquo; — redirecting
                    locked POH to fund real interstellar research. Goal: send an
                    AI-guided probe to intercept Voyager 1. The {formatPOHAmount(PERMANENTLY_LOCKED, 2)} POH
                    mathematically unreachable via mining becomes the seed fund.
                  </p>
                  <p className="mt-4 text-sm font-medium italic text-voyager-gold">
                    &ldquo;POH doesn&rsquo;t end when Voyager goes silent. It begins.&rdquo;
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>
          </StaggerParent>
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
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mx-auto mt-10 max-w-2xl">
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-surface-light">
                        <th className="px-3 sm:px-6 py-3 font-semibold text-accent-light">Contract</th>
                        <th className="px-3 sm:px-6 py-3 font-semibold text-accent-light">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-light text-foreground/80">
                      {[
                        { name: "POHToken", addr: CONTRACTS.token },
                        { name: "POHRewards (Block Pool)", addr: CONTRACTS.rewards },
                        { name: "POHCharity", addr: CONTRACTS.charity },
                        { name: "POHVesting", addr: CONTRACTS.vesting },
                        { name: "POHNodeRegistry", addr: CONTRACTS.registry },
                        { name: "TimelockController", addr: "0x64981B544a20d6933466c363dD175cA1FaD96Bb6" },
                        { name: "POHGovernor", addr: "0x7C96Ed675033F15a53557f1d0190e00B19522e6e" },
                      ].map((c) => (
                        <tr key={c.name} className="hover:bg-surface/30 transition-colors">
                          <td className="px-3 sm:px-6 py-3 font-medium text-foreground">{c.name}</td>
                          <td className="px-3 sm:px-6 py-3">
                            <a href={`${BLOCK_EXPLORER}/address/${c.addr}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-accent-light underline underline-offset-2 hover:text-accent break-all">
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
              Mine blocks.{" "}
              <span className="gradient-text-animated">Fund the future.</span>
            </h2>
            <p className="mt-6 text-lg text-foreground/60">
              Every block you mine brings us closer to catching Voyager.
              Start mining and be part of the mission.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/mine"
                className="inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-105"
              >
                Start Mining
              </Link>
              <Link
                href="/blocks"
                className="inline-flex h-14 items-center gap-1 justify-center rounded-xl border border-foreground/20 bg-white/5 px-8 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-voyager-gold hover:text-voyager-gold hover:bg-white/10"
              >
                Block Explorer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
