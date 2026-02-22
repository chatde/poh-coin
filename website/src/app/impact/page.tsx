"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VoyagerTracker } from "@/components/VoyagerTracker";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  StaggerParent,
  StaggerChild,
} from "@/components/motion/StaggerChildren";
import {
  getTokenContract,
  getVestingContract,
  getRewardsContract,
  getRegistryContract,
  formatPOH,
  CONTRACTS,
  BLOCK_EXPLORER,
  IS_MAINNET,
} from "@/lib/contracts";

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

  const [onChain, setOnChain] = useState<{
    charityBalance: string;
    rewardsPool: string;
    vestingReleased: string;
    vestingReleasable: string;
    vestedPct: number;
    totalDistributedOnChain: string;
    rewardsRemaining: string;
    totalNodes: number;
    totalValidators: number;
    totalStaked: string;
  } | null>(null);

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

  // Fetch on-chain data
  useEffect(() => {
    const fetchOnChain = async () => {
      try {
        const token = getTokenContract();
        const vesting = getVestingContract();
        const rewards = getRewardsContract();
        const registry = getRegistryContract();

        const [
          charityBal,
          rewardsBal,
          released,
          releasable,
          vestedPctBps,
          totalDist,
          remaining,
          nodes,
          validators,
          staked,
        ] = await Promise.all([
          token.balanceOf(CONTRACTS.charity),
          token.balanceOf(CONTRACTS.rewards),
          vesting.released(),
          vesting.releasable(),
          vesting.vestedPercentageBps(),
          rewards.totalDistributed(),
          rewards.rewardsRemaining(),
          registry.totalNodes(),
          registry.totalValidators(),
          registry.totalStaked(),
        ]);

        setOnChain({
          charityBalance: formatPOH(charityBal, 1),
          rewardsPool: formatPOH(rewardsBal, 1),
          vestingReleased: formatPOH(released, 1),
          vestingReleasable: formatPOH(releasable, 1),
          vestedPct: Number(vestedPctBps) / 100,
          totalDistributedOnChain: formatPOH(totalDist, 1),
          rewardsRemaining: formatPOH(remaining, 1),
          totalNodes: Number(nodes),
          totalValidators: Number(validators),
          totalStaked: formatPOH(staked, 1),
        });
      } catch {
        // RPC error — use defaults
      }
    };

    fetchOnChain();
    const interval = setInterval(fetchOnChain, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <FadeIn>
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Impact Dashboard
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/60">
            Every compute task makes a difference. Track the Proof of Planet network
            in real-time.
          </p>
        </header>
      </FadeIn>

      {/* Proof of Planet Network Stats */}
      <StaggerParent className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerChild>
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-foreground/50">Active Nodes</p>
            <p className="mt-2 text-3xl font-bold text-charity-green">
              {stats?.activeNodes ?? 0}
            </p>
            <p className="mt-1 text-xs text-foreground/40">
              Phones computing for science
            </p>
          </div>
        </StaggerChild>

        <StaggerChild>
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-foreground/50">Verified Tasks</p>
            <p className="mt-2 text-3xl font-bold text-voyager-gold">
              {(stats?.verifiedTasks ?? 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-foreground/40">
              Protein, climate, signal computations
            </p>
          </div>
        </StaggerChild>

        <StaggerChild>
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-foreground/50">POH Distributed</p>
            <p className="mt-2 text-3xl font-bold text-accent-light">
              {formatTokenCount(stats?.totalDistributed ?? 0)}
            </p>
            <p className="mt-1 text-xs text-foreground/40">
              Tokens earned by miners
            </p>
          </div>
        </StaggerChild>

        <StaggerChild>
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-foreground/50">Unique Miners</p>
            <p className="mt-2 text-3xl font-bold text-accent-light">
              {stats?.uniqueMiners ?? 0}
            </p>
            <p className="mt-1 text-xs text-foreground/40">
              Wallets earning rewards
            </p>
          </div>
        </StaggerChild>
      </StaggerParent>

      {/* Additional Mining Stats */}
      <section className="mb-16 grid gap-6 sm:grid-cols-3">
        <div className="glass-card p-6">
          <p className="text-sm font-medium text-foreground/50">Validators</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats?.activeValidators ?? 0}
          </p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm font-medium text-foreground/50">Current Epoch</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats?.currentEpoch ?? 0}
          </p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm font-medium text-foreground/50">Weekly Pool</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatTokenCount(stats?.weeklyPool ?? 0)} POH
          </p>
        </div>
      </section>

      {/* On-Chain Treasury Data */}
      {onChain && (
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
            On-Chain Treasury
            <span className="ml-2 text-xs font-normal text-foreground/40">{IS_MAINNET ? "Base Mainnet" : "Base Sepolia Testnet"}</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-6">
              <p className="text-sm font-medium text-foreground/50">Charity Treasury</p>
              <p className="mt-2 text-2xl font-bold text-charity-green">
                {onChain.charityBalance} POH
              </p>
              <a
                href={`${BLOCK_EXPLORER}/address/${CONTRACTS.charity}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-xs text-foreground/30 hover:text-accent-light"
              >
                View on Basescan
              </a>
            </div>
            <div className="glass-card p-6">
              <p className="text-sm font-medium text-foreground/50">Rewards Pool</p>
              <p className="mt-2 text-2xl font-bold text-accent-light">
                {onChain.rewardsPool} POH
              </p>
              <p className="mt-1 text-xs text-foreground/40">
                Remaining: {onChain.rewardsRemaining}
              </p>
            </div>
            <div className="glass-card p-6">
              <p className="text-sm font-medium text-foreground/50">Founder Vesting</p>
              <p className="mt-2 text-2xl font-bold text-voyager-gold">
                {onChain.vestedPct}% vested
              </p>
              <p className="mt-1 text-xs text-foreground/40">
                Released: {onChain.vestingReleased} | Claimable: {onChain.vestingReleasable}
              </p>
            </div>
            <div className="glass-card p-6">
              <p className="text-sm font-medium text-foreground/50">On-Chain Nodes</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {onChain.totalNodes}
              </p>
              <p className="mt-1 text-xs text-foreground/40">
                Validators: {onChain.totalValidators} | Staked: {onChain.totalStaked}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── Gradient divider ─── */}
      <div className="mb-16 h-px bg-gradient-to-r from-transparent via-voyager-gold/30 to-transparent" />

      {/* Voyager Distance */}
      <FadeIn>
        <section className="mb-16">
          <VoyagerTracker />
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-foreground/50">
            Our supply model mirrors Voyager 1&apos;s journey. As Voyager travels
            deeper into interstellar space, our ecosystem grows. The emission rate
            decays at 5% per year — like Voyager&apos;s RTG power source.
          </p>
        </section>
      </FadeIn>

      {/* Charity Distributions */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Charity Distributions
        </h2>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-light/50">
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
        <div className="glass-card space-y-5 p-6 sm:p-8">
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
      <FadeIn>
        <section className="text-center">
          <div className="glass-card px-6 py-12 sm:px-12">
            <p className="mx-auto max-w-xl text-lg text-foreground/70">
              Want to contribute? Start mining POH with your phone, or buy POH to
              support the project.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mine"
                className="inline-block rounded-xl bg-charity-green px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
              >
                Start Mining
              </Link>
              <Link
                href="/how-to-buy"
                className="inline-block rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 py-3 text-sm font-semibold text-white transition-all hover:shadow-accent/40 hover:scale-105"
              >
                How to Buy POH
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
