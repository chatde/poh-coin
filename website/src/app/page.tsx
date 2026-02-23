"use client";

import Link from "next/link";
import Image from "next/image";
import { VoyagerTracker } from "@/components/VoyagerTracker";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  StaggerParent,
  StaggerChild,
} from "@/components/motion/StaggerChildren";
import { BLOCK_EXPLORER, CONTRACTS } from "@/lib/contracts";

/* ---------- Reusable icon components ---------- */

function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 1 0 0 4h4v-4h-4Z" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
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

function IconCode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconFlame({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* ---------- Supply allocation data ---------- */

const allocations = [
  { label: "Community", pct: 50, color: "bg-accent-light", gradient: "from-accent-light to-accent" },
  { label: "Charity", pct: 20, color: "bg-charity-green", gradient: "from-charity-green to-emerald-600" },
  { label: "Liquidity", pct: 15, color: "bg-voyager-gold", gradient: "from-voyager-gold to-amber-600" },
  { label: "Founder", pct: 10, color: "bg-accent", gradient: "from-accent to-indigo-700" },
  { label: "Airdrop", pct: 5, color: "bg-foreground/40", gradient: "from-foreground/40 to-foreground/20" },
];

/* ---------- Trust signals ---------- */

const trustSignals = [
  {
    icon: IconCode,
    title: "Open Source",
    description: "All 5 contracts verified on Basescan. Slither + Mythril static analysis passed clean. Code on GitHub.",
    href: "https://github.com/chatde/poh-coin",
  },
  {
    icon: IconLock,
    title: "Founder Vesting",
    description: "4-year linear vesting with a 6-month cliff. Founder tokens are locked on-chain — verifiable on Basescan.",
    href: `${BLOCK_EXPLORER}/address/${CONTRACTS.vesting}`,
  },
  {
    icon: IconFlame,
    title: "Liquidity Locked",
    description: "LP tokens burned permanently. Liquidity can never be pulled from the pool.",
  },
  {
    icon: IconBarChart,
    title: "On-Chain Transparency",
    description: "Every charity dollar is tracked, verifiable, and publicly visible on the blockchain.",
    href: `${BLOCK_EXPLORER}/address/${CONTRACTS.charity}`,
  },
];

/* ========== PAGE ========== */

export default function Home() {
  return (
    <>
      {/* -------------------- HERO -------------------- */}
      <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden">
        {/* Hero background image */}
        <Image
          src="/images/hero-voyager-space.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center -z-20"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/50 to-background" />

        {/* Nebula glow blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -z-10 -translate-x-1/2"
        >
          <div className="h-[600px] w-[900px] rounded-full bg-accent/20 blur-[128px]" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-0 -z-10"
        >
          <div className="h-[400px] w-[500px] rounded-full bg-voyager-gold/15 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36 lg:px-8 lg:pt-44">
          <FadeIn>
            <div className="flex flex-col items-center text-center">
              {/* Tagline pill */}
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-light backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-charity-green animate-pulse" />
                Charity-first, health-powered crypto
              </span>

              <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
                Change the Trajectory{" "}
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-accent-light via-voyager-gold to-charity-green bg-clip-text text-transparent">
                  of Humankind
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/60 sm:text-xl">
                Mine with your phone, earn through fitness, and fund real
                science&nbsp;&mdash; every transaction supports environmental,
                humanitarian, and health causes, powered by Voyager&nbsp;1&rsquo;s
                journey through interstellar space.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/how-to-buy"
                  className="inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-105"
                >
                  Buy POH
                </Link>
                <Link
                  href="/whitepaper"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-foreground/20 bg-white/5 px-8 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-accent-light hover:text-accent-light hover:bg-white/10"
                >
                  Read Whitepaper
                </Link>
              </div>

              {/* Voyager Tracker */}
              <div className="mt-16 w-full max-w-3xl">
                <VoyagerTracker />
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Scroll-down indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <IconChevronDown className="h-6 w-6 text-foreground/30" />
        </div>
      </section>

      {/* ─── Gradient divider ─── */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* -------------------- HOW IT WORKS -------------------- */}
      <section className="relative py-28 sm:py-32">
        {/* Nebula glow */}
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 -z-10">
          <div className="h-[500px] w-[500px] rounded-full bg-accent/8 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-light">
                How It Works
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Three steps. Real impact.
              </p>
            </div>
          </FadeIn>

          <StaggerParent className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <StaggerChild>
              <div className="glass-card glass-card-glow group relative p-8 transition-colors hover:border-accent/40">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent-light transition-colors group-hover:bg-accent/20">
                  <IconWallet className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Buy or Earn POH</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  Purchase on Uniswap or earn through Proof of Impact by
                  volunteering and donating.
                </p>
              </div>
            </StaggerChild>

            {/* Card 2 */}
            <StaggerChild>
              <div className="glass-card glass-card-glow group relative p-8 transition-colors hover:border-charity-green/40">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-charity-green/10 text-charity-green transition-colors group-hover:bg-charity-green/20">
                  <IconHeart className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Automatic Charity Funding</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  Every transaction allocates fees to verified charitable causes.
                  0.5&ndash;1.5% goes directly to the charity treasury.
                </p>
              </div>
            </StaggerChild>

            {/* Card 3 */}
            <StaggerChild>
              <div className="glass-card glass-card-glow group relative p-8 transition-colors hover:border-voyager-gold/40">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-voyager-gold/10 text-voyager-gold transition-colors group-hover:bg-voyager-gold/20">
                  <IconEye className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Transparent Impact</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  All charity distributions are on-chain, publicly verifiable,
                  and governed by the community.
                </p>
              </div>
            </StaggerChild>
          </StaggerParent>
        </div>
      </section>

      {/* ─── Gradient divider ─── */}
      <div className="h-px bg-gradient-to-r from-transparent via-voyager-gold/30 to-transparent" />

      {/* -------------------- TOKENOMICS OVERVIEW -------------------- */}
      <section className="relative py-28 sm:py-32">
        {/* Nebula glow */}
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/3 -z-10">
          <div className="h-[400px] w-[400px] rounded-full bg-voyager-gold/8 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-voyager-gold">
                Tokenomics
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Voyager Tokenomics
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-foreground/60">
                The total supply of POH is permanently tied to Voyager&nbsp;1&rsquo;s
                distance from the Sun, measured in miles. As Voyager drifts deeper
                into interstellar space, the max supply grows with it.
              </p>
            </div>
          </FadeIn>

          {/* Key stats */}
          <StaggerParent className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Max Supply", value: "24.526B", sub: "tied to Voyager 1" },
              { label: "Buy Fee", value: "1%", sub: "charity allocation" },
              { label: "Sell Fee", value: "3%", sub: "charity + LP" },
              { label: "Transfer Fee", value: "0.5%", sub: "minimal friction" },
            ].map((stat) => (
              <StaggerChild key={stat.label}>
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">{stat.label}</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">{stat.sub}</p>
                </div>
              </StaggerChild>
            ))}
          </StaggerParent>

          {/* Allocation bar */}
          <FadeIn delay={0.2}>
            <div className="mt-14">
              <h3 className="mb-6 text-center text-lg font-semibold">
                Supply Allocation
              </h3>

              {/* Stacked bar */}
              <div className="mx-auto flex h-8 max-w-3xl overflow-hidden rounded-full shadow-inner shadow-black/30">
                {allocations.map((a) => (
                  <div
                    key={a.label}
                    className={`bg-gradient-to-r ${a.gradient} transition-all`}
                    style={{ width: `${a.pct}%` }}
                    title={`${a.label}: ${a.pct}%`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                {allocations.map((a) => (
                  <span key={a.label} className="inline-flex items-center gap-2 text-foreground/70">
                    <span className={`inline-block h-3 w-3 rounded-sm ${a.color}`} />
                    {a.label}&nbsp;
                    <span className="font-semibold text-foreground">{a.pct}%</span>
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>

          <div className="mt-10 text-center">
            <Link
              href="/whitepaper"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent-light transition-colors hover:text-accent"
            >
              Full tokenomics in the whitepaper
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Gradient divider ─── */}
      <div className="h-px bg-gradient-to-r from-transparent via-charity-green/30 to-transparent" />

      {/* -------------------- TRUST SECTION -------------------- */}
      <section className="relative py-28 sm:py-32">
        {/* Nebula glow */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/3 bottom-0 -z-10">
          <div className="h-[400px] w-[400px] rounded-full bg-charity-green/8 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-charity-green">
                Security
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Built for Trust
              </p>
            </div>
          </FadeIn>

          <StaggerParent className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <StaggerChild key={signal.title}>
                  <div className="glass-card glass-card-glow flex flex-col items-center p-8 text-center transition-colors hover:border-charity-green/30">
                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-charity-green/10 text-charity-green">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-semibold">{signal.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                      {signal.description}
                    </p>
                    {signal.href && (
                      <a
                        href={signal.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 text-xs font-medium text-accent-light hover:text-accent transition-colors"
                      >
                        Verify on-chain &rarr;
                      </a>
                    )}
                  </div>
                </StaggerChild>
              );
            })}
          </StaggerParent>
        </div>
      </section>

      {/* ─── Gradient divider ─── */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* -------------------- BOTTOM CTA -------------------- */}
      <section className="relative py-28 sm:py-32">
        {/* Centered nebula glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
          <div className="h-[400px] w-[600px] rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <FadeIn>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to{" "}
              <span className="bg-gradient-to-r from-accent-light via-voyager-gold to-charity-green bg-clip-text text-transparent">
                make an impact
              </span>
              ?
            </h2>
            <p className="mt-4 text-lg text-foreground/60">
              Join the community building a future where every transaction
              contributes to the pursuit of happiness for all.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/how-to-buy"
                className="inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-105"
              >
                Buy POH
              </Link>
              <Link
                href="/impact"
                className="inline-flex h-14 items-center justify-center rounded-xl border border-foreground/20 bg-white/5 px-8 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-charity-green hover:text-charity-green hover:bg-white/10"
              >
                View Impact Dashboard
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
