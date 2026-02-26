"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/motion/FadeIn";

interface MinerEntry {
  wallet_address: string;
  total_points: number;
  poh_amount?: number;
}

interface ValidatorEntry {
  wallet_address: string;
  reputation: number;
  device_id: string;
}

interface RegionEntry {
  h3Cell: string;
  deviceCount: number;
}

type Tab = "miners" | "alltime" | "validators" | "regions";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("miners");
  const [epoch, setEpoch] = useState(0);
  const [topMiners, setTopMiners] = useState<MinerEntry[]>([]);
  const [allTimeMiners, setAllTimeMiners] = useState<MinerEntry[]>([]);
  const [topValidators, setTopValidators] = useState<ValidatorEntry[]>([]);
  const [topRegions, setTopRegions] = useState<RegionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setEpoch(data.epoch || 0);
          setTopMiners(data.topMiners || []);
          setAllTimeMiners(data.allTimeMiners || []);
          setTopValidators(data.topValidators || []);
          setTopRegions(data.topRegions || []);
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const truncateAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const tabs: { key: Tab; label: string }[] = [
    { key: "miners", label: "This Epoch" },
    { key: "alltime", label: "All Time" },
    { key: "validators", label: "Validators" },
    { key: "regions", label: "Regions" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 sm:px-6">
      <FadeIn>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Leaderboard
        </h1>
        <p className="text-foreground/60 mb-8">
          Epoch {epoch} — Top miners, validators, and regions in the Proof of Planet network.
        </p>
      </FadeIn>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-surface-light">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? "text-charity-green border-b-2 border-charity-green"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-foreground/50 text-center py-12">Loading leaderboard...</div>
      ) : (
        <>
          {/* This Epoch */}
          {tab === "miners" && (
            <div className="space-y-2">
              {topMiners.length === 0 ? (
                <div className="text-foreground/50 text-center py-12">
                  No mining activity this epoch yet. Be the first!
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-foreground/50 border-b border-surface-light">
                      <th className="text-left py-2 w-12">#</th>
                      <th className="text-left py-2">Miner</th>
                      <th className="text-right py-2">Points</th>
                      <th className="text-right py-2">POH Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMiners.map((miner, i) => (
                      <tr
                        key={miner.wallet_address}
                        className="border-b border-surface-light/50 hover:bg-surface/50"
                      >
                        <td className="py-2 text-foreground/50">{i + 1}</td>
                        <td className="py-2 text-foreground font-mono text-xs">
                          {truncateAddr(miner.wallet_address)}
                        </td>
                        <td className="py-2 text-right text-charity-green">
                          {miner.total_points.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-voyager-gold">
                          {miner.poh_amount
                            ? Number(miner.poh_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* All Time */}
          {tab === "alltime" && (
            <div className="space-y-2">
              {allTimeMiners.length === 0 ? (
                <div className="text-foreground/50 text-center py-12">
                  No rewards distributed yet.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-foreground/50 border-b border-surface-light">
                      <th className="text-left py-2 w-12">#</th>
                      <th className="text-left py-2">Miner</th>
                      <th className="text-right py-2">Total POH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTimeMiners.map((miner, i) => (
                      <tr
                        key={miner.wallet_address}
                        className="border-b border-surface-light/50 hover:bg-surface/50"
                      >
                        <td className="py-2 text-foreground/50">{i + 1}</td>
                        <td className="py-2 text-foreground font-mono text-xs">
                          {truncateAddr(miner.wallet_address)}
                        </td>
                        <td className="py-2 text-right text-voyager-gold">
                          {Number(miner.poh_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Validators */}
          {tab === "validators" && (
            <div className="space-y-2">
              {topValidators.length === 0 ? (
                <div className="text-foreground/50 text-center py-12">
                  No validators active yet.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-foreground/50 border-b border-surface-light">
                      <th className="text-left py-2 w-12">#</th>
                      <th className="text-left py-2">Validator</th>
                      <th className="text-right py-2">Reputation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topValidators.map((v, i) => (
                      <tr
                        key={v.device_id}
                        className="border-b border-surface-light/50 hover:bg-surface/50"
                      >
                        <td className="py-2 text-foreground/50">{i + 1}</td>
                        <td className="py-2 text-foreground font-mono text-xs">
                          {truncateAddr(v.wallet_address)}
                        </td>
                        <td className="py-2 text-right text-charity-green">
                          {v.reputation}/100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Regions */}
          {tab === "regions" && (
            <div className="space-y-2">
              {topRegions.length === 0 ? (
                <div className="text-foreground/50 text-center py-12">
                  No active regions yet.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-foreground/50 border-b border-surface-light">
                      <th className="text-left py-2 w-12">#</th>
                      <th className="text-left py-2">H3 Cell</th>
                      <th className="text-right py-2">Devices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRegions.map((r, i) => (
                      <tr
                        key={r.h3Cell}
                        className="border-b border-surface-light/50 hover:bg-surface/50"
                      >
                        <td className="py-2 text-foreground/50">{i + 1}</td>
                        <td className="py-2 text-foreground font-mono text-xs">
                          {r.h3Cell}
                        </td>
                        <td className="py-2 text-right text-charity-green">
                          {r.deviceCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
