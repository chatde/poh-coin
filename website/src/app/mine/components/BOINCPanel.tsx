"use client";

import { useState, useEffect } from 'react';
import type { BOINCData } from '@/lib/boinc-data';

interface BOINCPanelProps {
  walletAddress: string;
}

export default function BOINCPanel({ walletAddress }: BOINCPanelProps) {
  const [isLinked, setIsLinked] = useState(false);
  const [cpidInput, setCpidInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [boincData, setBoincData] = useState<BOINCData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load BOINC status on mount
  useEffect(() => {
    if (walletAddress) {
      loadBOINCStatus();
    }
  }, [walletAddress]);

  const loadBOINCStatus = async () => {
    try {
      const response = await fetch(`/api/mine/boinc/status?address=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.linked) {
          setIsLinked(true);
          setBoincData(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load BOINC status:', err);
    }
  };

  const handleLink = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/mine/boinc/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          cpid: cpidInput.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsLinked(true);
        setBoincData(result.data);
        setCpidInput('');
      } else {
        setError(result.error || 'Failed to link BOINC account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('BOINC link error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCredit = (credit: number): string => {
    return credit.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const calculateBonus = (totalCredit: number): number => {
    return Math.floor(totalCredit * 10);
  };

  return (
    <div className="border border-green-800 bg-black/40 p-6 rounded-lg">
      <h3 className="text-green-400 text-xl font-mono mb-4">
        BOINC Integration
      </h3>

      {!isLinked ? (
        <div className="space-y-4">
          <p className="text-green-400/80 text-sm font-mono">
            Link your BOINC account to earn bonus POH points
          </p>

          <div className="space-y-2">
            <label className="block text-green-400 text-sm font-mono">
              Cross-Project ID (CPID)
            </label>
            <input
              type="text"
              value={cpidInput}
              onChange={(e) => setCpidInput(e.target.value)}
              placeholder="Enter your 32-character CPID"
              className="w-full bg-black border border-green-800 text-green-400 px-3 py-2 rounded font-mono text-sm focus:outline-none focus:border-green-600"
              maxLength={32}
              disabled={loading}
            />
            <p className="text-green-400/60 text-xs font-mono">
              Find your CPID on any BOINC project account page under &quot;Cross-project ID&quot;
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-3 py-2 rounded text-sm font-mono">
              {error}
            </div>
          )}

          <button
            onClick={handleLink}
            disabled={loading || cpidInput.trim().length !== 32}
            className="w-full bg-green-900/40 border border-green-800 text-green-400 px-4 py-2 rounded font-mono hover:bg-green-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Linking...' : 'Link BOINC Account'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {boincData && (
            <>
              <div className="bg-green-900/20 border border-green-800 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400 font-mono text-sm">Total BOINC Credits:</span>
                  <span className="text-green-400 font-mono font-bold">
                    {formatCredit(boincData.totalCredit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-mono text-sm">POH Bonus:</span>
                  <span className="text-green-400 font-mono font-bold">
                    {formatCredit(calculateBonus(boincData.totalCredit))} POH
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-green-400 font-mono text-sm mb-2">Active Projects:</h4>
                {boincData.projects.map((project, idx) => (
                  <div
                    key={idx}
                    className="bg-black/60 border border-green-800/50 p-3 rounded"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-green-400 font-mono text-sm font-bold">
                          {project.name}
                        </div>
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400/60 font-mono text-xs hover:text-green-400 transition-colors"
                        >
                          {project.url}
                        </a>
                      </div>
                      <div className="text-green-400 font-mono text-sm text-right">
                        {formatCredit(project.credit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-green-400/60 text-xs font-mono">
                Last synced: {new Date(boincData.lastSynced).toLocaleString()}
              </p>

              <div className="text-green-400/80 text-xs font-mono pt-2 border-t border-green-800">
                <p>✓ CPID: {boincData.cpid}</p>
                <p className="mt-1">Earn 10 POH per BOINC credit</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
