"use client";

import { useState, useEffect, useCallback } from "react";

interface FAHStatus {
  linked: boolean;
  username: string | null;
  score: number;
  wus: number;
  bonusPoints: number;
  verified: boolean;
  lastSynced: string | null;
}

interface FAHPanelProps {
  walletAddress: string;
}

export default function FAHPanel({ walletAddress }: FAHPanelProps) {
  const [status, setStatus] = useState<FAHStatus | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch link status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/mine/fah/status?wallet=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Will retry on next render
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) fetchStatus();
  }, [walletAddress, fetchStatus]);

  const handleLink = async () => {
    if (!username.trim()) {
      setError("Enter your Folding@Home username");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/mine/fah/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          fahUsername: username.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to link account");
      } else {
        setSuccess("F@H account linked successfully!");
        setUsername("");
        fetchStatus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mine/fah/link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (res.ok) {
        setStatus(null);
        setSuccess("F@H account unlinked");
      }
    } catch {
      setError("Failed to unlink");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-green-800 rounded p-3">
      <div className="text-green-500 text-xs uppercase tracking-widest mb-3">
        Folding@Home
      </div>

      {!status?.linked ? (
        <div className="space-y-3">
          <div className="text-green-700 text-xs">
            Earn bonus mining points by running Folding@Home alongside POH.
            Your compute helps real medical research — protein folding, drug
            discovery, and more.
          </div>

          <div className="border border-green-900 rounded p-2 space-y-2">
            <div className="text-green-600 text-xs font-bold">Setup:</div>
            <div className="text-green-700 text-xs space-y-1">
              <div>
                1. <a
                  href="https://foldingathome.org/start-folding/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 underline hover:text-green-300"
                >
                  Download Folding@Home
                </a>
              </div>
              <div>2. In the F@H client, set your Team Number to: <span className="text-green-400 font-mono">TBD</span></div>
              <div>3. Enter your F@H username below to link</div>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="F@H username"
              className="w-full bg-black border border-green-800 text-green-400 py-2 px-3 rounded font-mono text-xs focus:border-green-500 focus:outline-none placeholder:text-green-900"
            />
            <button
              onClick={handleLink}
              disabled={loading}
              className="w-full border border-green-600 text-green-400 py-2 px-3 rounded font-mono text-xs hover:bg-green-900/30 transition-colors"
            >
              {loading ? "LINKING..." : "[ LINK F@H ACCOUNT ]"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex justify-between items-center">
            <div className="text-green-600 text-xs">
              <span className="text-green-400">{status.username}</span>
              {status.verified && (
                <span className="ml-2 text-green-500 border border-green-700 rounded px-1">
                  ON TEAM
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 border-t border-green-900 pt-2">
            <div className="text-center">
              <div className="text-green-400 text-sm font-mono">
                {status.score >= 1_000_000
                  ? (status.score / 1_000_000).toFixed(1) + "M"
                  : status.score >= 1_000
                  ? (status.score / 1_000).toFixed(1) + "K"
                  : status.score}
              </div>
              <div className="text-green-900 text-xs">Score</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 text-sm font-mono">{status.wus}</div>
              <div className="text-green-900 text-xs">WUs</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 text-sm font-mono">+{status.bonusPoints}</div>
              <div className="text-green-900 text-xs">Bonus</div>
            </div>
          </div>

          {status.lastSynced && (
            <div className="text-green-900 text-xs">
              Last synced: {new Date(status.lastSynced).toLocaleTimeString()}
            </div>
          )}

          <button
            onClick={handleUnlink}
            disabled={loading}
            className="text-green-900 text-xs hover:text-red-400 transition-colors"
          >
            [ UNLINK F@H ACCOUNT ]
          </button>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-xs mt-2">ERROR: {error}</div>
      )}
      {success && (
        <div className="text-green-400 text-xs mt-2">{success}</div>
      )}
    </div>
  );
}
