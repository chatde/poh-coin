"use client";

import Link from "next/link";
import { VoyagerTracker } from "@/components/VoyagerTracker";
import { VoyagerBackground } from "@/components/VoyagerBackground";
import { StarField } from "@/components/StarField";
import { FadeIn } from "@/components/motion/FadeIn";
import { CountUp } from "@/components/motion/CountUp";
import { TiltCard } from "@/components/motion/TiltCard";
import { ParallaxSection } from "@/components/motion/ParallaxSection";
import {
  StaggerParent,
  StaggerChild,
} from "@/components/motion/StaggerChildren";
import { BLOCK_EXPLORER, CONTRACTS } from "@/lib/contracts";

/* ---------- Icon components ---------- */

function IconCpu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
    </svg>
  );
}

function IconMicroscope({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18h8" />
      <path d="M3 22h18" />
      <path d="M14 22a7 7 0 1 0 0-14h-1" />
      <path d="M9 14h2" />
      <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
      <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
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

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function IconPickaxe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.531 12.469 6.619 20.38a1 1 0 1 1-3-3l7.912-7.912" />
      <path d="M15.686 4.314A12.5 12.5 0 0 0 5.461 2.958 1 1 0 0 0 5.58 4.71a22 22 0 0 1 6.318 3.393" />
      <path d="M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4Z" />
      <path d="M19.686 8.314a12.5 12.5 0 0 1 1.356 10.225 1 1 0 0 1-1.751-.119 22 22 0 0 0-3.393-6.318" />
    </svg>
  );
}

function IconCoins({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4" />
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

function IconPaw({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="4" cy="8" r="2" />
      <path d="M16.5 14.5c0 3.04-2.01 5.5-4.5 5.5s-4.5-2.46-4.5-5.5S9.51 10 12 10s4.5 2.46 4.5 4.5z" />
      <circle cx="17" cy="14" r="2" />
      <circle cx="5" cy="14" r="2" />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
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

/* ---------- Data ---------- */

const allocations = [
  { label: "Community", pct: 50, color: "bg-accent-light", gradient: "from-accent-light to-accent" },
  { label: "Charity", pct: 20, color: "bg-charity-green", gradient: "from-charity-green to-emerald-600" },
  { label: "Liquidity", pct: 15, color: "bg-voyager-gold", gradient: "from-voyager-gold to-amber-600" },
  { label: "Founder", pct: 10, color: "bg-accent", gradient: "from-accent to-indigo-700" },
  { label: "Airdrop", pct: 5, color: "bg-foreground/40", gradient: "from-foreground/40 to-foreground/20" },
];

const trustSignals = [
  {
    icon: IconCode,
    title: "Open Source",
    description: "All contracts verified on Basescan. Slither + Mythril static analysis passed clean.",
    href: "https://github.com/chatde/poh-coin",
  },
  {
    icon: IconLock,
    title: "Founder Vesting",
    description: "4-year linear vesting with a 6-month cliff. Founder tokens locked on-chain.",
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

const steps = [
  {
    icon: IconDownload,
    title: "Install",
    description: "Open the POH mining app on any device — no special hardware required.",
    accent: "text-accent-light",
    bg: "bg-accent/10",
  },
  {
    icon: IconPickaxe,
    title: "Mine",
    description: "Contribute compute power to Folding@Home and earn through fitness tracking.",
    accent: "text-voyager-gold",
    bg: "bg-voyager-gold/10",
  },
  {
    icon: IconCoins,
    title: "Earn",
    description: "Receive POH rewards based on your mining contributions and activity.",
    accent: "text-charity-green",
    bg: "bg-charity-green/10",
  },
  {
    icon: IconSparkles,
    title: "Impact",
    description: "Your rewards fund real science, charity, and animal rescue automatically.",
    accent: "text-accent-light",
    bg: "bg-accent/10",
  },
];

const missionPillars = [
  {
    icon: IconCpu,
    title: "Computing for Good",
    description: "Your phone and computer solve real scientific problems — protein folding, disease research, climate modeling — earning POH while advancing humanity.",
    accent: "text-accent-light",
    bg: "bg-accent/10",
    glow: "rgba(129, 140, 248, 0.4)",
  },
  {
    icon: IconPaw,
    title: "Animal Rescue",
    description: "Every transaction saves lives. Funding shelters, preventing euthanasia, and building sanctuary farms where rescued animals live freely.",
    accent: "text-charity-green",
    bg: "bg-charity-green/10",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  {
    icon: IconHeart,
    title: "Human Health",
    description: "Fitness mining rewards healthy living. Charity funds flow to medical research, mental health, and healthcare access for underserved communities.",
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
    glow: "rgba(251, 113, 133, 0.4)",
  },
  {
    icon: IconGlobe,
    title: "Planet Sustainability",
    description: "Reforestation, ocean cleanup, renewable energy — everything that makes Earth healthier for future generations, funded transparently on-chain.",
    accent: "text-voyager-gold",
    bg: "bg-voyager-gold/10",
    glow: "rgba(245, 158, 11, 0.4)",
  },
];

/* ========== PAGE ========== */

export default function Home() {
  return (
    <>
      {/* ═══════════════════ SECTION 1 — HERO ═══════════════════ */}
      <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden">
        {/* Interactive star field (canvas) */}
        <div className="absolute inset-0 -z-30">
          <StarField />
        </div>

        {/* Voyager spacecraft + parallax layers + particle trails */}
        <div className="absolute inset-0 -z-20">
          <VoyagerBackground />
        </div>

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/50 via-background/30 to-background" />

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36 lg:px-8 lg:pt-44">
          <FadeIn>
            <div className="flex flex-col items-center text-center">
              {/* Tagline pill */}
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-light backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-charity-green animate-pulse" />
                Built on Base &middot; Powered by Purpose
              </span>

              {/* Animated gradient headline */}
              <h1 className="max-w-5xl text-5xl font-extrabold leading-[1.05] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
                Change the Trajectory{" "}
                <br className="hidden sm:block" />
                <span className="gradient-text-animated">
                  of Humankind
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/60 sm:text-xl">
                The first cryptocurrency built for the health of both the planet
                and its people. Mine with your phone, earn through fitness, save
                animals, fund science&nbsp;&mdash; all powered by Voyager&nbsp;1&rsquo;s
                journey through interstellar space.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/mine"
                  className="inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-105"
                >
                  Start Mining
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

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* ═══════════════════ SECTION 2 — OUR MISSION ═══════════════════ */}
      <ParallaxSection className="py-28 sm:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-charity-green">
                Our Mission
              </h2>
              <p className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                The first crypto for{" "}
                <span className="gradient-text-animated">the planet.</span>
              </p>
              <p className="mt-6 text-lg leading-relaxed text-foreground/60">
                Project POH &mdash; the Pursuit of Happiness &mdash; is the first
                cryptocurrency built entirely for the benefit of planetary health
                and human well-being. Your computing power solves real scientific
                problems. Your transactions save animals from euthanasia.
                Your participation funds environmental sustainability, humanitarian
                aid, and medical research. Every buy, sell, and transfer automatically
                allocates funds to verified causes &mdash; hardcoded on-chain,
                transparent forever.
              </p>
            </div>
          </FadeIn>

          {/* Mission pillars */}
          <StaggerParent className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {missionPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <StaggerChild key={pillar.title}>
                  <TiltCard className="h-full rounded-2xl" glowColor={pillar.glow}>
                    <div className="glass-card flex h-full flex-col items-center p-8 text-center">
                      <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full ${pillar.bg} ${pillar.accent}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className={`text-lg font-bold ${pillar.accent}`}>{pillar.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                        {pillar.description}
                      </p>
                    </div>
                  </TiltCard>
                </StaggerChild>
              );
            })}
          </StaggerParent>
        </div>
      </ParallaxSection>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-charity-green/30 to-transparent" />

      {/* ═══════════════════ SECTION 3 — SAVE EVERY LIFE (Animal Rescue) ═══════════════════ */}
      <ParallaxSection className="relative py-28 sm:py-36 overflow-hidden">
        {/* Background glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
          <div className="h-[500px] w-[700px] rounded-full bg-charity-green/8 blur-[150px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Story */}
            <FadeIn>
              <div>
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-charity-green/30 bg-charity-green/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-charity-green">
                  <IconPaw className="h-3.5 w-3.5" />
                  Save Every Life
                </span>
                <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  Every animal{" "}
                  <span className="text-charity-green">deserves a chance.</span>
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-foreground/60">
                  Millions of animals enter shelters every year. Too many never leave.
                  Project POH is building a future where blockchain funding directly
                  saves animals from euthanasia, provides veterinary care, and gives
                  them a forever home.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-foreground/60">
                  Our long-term vision: a sanctuary farm where every rescued animal
                  lives freely&nbsp;&mdash; funded permanently by on-chain charity
                  allocations that can never be turned off.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/impact"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-charity-green to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-charity-green/25 transition-all hover:shadow-charity-green/40 hover:scale-105"
                  >
                    View Impact Dashboard
                  </Link>
                  <Link
                    href="/whitepaper"
                    className="inline-flex h-12 items-center gap-1 justify-center rounded-xl border border-charity-green/30 bg-charity-green/5 px-6 text-sm font-semibold text-charity-green transition-all hover:bg-charity-green/10"
                  >
                    How It Works
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </FadeIn>

            {/* Right — Impact Stats */}
            <FadeIn delay={0.2}>
              <div className="grid grid-cols-2 gap-4">
                <TiltCard className="rounded-2xl" glowColor="rgba(16, 185, 129, 0.3)">
                  <div className="glass-card flex flex-col items-center p-6 text-center glow-pulse-green">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-charity-green/10">
                      <IconPaw className="h-6 w-6 text-charity-green" />
                    </div>
                    <p className="text-3xl font-extrabold text-charity-green">
                      <CountUp end={20} duration={2} suffix="%" />
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">of supply for charity</p>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl" glowColor="rgba(16, 185, 129, 0.3)">
                  <div className="glass-card flex flex-col items-center p-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-charity-green/10">
                      <IconHeart className="h-6 w-6 text-charity-green animate-heartbeat" />
                    </div>
                    <p className="text-3xl font-extrabold text-charity-green">
                      <CountUp end={100} duration={2} suffix="%" />
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">on-chain transparent</p>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl" glowColor="rgba(16, 185, 129, 0.3)">
                  <div className="glass-card flex flex-col items-center p-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-charity-green/10">
                      <IconHome className="h-6 w-6 text-charity-green" />
                    </div>
                    <p className="text-3xl font-extrabold text-charity-green">
                      <CountUp end={1} duration={1} suffix="" />
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">sanctuary farm (goal)</p>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl" glowColor="rgba(16, 185, 129, 0.3)">
                  <div className="glass-card flex flex-col items-center p-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-charity-green/10">
                      <IconShield className="h-6 w-6 text-charity-green" />
                    </div>
                    <p className="text-3xl font-extrabold text-charity-green">
                      <CountUp end={0} duration={1} suffix="" />
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">rug-pull risk (hardcoded)</p>
                  </div>
                </TiltCard>
              </div>
            </FadeIn>
          </div>
        </div>
      </ParallaxSection>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* ═══════════════════ SECTION 4 — WHAT MAKES POH DIFFERENT (Bento Grid) ═══════════════════ */}
      <ParallaxSection className="py-28 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-light">
                What Makes POH Different
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Not just another token.{" "}
                <span className="gradient-text-animated">A movement.</span>
              </p>
            </div>
          </FadeIn>

          <StaggerParent className="mt-16 grid gap-5 md:grid-cols-2">
            {/* Large card — Mine With Your Phone (spans 2 cols on lg) */}
            <StaggerChild className="md:col-span-2 lg:col-span-1">
              <TiltCard className="h-full rounded-2xl" glowColor="rgba(129, 140, 248, 0.4)">
                <div className="glass-card flex h-full flex-col justify-between p-8 sm:p-10">
                  <div>
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent-light">
                      <IconCpu className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">Mine With Your Phone</h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/60">
                      No expensive rigs. Contribute compute power to Folding@Home
                      protein research and earn POH through fitness tracking.
                      Your phone becomes an instrument of scientific discovery.
                    </p>
                  </div>
                  <Link
                    href="/mine"
                    className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent-light hover:text-accent transition-colors"
                  >
                    Start mining now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </TiltCard>
            </StaggerChild>

            {/* Card — Fund Real Science */}
            <StaggerChild>
              <TiltCard className="h-full rounded-2xl" glowColor="rgba(245, 158, 11, 0.4)">
                <div className="glass-card flex h-full flex-col p-8">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-voyager-gold/10 text-voyager-gold">
                    <IconMicroscope className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Fund Real Science</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    Mining compute contributes to Folding@Home, simulating protein folding to
                    find cures for diseases like Alzheimer&rsquo;s, cancer, and Parkinson&rsquo;s.
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>

            {/* Card — Save Animals */}
            <StaggerChild>
              <TiltCard className="h-full rounded-2xl" glowColor="rgba(16, 185, 129, 0.4)">
                <div className="glass-card flex h-full flex-col p-8">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-charity-green/10 text-charity-green">
                    <IconPaw className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Save Animals</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    Transaction fees fund animal rescue operations. Our goal: pull animals
                    from kill shelters and build a sanctuary farm where they live freely.
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>

            {/* Card — Transparent Impact */}
            <StaggerChild className="md:col-span-2 lg:col-span-1">
              <TiltCard className="h-full rounded-2xl" glowColor="rgba(99, 102, 241, 0.3)">
                <div className="glass-card flex h-full flex-col p-8">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent-light">
                    <IconEye className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Transparent Impact</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    All charity distributions are on-chain, publicly verifiable,
                    and governed by the community. Track every dollar on the impact dashboard.
                  </p>
                </div>
              </TiltCard>
            </StaggerChild>
          </StaggerParent>
        </div>
      </ParallaxSection>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-voyager-gold/30 to-transparent" />

      {/* ═══════════════════ SECTION 5 — HOW MINING WORKS ═══════════════════ */}
      <ParallaxSection className="py-28 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-voyager-gold">
                How Mining Works
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Four steps to{" "}
                <span className="gradient-text-animated">real impact.</span>
              </p>
            </div>
          </FadeIn>

          {/* Step flow */}
          <div className="mt-16 relative">
            {/* Animated connecting line (desktop) */}
            <div className="hidden lg:block absolute top-[60px] left-[12.5%] right-[12.5%] h-0.5">
              <svg className="w-full h-2 overflow-visible" preserveAspectRatio="none">
                <line
                  x1="0" y1="1" x2="100%" y2="1"
                  stroke="rgba(99,102,241,0.2)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  style={{ animation: "dash-flow 2s linear infinite" }}
                />
              </svg>
            </div>

            <StaggerParent className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <StaggerChild key={step.title}>
                    <div className="relative flex flex-col items-center text-center">
                      {/* Step number badge */}
                      <div className="absolute -top-3 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface-light text-xs font-bold text-foreground/50 ring-2 ring-background z-10">
                        {i + 1}
                      </div>
                      <div className={`mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${step.bg} ${step.accent}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className={`text-lg font-bold ${step.accent}`}>{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                        {step.description}
                      </p>
                    </div>
                  </StaggerChild>
                );
              })}
            </StaggerParent>
          </div>
        </div>
      </ParallaxSection>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* ═══════════════════ SECTION 6 — VOYAGER TOKENOMICS ═══════════════════ */}
      <ParallaxSection className="py-28 sm:py-32">
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
                distance from the Sun, measured in kilometers. As Voyager drifts deeper
                into interstellar space, the max supply grows with it.
              </p>
            </div>
          </FadeIn>

          {/* Key stats with CountUp */}
          <StaggerParent className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerChild>
              <TiltCard className="rounded-2xl" glowColor="rgba(245, 158, 11, 0.3)">
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">Max Supply</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground stat-glow">
                    <CountUp end={24.526} duration={2.5} decimals={3} suffix="B" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">tied to Voyager 1</p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard className="rounded-2xl" glowColor="rgba(16, 185, 129, 0.3)">
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">Buy Fee</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                    <CountUp end={1} duration={1.5} suffix="%" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">charity allocation</p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard className="rounded-2xl" glowColor="rgba(99, 102, 241, 0.3)">
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">Sell Fee</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                    <CountUp end={3} duration={1.5} suffix="%" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">charity + LP</p>
                </div>
              </TiltCard>
            </StaggerChild>
            <StaggerChild>
              <TiltCard className="rounded-2xl" glowColor="rgba(245, 158, 11, 0.3)">
                <div className="glass-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground/50">Transfer Fee</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                    <CountUp end={0.5} duration={1.5} decimals={1} suffix="%" />
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">minimal friction</p>
                </div>
              </TiltCard>
            </StaggerChild>
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
                    className={`animate-bar-fill bg-gradient-to-r ${a.gradient}`}
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
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </ParallaxSection>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-charity-green/30 to-transparent" />

      {/* ═══════════════════ SECTION 7 — BUILT FOR TRUST ═══════════════════ */}
      <ParallaxSection className="py-28 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-charity-green">
                Security
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Built for Trust
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-foreground/60">
                No hidden keys. No admin backdoors. Charity funding is hardcoded
                into the smart contracts and can never be disabled.
              </p>
            </div>
          </FadeIn>

          <StaggerParent className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <StaggerChild key={signal.title}>
                  <TiltCard className="h-full rounded-2xl" glowColor="rgba(16, 185, 129, 0.3)">
                    <div className="glass-card flex h-full flex-col items-center p-8 text-center">
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
                          className="mt-auto pt-4 text-xs font-medium text-accent-light hover:text-accent transition-colors"
                        >
                          Verify on-chain &rarr;
                        </a>
                      )}
                    </div>
                  </TiltCard>
                </StaggerChild>
              );
            })}
          </StaggerParent>
        </div>
      </ParallaxSection>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* ═══════════════════ SECTION 8 — BOTTOM CTA ═══════════════════ */}
      <section className="relative py-28 sm:py-36">
        {/* Glowing background orb */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
          <div className="h-[400px] w-[600px] rounded-full bg-accent/10 blur-[120px] animate-[pulse-slow_4s_ease-in-out_infinite]" />
        </div>

        <FadeIn>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Ready to{" "}
              <span className="gradient-text-animated">
                make an impact
              </span>
              ?
            </h2>
            <p className="mt-6 text-lg text-foreground/60">
              Join the community building a future where every transaction saves lives,
              funds science, and pushes humanity forward. The pursuit of happiness
              starts with a single step.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/mine"
                className="inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-105"
              >
                Start Mining
              </Link>
              <Link
                href="/impact"
                className="inline-flex h-14 items-center justify-center rounded-xl border border-foreground/20 bg-white/5 px-8 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-charity-green hover:text-charity-green hover:bg-white/10"
              >
                View Impact Dashboard
              </Link>
            </div>

            {/* Disclaimer */}
            <p className="mt-12 text-xs text-foreground/30 max-w-xl mx-auto">
              POH is a utility token on the Base network. This is not financial advice
              and not an investment solicitation. Smart contracts are unaudited &mdash;
              participate at your own risk. Always do your own research.
            </p>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
