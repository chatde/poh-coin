"use client";

import { useState, useEffect } from "react";

interface NodeCell {
  h3Cell: string;
  dataNodes: number;
  validators: number;
  total: number;
}

export default function NodeMap() {
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
        // Silently fail — map is supplementary
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
    const interval = setInterval(fetchNodes, 60_000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="border border-green-800 rounded p-3">
        <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
          Global Node Network
        </div>
        <div className="text-green-700 text-sm animate-pulse">
          Scanning network...
        </div>
      </div>
    );
  }

  const totalNodes = cells.reduce((sum, c) => sum + c.total, 0);
  const totalValidators = cells.reduce((sum, c) => sum + c.validators, 0);

  return (
    <div className="border border-green-800 rounded p-3">
      <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
        Global Node Network
      </div>

      {/* ASCII-style world "map" — simplified representation */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-green-400 text-lg font-bold">{totalNodes}</div>
          <div className="text-green-700 text-xs">NODES</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 text-lg font-bold">{totalValidators}</div>
          <div className="text-green-700 text-xs">VALIDATORS</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 text-lg font-bold">{totalCells}</div>
          <div className="text-green-700 text-xs">REGIONS</div>
        </div>
      </div>

      {/* Top active regions */}
      {cells.length > 0 && (
        <div className="mt-2">
          <div className="text-green-700 text-xs mb-1">Top Active Regions:</div>
          {cells.slice(0, 5).map((cell, i) => (
            <div key={cell.h3Cell} className="flex justify-between text-xs">
              <span className="text-green-600">
                [{String(i + 1).padStart(2, "0")}] {cell.h3Cell.slice(0, 12)}...
              </span>
              <span className="text-green-400">{cell.total} nodes</span>
            </div>
          ))}
        </div>
      )}

      {cells.length === 0 && (
        <div className="text-green-900 text-xs text-center py-4">
          No active nodes yet. Be the first!
        </div>
      )}
    </div>
  );
}
