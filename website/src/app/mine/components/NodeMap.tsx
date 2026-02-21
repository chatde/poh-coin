"use client";

import { useState, useEffect } from "react";

interface NodeCell {
  h3Cell: string;
  dataNodes: number;
  validators: number;
  total: number;
}

interface NodeMapProps {
  deviceId: string | null;
  walletAddress: string | null;
}

export default function NodeMap({ deviceId, walletAddress }: NodeMapProps) {
  const [cells, setCells] = useState<NodeCell[]>([]);
  const [totalCells, setTotalCells] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await fetch("/api/data/nodes");
        if (res.ok) {
          const data = await res.json();
          setCells(data.cells || []);
          setTotalCells(data.totalCells || 0);
        }
      } catch {
        // Supplementary data — fail silently
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
    const interval = setInterval(fetchNodes, 60_000);
    return () => clearInterval(interval);
  }, []);

  const totalNodes = cells.reduce((sum, c) => sum + c.total, 0);
  const totalValidators = cells.reduce((sum, c) => sum + c.validators, 0);

  return (
    <div className="space-y-4">
      {/* Your Node Status */}
      <div className="border border-green-800 rounded p-3">
        <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
          Your Node
        </div>
        {deviceId ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-600">STATUS</span>
              <span className="text-green-400">ACTIVE</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">TYPE</span>
              <span className="text-green-400">DATA NODE</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">DEVICE</span>
              <span className="text-green-400 font-mono">{deviceId.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">WALLET</span>
              <span className="text-green-400 font-mono">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-green-900 text-xs">Not registered</div>
        )}
      </div>

      {/* Network Stats */}
      <div className="border border-green-800 rounded p-3">
        <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
          Network
        </div>
        {loading ? (
          <div className="text-green-700 text-sm animate-pulse">Scanning...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="text-green-400 text-lg font-bold">{totalNodes || 1}</div>
                <div className="text-green-700 text-xs">NODES</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 text-lg font-bold">{totalValidators}</div>
                <div className="text-green-700 text-xs">VALIDATORS</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 text-lg font-bold">{totalCells || 1}</div>
                <div className="text-green-700 text-xs">REGIONS</div>
              </div>
            </div>

            {cells.length > 0 && (
              <div className="mt-2">
                <div className="text-green-700 text-xs mb-1">Active Regions:</div>
                {cells.slice(0, 3).map((cell, i) => (
                  <div key={cell.h3Cell} className="flex justify-between text-xs">
                    <span className="text-green-600">
                      [{String(i + 1).padStart(2, "0")}] {cell.h3Cell.slice(0, 12)}...
                    </span>
                    <span className="text-green-400">{cell.total} nodes</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
