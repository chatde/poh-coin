"use client"

import { FadeIn } from "@/components/motion/FadeIn"
import { CountUp } from "@/components/motion/CountUp"
import { TiltCard } from "@/components/motion/TiltCard"
import { ParallaxSection } from "@/components/motion/ParallaxSection"
import { StaggerParent, StaggerChild } from "@/components/motion/StaggerChildren"
import { getBlockHeight, getBlocksPerDay } from "@/lib/voyager"
import { getBlockReward, getEmissionSchedule, getDecommissionState, formatPOHAmount, REWARDS_POOL, MAX_DISTRIBUTABLE, PERMANENTLY_LOCKED } from "@/lib/block-rewards"
import { getVoyagerDistanceKm, formatDistanceKm, formatBlockHeight } from "@/lib/voyager"

export default function BlockExplorerPage() {
  const currentBlock = getBlockHeight()
  const blocksPerDay = getBlocksPerDay()
  const currentReward = getBlockReward()
  const distanceKm = getVoyagerDistanceKm()
  const emissionSchedule = getEmissionSchedule()

  const decommissionYear5 = getDecommissionState(5)
  const decommissionYear10 = getDecommissionState(10)
  const decommissionYear15 = getDecommissionState(15)

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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-voyager-gold">Year</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Annual Emission</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Block Reward</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Cumulative Distributed</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-voyager-gold">Pool Remaining</th>
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
                      <td className="px-6 py-4 text-left font-medium text-gray-200">
                        Year {row.year}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        {formatPOHAmount(row.annual)}
                      </td>
                      <td className="px-6 py-4 text-right text-accent">
                        {row.blockReward.toFixed(2)} POH
                      </td>
                      <td className="px-6 py-4 text-right text-charity-green">
                        {formatPOHAmount(row.cumulative)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
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
            NASA predicts Voyager 1 will lose power sometime between 2025-2030. Here's what happens to POH
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
                Whatever POH remains undistributed in the Rewards Pool gets split into two parts:
              </p>

              <div className="bg-surface/50 rounded-lg p-6 my-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-accent mb-2">50% → Voyager Chase Fund</div>
                    <div className="text-sm text-gray-400">
                      Unlocked and available for the community to use in pursuit of Voyager 1.
                      This fund can support interstellar missions, space tech R&D, or other ventures
                      that continue humanity's reach into the cosmos.
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-400 mb-2">50% → Locked Forever</div>
                    <div className="text-sm text-gray-400">
                      Permanently removed from circulation. Burned. A tribute to the probe that gave
                      us the stars—and to the emissions curve we'll never get back.
                    </div>
                  </div>
                </div>
              </div>

              <p>
                The earlier Voyager dies, the larger the Chase Fund. The longer it survives, the more POH
                gets distributed through mining—and the less remains for the final split.
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
