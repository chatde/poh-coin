"use client"

import { useEffect, useState } from "react"
import { FadeIn } from "@/components/motion/FadeIn"
import { CountUp } from "@/components/motion/CountUp"
import { TiltCard } from "@/components/motion/TiltCard"
import { ParallaxSection } from "@/components/motion/ParallaxSection"
import { StaggerParent, StaggerChild } from "@/components/motion/StaggerChildren"
import { getBlockHeight, getBlocksPerDay } from "@/lib/voyager"
import { getBlockReward, getEmissionSchedule, getDecommissionState, formatPOHAmount, REWARDS_POOL, MAX_DISTRIBUTABLE, PERMANENTLY_LOCKED } from "@/lib/block-rewards"
import { getVoyagerDistanceKm, formatDistanceKm, formatBlockHeight } from "@/lib/voyager"
import type { RecentBlock } from "@/app/api/blocks/recent/route"
import type { TopMiner } from "@/app/api/blocks/top-miners/route"

function shortenWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`
}

function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export default function BlockExplorerPage() {
  // Time-dependent values must be computed client-side to avoid hydration mismatch
  const [currentBlock, setCurrentBlock] = useState(0)
  const [currentReward, setCurrentReward] = useState(0)
  const [distanceKm, setDistanceKm] = useState(0)
  const blocksPerDay = getBlocksPerDay()
  const emissionSchedule = getEmissionSchedule()

  const decommissionYear5 = getDecommissionState(5)
  const decommissionYear10 = getDecommissionState(10)
  const decommissionYear15 = getDecommissionState(15)

  // Live DB state
  const [recentBlocks, setRecentBlocks] = useState<RecentBlock[]>([])
  const [topMiners, setTopMiners] = useState<TopMiner[]>([])
  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null)
  const [blocksLoading, setBlocksLoading] = useState(true)
  const [minersLoading, setMinersLoading] = useState(true)
  const [blocksError, setBlocksError] = useState<string | null>(null)
  const [minersError, setMinersError] = useState<string | null>(null)

  useEffect(() => {
    setCurrentBlock(getBlockHeight())
    setCurrentReward(getBlockReward())
    setDistanceKm(getVoyagerDistanceKm())
  }, [])

  useEffect(() => {
    async function fetchRecentBlocks() {
      try {
        const res = await fetch("/api/blocks/recent", {
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { blocks?: RecentBlock[]; error?: string }
        if (json.error) throw new Error(json.error)
        setRecentBlocks(json.blocks ?? [])
      } catch (err: unknown) {
        setBlocksError(err instanceof Error ? err.message : "Failed to load blocks")
      } finally {
        setBlocksLoading(false)
      }
    }

    async function fetchTopMiners() {
      try {
        const res = await fetch("/api/blocks/top-miners", {
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { miners?: TopMiner[]; epoch?: number; error?: string }
        if (json.error) throw new Error(json.error)
        setTopMiners(json.miners ?? [])
        if (json.epoch !== undefined) setCurrentEpoch(json.epoch)
      } catch (err: unknown) {
        setMinersError(err instanceof Error ? err.message : "Failed to load miners")
      } finally {
        setMinersLoading(false)
      }
    }

    void fetchRecentBlocks()
    void fetchTopMiners()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface to-surface-light">
      {/* Hero Section */}
      <ParallaxSection speed={0.3}>
        <div className="container mx-auto px-4 pt-32 pb-16">
          <FadeIn>
            <h1 className="text-5xl md:text-7xl font-bold text-center mb-6">
              <span className="gradient-text-animated">Block Explorer</span>
            </h1>
            <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
              Every block mined mirrors Voyager 1's journey through the cosmos. As our probe travels farther from Earth,
              radioisotope decay gradually dims its power—and POH's emission follows the same elegant curve.
            </p>
          </FadeIn>
        </div>
      </ParallaxSection>

      {/* Live Stats Row */}
      <section className="container mx-auto px-4 py-16">
        <StaggerParent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaggerChild>
              <TiltCard>
                <div className="glass-card p-6 h-full">
                  <div className="text-sm text-gray-400 mb-2">Current Block Height</div>
                  <div className="text-3xl font-bold text-voyager-gold">
                    <CountUp end={currentBlock} duration={2} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{formatBlockHeight(currentBlock)}</div>
                </div>
              </TiltCard>
            </StaggerChild>

            <StaggerChild>
              <TiltCard>
                <div className="glass-card p-6 h-full">
                  <div className="text-sm text-gray-400 mb-2">Blocks Available Today</div>
                  <div className="text-3xl font-bold text-accent">
                    <CountUp end={blocksPerDay} duration={2} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">One block per Voyager photo transmission</div>
                </div>
              </TiltCard>
            </StaggerChild>

            <StaggerChild>
              <TiltCard>
                <div className="glass-card p-6 h-full">
                  <div className="text-sm text-gray-400 mb-2">Current Block Reward</div>
                  <div className="text-3xl font-bold text-charity-green">
                    <CountUp end={currentReward} decimals={2} duration={2} suffix=" POH" />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{formatPOHAmount(currentReward)}</div>
                </div>
              </TiltCard>
            </StaggerChild>

            <StaggerChild>
              <TiltCard>
                <div className="glass-card p-6 h-full">
                  <div className="text-sm text-gray-400 mb-2">Voyager Distance</div>
                  <div className="text-3xl font-bold text-accent-light">
                    <CountUp end={distanceKm} decimals={0} duration={2} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{formatDistanceKm(distanceKm)}</div>
                </div>
              </TiltCard>
            </StaggerChild>
          </div>
        </StaggerParent>
      </section>

      {/* Recent Blocks */}
      <section className="container mx-auto px-4 py-16">
        <FadeIn>
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="gradient-text-animated">Recent Blocks</span>
          </h2>
          <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12">
            The latest blocks mined on the POH network.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              {blocksLoading ? (
                <div className="py-16 text-center text-gray-400">Loading blocks...</div>
              ) : blocksError ? (
                <div className="py-16 text-center text-red-400">Error: {blocksError}</div>
              ) : recentBlocks.length === 0 ? (
                <div className="py-16 text-center text-gray-400">No blocks mined yet.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-voyager-gold">Height</th>
                      <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-voyager-gold">Solver</th>
                      <th className="px-3 sm:px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Reward</th>
                      <th className="px-3 sm:px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Mined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBlocks.map((block, index) => (
                      <tr
                        key={block.id}
                        className={`border-b border-gray-800 hover:bg-surface-light/50 transition-colors ${
                          index % 2 === 0 ? "bg-surface/30" : ""
                        }`}
                      >
                        <td className="px-3 sm:px-6 py-4 text-left font-mono text-voyager-gold">
                          #{block.height.toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-left font-mono text-gray-300 text-sm">
                          {shortenWallet(block.solver_wallet)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right text-charity-green font-semibold">
                          {block.reward_poh.toFixed(2)} POH
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right text-gray-400 text-sm">
                          {formatTimeAgo(block.mined_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Top Miners */}
      <section className="container mx-auto px-4 py-16">
        <FadeIn>
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="gradient-text-animated">Top Miners</span>
          </h2>
          <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12">
            {currentEpoch !== null
              ? `Leaderboard for Epoch ${currentEpoch} — blocks mined and POH earned.`
              : "Leaderboard — blocks mined and POH earned."}
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              {minersLoading ? (
                <div className="py-16 text-center text-gray-400">Loading miners...</div>
              ) : minersError ? (
                <div className="py-16 text-center text-red-400">Error: {minersError}</div>
              ) : topMiners.length === 0 ? (
                <div className="py-16 text-center text-gray-400">No miners this epoch yet.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-voyager-gold">Rank</th>
                      <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-voyager-gold">Wallet</th>
                      <th className="px-3 sm:px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Blocks</th>
                      <th className="px-3 sm:px-6 py-4 text-right text-sm font-semibold text-voyager-gold">POH Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMiners.map((miner, index) => (
                      <tr
                        key={miner.wallet_address}
                        className={`border-b border-gray-800 hover:bg-surface-light/50 transition-colors ${
                          index % 2 === 0 ? "bg-surface/30" : ""
                        }`}
                      >
                        <td className="px-3 sm:px-6 py-4 text-left font-bold text-voyager-gold">
                          #{miner.rank}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-left font-mono text-gray-300 text-sm">
                          {shortenWallet(miner.wallet_address)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right text-accent font-semibold">
                          {miner.blocks_mined.toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right text-charity-green font-semibold">
                          {miner.poh_earned.toFixed(2)} POH
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* RTG Decay Schedule */}
      <section className="container mx-auto px-4 py-16">
        <FadeIn>
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="gradient-text-animated">RTG Decay Schedule</span>
          </h2>
          <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12">
            POH emission follows Voyager 1's radioisotope thermoelectric generator (RTG) decay curve.
            Power output—and block rewards—decline exponentially over time.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-voyager-gold">Year</th>
                    <th className="px-3 sm:px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Annual Emission</th>
                    <th className="px-3 sm:px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Block Reward</th>
                    <th className="px-3 sm:px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Cumulative Distributed</th>
                    <th className="px-3 sm:px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Pool Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {emissionSchedule.map((row, index) => (
                    <tr
                      key={row.year}
                      className={`border-b border-gray-800 hover:bg-surface-light/50 transition-colors ${
                        index % 2 === 0 ? 'bg-surface/30' : ''
                      }`}
                    >
                      <td className="px-3 sm:px-6 py-4 text-left font-medium text-gray-200">
                        Year {row.year}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right text-gray-300">
                        {formatPOHAmount(row.annual)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right text-accent">
                        {row.blockReward.toFixed(2)} POH
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right text-charity-green">
                        {formatPOHAmount(row.cumulative)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right text-gray-400">
                        {formatPOHAmount(row.remaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <div className="text-sm text-gray-400">Rewards Pool</div>
              <div className="text-xl font-bold text-voyager-gold">{formatPOHAmount(REWARDS_POOL)}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-sm text-gray-400">Max Distributable</div>
              <div className="text-xl font-bold text-accent">{formatPOHAmount(MAX_DISTRIBUTABLE)}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-sm text-gray-400">Permanently Locked</div>
              <div className="text-xl font-bold text-charity-green">{formatPOHAmount(PERMANENTLY_LOCKED)}</div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Voyager Death Projections */}
      <section className="container mx-auto px-4 py-16">
        <FadeIn>
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="gradient-text-animated">Voyager Death Projections</span>
          </h2>
          <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12">
            NASA predicts Voyager 1 will lose power sometime between 2030-2036. Here's what happens to POH
            at different decommission scenarios.
          </p>
        </FadeIn>

        <StaggerParent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerChild>
              <TiltCard>
                <div className="glass-card p-8 h-full">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-voyager-gold mb-2">Year 5</div>
                    <div className="text-sm text-gray-400">Early Decommission</div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-500">Block Height</div>
                      <div className="text-lg font-semibold text-gray-200">
                        {formatBlockHeight(decommissionYear5.totalBlocksMined)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Distributed</div>
                      <div className="text-lg font-semibold text-charity-green">
                        {formatPOHAmount(decommissionYear5.pohDistributed)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Locked Forever</div>
                      <div className="text-lg font-semibold text-accent">
                        {formatPOHAmount(decommissionYear5.pohLockedForever)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Final Block Reward</div>
                      <div className="text-lg font-semibold text-gray-400">
                        {decommissionYear5.finalBlockReward.toFixed(2)} POH
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerChild>

            <StaggerChild>
              <TiltCard>
                <div className="glass-card p-8 h-full border-2 border-voyager-gold/30">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-voyager-gold mb-2">Year 10</div>
                    <div className="text-sm text-gray-400">Expected Decommission</div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-500">Block Height</div>
                      <div className="text-lg font-semibold text-gray-200">
                        {formatBlockHeight(decommissionYear10.totalBlocksMined)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Distributed</div>
                      <div className="text-lg font-semibold text-charity-green">
                        {formatPOHAmount(decommissionYear10.pohDistributed)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Locked Forever</div>
                      <div className="text-lg font-semibold text-accent">
                        {formatPOHAmount(decommissionYear10.pohLockedForever)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Final Block Reward</div>
                      <div className="text-lg font-semibold text-gray-400">
                        {decommissionYear10.finalBlockReward.toFixed(2)} POH
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerChild>

            <StaggerChild>
              <TiltCard>
                <div className="glass-card p-8 h-full">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-voyager-gold mb-2">Year 15</div>
                    <div className="text-sm text-gray-400">Late Decommission</div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-500">Block Height</div>
                      <div className="text-lg font-semibold text-gray-200">
                        {formatBlockHeight(decommissionYear15.totalBlocksMined)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Distributed</div>
                      <div className="text-lg font-semibold text-charity-green">
                        {formatPOHAmount(decommissionYear15.pohDistributed)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Locked Forever</div>
                      <div className="text-lg font-semibold text-accent">
                        {formatPOHAmount(decommissionYear15.pohLockedForever)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Final Block Reward</div>
                      <div className="text-lg font-semibold text-gray-400">
                        {decommissionYear15.finalBlockReward.toFixed(2)} POH
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerChild>
          </div>
        </StaggerParent>
      </section>

      {/* What Happens When Voyager Dies */}
      <section className="container mx-auto px-4 py-16">
        <FadeIn>
          <div className="glass-card p-12 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8">
              <span className="gradient-text-animated">What Happens When Voyager Dies?</span>
            </h2>

            <div className="space-y-6 text-gray-300 text-lg">
              <p>
                When NASA officially decommissions Voyager 1, the POH block system stops immediately.
                No more blocks can be mined. The emissions curve ends.
              </p>

              <p>
                Whatever POH remains undistributed in the Rewards Pool is subject to a DAO vote
                on <strong>&ldquo;The Transition&rdquo;</strong> &mdash; a one-time governance proposal
                to convert the remaining rewards into the Voyager Chase Fund.
              </p>

              <div className="bg-surface/50 rounded-lg p-6 my-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-accent mb-2">Voyager Chase Fund</div>
                    <div className="text-sm text-gray-400">
                      The DAO votes to redirect remaining rewards to fund real interstellar research.
                      Goal: send an AI-guided probe to intercept Voyager 1. The mathematically
                      unreachable ~1.54B POH acts as the seed fund from day one.
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-400 mb-2">Permanently Locked</div>
                    <div className="text-sm text-gray-400">
                      The ~1.54B POH that RTG decay math makes unreachable stays locked in the
                      contract forever &mdash; intentional scarcity that becomes the seed capital
                      for the Chase Fund.
                    </div>
                  </div>
                </div>
              </div>

              <p>
                The earlier Voyager dies, the more POH remains in the rewards pool for the Chase Fund.
                The longer it survives, the more POH gets distributed through mining.
              </p>

              <p className="text-center font-semibold text-voyager-gold pt-4">
                Either way, POH's supply becomes permanently fixed the moment Voyager goes silent.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Bottom Spacer */}
      <div className="h-32" />
    </div>
  )
}
