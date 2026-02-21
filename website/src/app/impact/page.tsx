"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VoyagerTracker } from "@/components/VoyagerTracker";

const TOTAL_SUPPLY = 24_526_000_000;

const allocations = [
  {
    label: "Community Rewards",
    percentage: 50,
    tokens: TOTAL_SUPPLY * 0.5,
    color: "bg-accent",
  },
  {
    label: "Charity Treasury",
    percentage: 20,
    tokens: TOTAL_SUPPLY * 0.2,
    color: "bg-charity-green",
  },
  {
    label: "Liquidity Pool",
    percentage: 15,
    tokens: TOTAL_SUPPLY * 0.15,
    color: "bg-blue-500",
  },
  {
    label: "Founder (Vesting)",
    percentage: 10,
    tokens: TOTAL_SUPPLY * 0.1,
    color: "bg-voyager-gold",
  },
  {
    label: "Airdrop",
    percentage: 5,
    tokens: TOTAL_SUPPLY * 0.05,
    color: "bg-purple-500",
  },
];

function formatTokenCount(n: number): string {
  return Math.floor(n).toLocaleString("en-US");
}

interface NetworkStats {
  activeNodes: number;
  activeValidators: number;
  verifiedTasks: number;
  totalDistributed: number;
  uniqueMiners: number;
  currentEpoch: number;
  weeklyPool: number;
}

export default function ImpactPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/data/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // Use defaults
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Impact Dashboard
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/60">
          Every compute task makes a difference. Track the Proof of Planet network
          in real-time.
        </p>
      </header>

      {/* Proof of Planet Network Stats */}
      <section className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">Active Nodes</p>
          <p className="mt-2 text-3xl font-bold text-charity-green">
            {stats?.activeNodes ?? 0}
          </p>
          <p className="mt-1 text-xs text-foreground/40">
            Phones computing for science
          </p>
        </div>

        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">Verified Tasks</p>
          <p className="mt-2 text-3xl font-bold text-voyager-gold">
            {(stats?.verifiedTasks ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-foreground/40">
            Protein, climate, signal computations
          </p>
        </div>

        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">POH Distributed</p>
          <p className="mt-2 text-3xl font-bold text-accent-light">
            {formatTokenCount(stats?.totalDistributed ?? 0)}
          </p>
          <p className="mt-1 text-xs text-foreground/40">
            Tokens earned by miners
          </p>
        </div>

        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">Unique Miners</p>
          <p className="mt-2 text-3xl font-bold text-accent-light">
            {stats?.uniqueMiners ?? 0}
          </p>
          <p className="mt-1 text-xs text-foreground/40">
            Wallets earning rewards
          </p>
        </div>
      </section>

      {/* Additional Mining Stats */}
      <section className="mb-16 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">Validators</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats?.activeValidators ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">Current Epoch</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats?.currentEpoch ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">Weekly Pool</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatTokenCount(stats?.weeklyPool ?? 0)} POH
          </p>
        </div>
      </section>

      {/* Voyager Distance */}
      <section className="mb-16">
        <VoyagerTracker />
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-foreground/50">
          Our supply model mirrors Voyager 1&apos;s journey. As Voyager travels
          deeper into interstellar space, our ecosystem grows. The emission rate
          decays at 5% per year — like Voyager&apos;s RTG power source.
        </p>
      </section>

      {/* Charity Distributions */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Charity Distributions
        </h2>
        <div className="overflow-hidden rounded-xl border border-surface-light bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-light">
                <th className="px-6 py-4 font-medium text-foreground/50">Date</th>
                <th className="px-6 py-4 font-medium text-foreground/50">Recipient</th>
                <th className="px-6 py-4 font-medium text-foreground/50">Amount</th>
                <th className="px-6 py-4 font-medium text-foreground/50">Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-foreground/40">
                  No distributions yet. The charity treasury will begin
                  distributing once the project launches on mainnet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Token Allocation */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Token Allocation
        </h2>
        <div className="space-y-5 rounded-xl border border-surface-light bg-surface p-6 sm:p-8">
          {allocations.map((alloc) => (
            <div key={alloc.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground/80">{alloc.label}</span>
                <span className="font-mono text-foreground/50">
                  {alloc.percentage}% &middot; {formatTokenCount(alloc.tokens)} POH
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-light">
                <div
                  className={`h-full rounded-full ${alloc.color}`}
                  style={{ width: `${alloc.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="text-center">
        <div className="rounded-xl border border-surface-light bg-surface px-6 py-12 sm:px-12">
          <p className="mx-auto max-w-xl text-lg text-foreground/70">
            Want to contribute? Start mining POH with your phone, or buy POH to
            support the project.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mine"
              className="inline-block rounded-lg bg-charity-green px-8 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
            >
              Start Mining
            </Link>
            <Link
              href="/how-to-buy"
              className="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light"
            >
              How to Buy POH
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
