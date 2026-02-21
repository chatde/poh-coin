"use client";

import { useState, useEffect } from "react";

interface FitnessLeader {
  wallet_address: string;
  week_effort: number;
  streak: number;
  activities: number;
}

interface FitnessLeaderboardProps {
  walletAddress: string | null;
}

export default function FitnessLeaderboard({ walletAddress }: FitnessLeaderboardProps) {
  const [leaders, setLeaders] = useState<FitnessLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    const fetchLeaders = async () => {
      try {
        const res = await fetch("/api/mine/fitness/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setLeaders(data.leaders || []);
        }
      } catch {
        // Will retry on next expand
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
    const interval = setInterval(fetchLeaders, 60_000);
    return () => clearInterval(interval);
  }, [expanded]);

  const truncateAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="border border-green-800 rounded p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center text-green-500 text-xs uppercase tracking-widest"
      >
        <span>Fitness Leaderboard</span>
        <span className="text-green-700">{expanded ? "[-]" : "[+]"}</span>
      </button>

      {expanded && (
        <div className="mt-3">
          {loading ? (
            <div className="text-green-700 text-xs animate-pulse">
              Loading leaderboard...
            </div>
          ) : leaders.length === 0 ? (
            <div className="text-green-700 text-xs">
              No fitness activity this week yet. Connect a wearable to be first!
            </div>
          ) : (
            <div className="space-y-0">
              {/* Header */}
              <div className="flex text-green-700 text-xs border-b border-green-900 pb-1 mb-1">
                <span className="w-6">#</span>
                <span className="flex-1">Miner</span>
                <span className="w-16 text-right">Effort</span>
                <span className="w-12 text-right">Streak</span>
              </div>

              {/* Rows */}
              {leaders.slice(0, 10).map((leader, i) => {
                const isMe =
                  walletAddress &&
                  leader.wallet_address.toLowerCase() === walletAddress.toLowerCase();
                return (
                  <div
                    key={leader.wallet_address}
                    className={`flex items-center text-xs py-1 ${
                      isMe
                        ? "text-green-300 bg-green-900/20"
                        : "text-green-600"
                    }`}
                  >
                    <span className="w-6 text-green-700">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-mono">
                      {truncateAddr(leader.wallet_address)}
                      {isMe && (
                        <span className="text-green-400 ml-1">(you)</span>
                      )}
                    </span>
                    <span className="w-16 text-right text-green-400 font-mono">
                      {Math.round(leader.week_effort).toLocaleString()}
                    </span>
                    <span className="w-12 text-right font-mono">
                      {leader.streak > 0 ? `${leader.streak}d` : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
