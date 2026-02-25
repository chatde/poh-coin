"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { RPC_URL, CONTRACTS, TOKEN_ABI, formatPOH, BLOCK_EXPLORER } from "@/lib/contracts";

interface WalletManagerProps {
  walletAddress: string;
  savingsWallet: string | null;
  points: number;
}

interface UnclaimedReward {
  epoch: number;
  poh_amount: string;
  claimable_now: string;
  vesting_amount: string;
  claimed: boolean;
  merkle_proof: string[];
}

export default function WalletManager({
  walletAddress,
  savingsWallet: initialSavingsWallet,
  points,
}: WalletManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [keyConfirmed, setKeyConfirmed] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [pohBalance, setPohBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Cold wallet state
  const [savingsWallet, setSavingsWallet] = useState<string | null>(initialSavingsWallet);
  const [editingSavings, setEditingSavings] = useState(false);
  const [savingsInput, setSavingsInput] = useState(initialSavingsWallet || "");
  const [savingsError, setSavingsError] = useState<string | null>(null);
  const [savingsSaved, setSavingsSaved] = useState(false);

  // Claim/payout state
  const [unclaimed, setUnclaimed] = useState<UnclaimedReward[]>([]);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<string | null>(null);

  // Epoch explainer
  const [showEpochInfo, setShowEpochInfo] = useState(false);

  // Load mnemonic from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("poh-mnemonic");
    if (stored) setMnemonic(stored);
  }, []);

  // Fetch POH balance from chain
  useEffect(() => {
    if (!walletAddress) return;

    const fetchBalance = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const token = new ethers.Contract(CONTRACTS.token, TOKEN_ABI, provider);
        const bal: bigint = await token.balanceOf(walletAddress);
        setPohBalance(formatPOH(bal, 2));
      } catch {
        setPohBalance("--");
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 60_000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  // Fetch unclaimed rewards
  useEffect(() => {
    if (!walletAddress) return;

    const fetchRewards = async () => {
      try {
        const res = await fetch(`/api/rewards?address=${walletAddress}`);
        if (res.ok) {
          const data = await res.json();
          setUnclaimed(data.unclaimed || []);
          setTotalUnclaimed(data.totalUnclaimed || 0);
        }
      } catch {
        // Will retry
      }
    };

    fetchRewards();
    const interval = setInterval(fetchRewards, 60_000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  // Derive private key from mnemonic
  const derivePrivateKey = useCallback(() => {
    if (!mnemonic) return null;
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      return wallet.privateKey;
    } catch {
      return null;
    }
  }, [mnemonic]);

  const handleShowPhrase = () => {
    if (!phraseConfirmed) {
      setShowPhrase(true);
      return;
    }
    setShowPhrase(!showPhrase);
  };

  const handleShowKey = () => {
    if (!keyConfirmed) {
      setShowKey(true);
      return;
    }
    if (!privateKey) {
      const key = derivePrivateKey();
      setPrivateKey(key);
    }
    setShowKey(!showKey);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback: select text
    }
  };

  // Save cold wallet
  const handleSaveSavingsWallet = () => {
    const trimmed = savingsInput.trim();
    setSavingsError(null);
    setSavingsSaved(false);

    if (!trimmed) {
      // Clear savings wallet
      localStorage.removeItem("poh-savings-wallet");
      setSavingsWallet(null);
      setEditingSavings(false);
      setSavingsSaved(true);
      setTimeout(() => setSavingsSaved(false), 2000);
      return;
    }

    if (!ethers.isAddress(trimmed)) {
      setSavingsError("Invalid Ethereum address. Must start with 0x and be 42 characters.");
      return;
    }

    if (trimmed.toLowerCase() === walletAddress.toLowerCase()) {
      setSavingsError("Savings wallet must be different from your mining wallet.");
      return;
    }

    localStorage.setItem("poh-savings-wallet", trimmed);
    setSavingsWallet(trimmed);
    setEditingSavings(false);
    setSavingsSaved(true);
    setTimeout(() => setSavingsSaved(false), 3000);
  };

  // Manual claim / payout
  const handleClaim = async () => {
    if (!mnemonic || unclaimed.length === 0) return;

    setClaiming(true);
    setClaimResult(null);

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

      // Claim each unclaimed epoch
      const rewardsContract = new ethers.Contract(
        CONTRACTS.rewards,
        [
          "function claim(uint256 epoch, uint256 amount, bytes32[] calldata proof) external",
        ],
        wallet
      );

      let claimedCount = 0;
      for (const reward of unclaimed) {
        try {
          const tx = await rewardsContract.claim(
            reward.epoch,
            ethers.parseEther(reward.poh_amount),
            reward.merkle_proof
          );
          await tx.wait();
          claimedCount++;
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          if (errorMsg.includes("already claimed")) continue;
          throw err;
        }
      }

      setClaimResult(`Claimed ${claimedCount} epoch${claimedCount !== 1 ? "s" : ""} successfully.`);

      // Refresh rewards
      const res = await fetch(`/api/rewards?address=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        setUnclaimed(data.unclaimed || []);
        setTotalUnclaimed(data.totalUnclaimed || 0);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("timelock")) {
        setClaimResult("Rewards are still in timelock. Check back Tuesday.");
      } else if (errorMsg.includes("insufficient funds")) {
        setClaimResult("Not enough ETH for gas. Send a small amount of ETH to your mining wallet.");
      } else {
        setClaimResult("Claim failed. Try again later or check your ETH balance for gas.");
      }
    } finally {
      setClaiming(false);
    }
  };

  // Manual send to cold wallet
  const handleSendToSavings = async () => {
    if (!mnemonic || !savingsWallet) return;

    setClaiming(true);
    setClaimResult(null);

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);
      const token = new ethers.Contract(
        CONTRACTS.token,
        [...TOKEN_ABI, "function transfer(address to, uint256 amount) returns (bool)"],
        wallet
      );

      const balance: bigint = await token.balanceOf(walletAddress);
      if (balance === BigInt(0)) {
        setClaimResult("No POH balance to send.");
        setClaiming(false);
        return;
      }

      const tx = await token.transfer(savingsWallet, balance);
      await tx.wait();

      setClaimResult(`Sent ${formatPOH(balance, 2)} POH to your savings wallet.`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("insufficient funds")) {
        setClaimResult("Not enough ETH for gas. Send ETH to your mining wallet first.");
      } else {
        setClaimResult("Transfer failed. Check ETH balance for gas fees.");
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="border border-green-800 rounded p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center text-green-500 text-xs uppercase tracking-widest"
      >
        <span>Wallet</span>
        <span className="text-green-700">{expanded ? "[-]" : "[+]"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Wallet Address */}
          <div>
            <div className="text-green-700 text-xs mb-1">Mining Wallet (Hot)</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black border border-green-900 rounded p-2 font-mono text-xs text-green-400 break-all select-all">
                {walletAddress}
              </div>
              <button
                onClick={() => handleCopy(walletAddress, "address")}
                className="text-green-600 text-xs hover:text-green-400 transition-colors shrink-0"
              >
                {copied === "address" ? "OK" : "COPY"}
              </button>
            </div>
          </div>

          {/* POH Balance */}
          <div className="border-t border-green-900 pt-2">
            <div className="flex justify-between items-baseline">
              <div className="text-green-700 text-xs">POH Balance</div>
              <div className="text-green-400 text-lg font-mono">
                {pohBalance ?? "..."}
              </div>
            </div>
            <div className="text-green-900 text-xs mt-1">
              Points this epoch: <span className="text-green-400">{points}</span>
            </div>
          </div>

          {/* ── Savings / Cold Wallet (Editable) ── */}
          <div className="border-t border-green-900 pt-2">
            <div className="flex justify-between items-center mb-1">
              <div className="text-green-700 text-xs">
                Savings Wallet (Cold){" "}
                {savingsWallet ? (
                  <span className="text-green-500">SET</span>
                ) : (
                  <span className="text-yellow-500">NOT SET</span>
                )}
              </div>
              {!editingSavings && (
                <button
                  onClick={() => {
                    setSavingsInput(savingsWallet || "");
                    setEditingSavings(true);
                    setSavingsError(null);
                  }}
                  className="text-green-600 text-xs hover:text-green-400 transition-colors"
                >
                  {savingsWallet ? "[ EDIT ]" : "[ ADD ]"}
                </button>
              )}
            </div>

            {editingSavings ? (
              <div className="space-y-2">
                <div className="text-green-800 text-xs">
                  Enter your cold wallet address on <strong className="text-yellow-500">Base network</strong> (MetaMask, Ledger, etc). Claimed rewards will be sent here.
                </div>
                <input
                  type="text"
                  value={savingsInput}
                  onChange={(e) => {
                    setSavingsInput(e.target.value);
                    setSavingsError(null);
                  }}
                  placeholder="0x..."
                  className="w-full bg-black border border-green-900 rounded p-2 font-mono text-xs text-green-400 placeholder-green-900 focus:border-green-600 focus:outline-none"
                  spellCheck={false}
                  autoComplete="off"
                />
                {savingsError && (
                  <div className="text-red-400 text-xs">{savingsError}</div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSavingsWallet}
                    className="border border-green-500 text-green-400 py-1.5 px-3 rounded font-mono text-xs hover:bg-green-900/20 transition-colors"
                  >
                    [ SAVE ]
                  </button>
                  <button
                    onClick={() => {
                      setEditingSavings(false);
                      setSavingsError(null);
                    }}
                    className="text-green-700 text-xs hover:text-green-400 transition-colors"
                  >
                    [ CANCEL ]
                  </button>
                  {savingsWallet && (
                    <button
                      onClick={() => {
                        setSavingsInput("");
                        handleSaveSavingsWallet();
                      }}
                      className="text-red-600 text-xs hover:text-red-400 transition-colors ml-auto"
                    >
                      [ REMOVE ]
                    </button>
                  )}
                </div>
              </div>
            ) : savingsWallet ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black border border-green-900 rounded p-2 font-mono text-xs text-green-400 break-all select-all">
                  {savingsWallet}
                </div>
                <button
                  onClick={() => handleCopy(savingsWallet, "savings")}
                  className="text-green-600 text-xs hover:text-green-400 transition-colors shrink-0"
                >
                  {copied === "savings" ? "OK" : "COPY"}
                </button>
              </div>
            ) : (
              <div className="text-yellow-600 text-xs">
                No savings wallet set. Add your cold wallet on <strong className="text-yellow-500">Base network</strong> (Ledger, MetaMask, etc.)
                to automatically receive claimed rewards to a secure address.
              </div>
            )}
            {savingsSaved && (
              <div className="text-green-400 text-xs mt-1">Saved.</div>
            )}
          </div>

          {/* ── Claim & Payout ── */}
          <div className="border-t border-green-900 pt-2">
            <div className="text-green-500 text-xs uppercase tracking-widest mb-2">
              Claim & Payout
            </div>

            {/* Unclaimed rewards summary */}
            <div className="flex justify-between items-baseline mb-2">
              <div className="text-green-700 text-xs">Unclaimed Rewards</div>
              <div className="text-green-400 font-mono text-sm">
                {totalUnclaimed > 0 ? `${totalUnclaimed.toLocaleString()} POH` : "0 POH"}
              </div>
            </div>

            {unclaimed.length > 0 && (
              <div className="space-y-1 mb-3">
                {unclaimed.slice(0, 5).map((r) => (
                  <div key={r.epoch} className="flex justify-between text-xs">
                    <span className="text-green-800">Epoch {r.epoch}</span>
                    <span className="text-green-600 font-mono">{Number(r.poh_amount).toLocaleString()} POH</span>
                  </div>
                ))}
                {unclaimed.length > 5 && (
                  <div className="text-green-900 text-xs">+ {unclaimed.length - 5} more epochs</div>
                )}
              </div>
            )}

            {/* Claim button */}
            {mnemonic && unclaimed.length > 0 && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full border border-green-500 text-green-400 py-2 px-3 rounded font-mono text-xs hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
              >
                {claiming ? "[ CLAIMING... ]" : `[ CLAIM ${unclaimed.length} EPOCH${unclaimed.length !== 1 ? "S" : ""} ]`}
              </button>
            )}

            {/* Send to savings wallet button */}
            {mnemonic && savingsWallet && (
              <button
                onClick={handleSendToSavings}
                disabled={claiming}
                className="w-full border border-blue-700 text-blue-400 py-2 px-3 rounded font-mono text-xs hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
              >
                {claiming ? "[ SENDING... ]" : "[ SEND ALL POH TO SAVINGS WALLET ]"}
              </button>
            )}

            {/* No mnemonic = external wallet */}
            {!mnemonic && unclaimed.length > 0 && (
              <div className="text-yellow-600 text-xs">
                Using an external wallet. Claim your rewards through the{" "}
                <a href={`${BLOCK_EXPLORER}/address/${CONTRACTS.rewards}`} target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">
                  rewards contract
                </a>{" "}
                directly, or import your wallet into MetaMask.
              </div>
            )}

            {/* Claim result message */}
            {claimResult && (
              <div className={`text-xs mt-2 ${claimResult.includes("failed") || claimResult.includes("Not enough") ? "text-red-400" : "text-green-400"}`}>
                {claimResult}
              </div>
            )}

            {unclaimed.length === 0 && (
              <div className="text-green-800 text-xs">
                No unclaimed rewards. Keep mining to earn POH this epoch.
              </div>
            )}
          </div>

          {/* ── What Is An Epoch? ── */}
          <div className="border-t border-green-900 pt-2">
            <button
              onClick={() => setShowEpochInfo(!showEpochInfo)}
              className="w-full flex justify-between items-center"
            >
              <div className="text-green-500 text-xs uppercase tracking-widest">
                What Is An Epoch?
              </div>
              <span className="text-green-700 text-xs">{showEpochInfo ? "[-]" : "[+]"}</span>
            </button>

            {showEpochInfo && (
              <div className="mt-3 space-y-3">
                <div className="text-green-600 text-xs leading-relaxed">
                  An <span className="text-green-400 font-bold">epoch</span> is a one-week
                  mining cycle. Think of it like a pay period &mdash; you work (mine) all
                  week, and at the end of the week your earnings are calculated and paid out.
                </div>

                <div className="bg-black border border-green-900 rounded p-3 space-y-2">
                  <div className="text-green-500 text-xs font-bold mb-2">How Your Rewards Are Calculated:</div>

                  <div className="flex gap-2">
                    <span className="text-green-700 text-xs shrink-0 w-4">1.</span>
                    <div className="text-green-600 text-xs">
                      <span className="text-green-400">Mine all week</span> &mdash; Your phone
                      solves compute tasks and tracks fitness. Each completed task and workout
                      earns you points.
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-green-700 text-xs shrink-0 w-4">2.</span>
                    <div className="text-green-600 text-xs">
                      <span className="text-green-400">Sunday: epoch closes</span> &mdash; The
                      system adds up everyone&rsquo;s points. Your share of the weekly POH pool
                      = your points &divide; total network points.
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-green-700 text-xs shrink-0 w-4">3.</span>
                    <div className="text-green-600 text-xs">
                      <span className="text-green-400">Monday: rewards posted</span> &mdash; A
                      merkle tree is built with everyone&rsquo;s rewards. It goes into a 24-hour
                      security timelock.
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-green-700 text-xs shrink-0 w-4">4.</span>
                    <div className="text-green-600 text-xs">
                      <span className="text-green-400">Tuesday: claim your POH</span> &mdash; After
                      the timelock passes, you can claim. Hit the &ldquo;Claim&rdquo; button above
                      or interact with the contract directly.
                    </div>
                  </div>
                </div>

                <div className="bg-black border border-green-900 rounded p-3 space-y-2">
                  <div className="text-green-500 text-xs font-bold mb-2">What Affects Your Reward Size:</div>

                  <div className="text-green-600 text-xs flex items-start gap-2">
                    <span className="text-voyager-gold shrink-0">+</span>
                    <span><span className="text-green-400">Compute tasks</span> &mdash; More tasks solved = more points</span>
                  </div>
                  <div className="text-green-600 text-xs flex items-start gap-2">
                    <span className="text-voyager-gold shrink-0">+</span>
                    <span><span className="text-green-400">Fitness effort</span> &mdash; Harder workouts with higher heart rate zones earn more</span>
                  </div>
                  <div className="text-green-600 text-xs flex items-start gap-2">
                    <span className="text-voyager-gold shrink-0">+</span>
                    <span><span className="text-green-400">Streak bonus</span> &mdash; 7+ consecutive days = +10%, 30+ days = +25%</span>
                  </div>
                  <div className="text-green-600 text-xs flex items-start gap-2">
                    <span className="text-voyager-gold shrink-0">+</span>
                    <span><span className="text-green-400">Quality bonus</span> &mdash; Verified high-quality work earns +25%</span>
                  </div>
                  <div className="text-green-600 text-xs flex items-start gap-2">
                    <span className="text-red-600 shrink-0">-</span>
                    <span><span className="text-green-400">Multiple devices</span> &mdash; More devices per wallet = diminishing returns (prevents farming)</span>
                  </div>
                  <div className="text-green-600 text-xs flex items-start gap-2">
                    <span className="text-red-600 shrink-0">-</span>
                    <span><span className="text-green-400">New miner ramp</span> &mdash; First 4 weeks: trust builds from 25% to 100%</span>
                  </div>
                </div>

                <div className="bg-black border border-green-900 rounded p-3">
                  <div className="text-green-500 text-xs font-bold mb-2">Weekly Pool Size:</div>
                  <div className="text-green-600 text-xs leading-relaxed">
                    The total POH available each epoch comes from the annual emission, which
                    starts at <span className="text-green-400">536 million POH/year</span> and
                    decreases 5% annually &mdash; modeled after Voyager 1&rsquo;s RTG power
                    decay. Early miners earn more because the pool is shared among fewer people.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── How Rewards Work (Quick Summary) ── */}
          <div className="border-t border-green-900 pt-2">
            <div className="text-green-700 text-xs mb-1">Reward Cycle</div>
            <div className="text-green-800 text-xs space-y-1">
              <div>1. Mine (compute + fitness) and earn points each week</div>
              <div>2. Sunday: epoch closes, rewards calculated</div>
              <div>3. Monday: merkle root posted (24h timelock)</div>
              <div>4. Tuesday: claim your POH tokens</div>
              <div>5. Tokens go to savings wallet (if set)</div>
            </div>
          </div>

          {/* Recovery Phrase */}
          {mnemonic && (
            <div className="border-t border-green-900 pt-2">
              {!phraseConfirmed && showPhrase ? (
                <div className="space-y-2">
                  <div className="border border-yellow-800 rounded p-2">
                    <div className="text-yellow-500 text-xs font-bold mb-1">
                      WARNING — NEVER SHARE THIS
                    </div>
                    <div className="text-yellow-700 text-xs">
                      Your recovery phrase gives full access to your wallet.
                      Anyone who sees it can steal your tokens. Never share it
                      with anyone, including Project POH support.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPhraseConfirmed(true);
                    }}
                    className="w-full border border-yellow-600 text-yellow-400 py-2 px-3 rounded font-mono text-xs hover:bg-yellow-900/20 transition-colors"
                  >
                    [ I UNDERSTAND — SHOW PHRASE ]
                  </button>
                  <button
                    onClick={() => setShowPhrase(false)}
                    className="w-full text-green-700 text-xs hover:text-green-400 transition-colors"
                  >
                    [ CANCEL ]
                  </button>
                </div>
              ) : phraseConfirmed && showPhrase ? (
                <div className="space-y-2">
                  <div className="text-green-700 text-xs mb-1">Recovery Phrase (12 words)</div>
                  <div className="grid grid-cols-3 gap-1 bg-black border border-green-900 rounded p-2">
                    {mnemonic.split(" ").map((word, i) => (
                      <div key={i} className="text-xs font-mono">
                        <span className="text-green-900">{i + 1}.</span>{" "}
                        <span className="text-green-400">{word}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(mnemonic, "phrase")}
                      className="text-green-600 text-xs hover:text-green-400 transition-colors"
                    >
                      {copied === "phrase" ? "COPIED" : "[ COPY PHRASE ]"}
                    </button>
                    <button
                      onClick={() => setShowPhrase(false)}
                      className="text-green-600 text-xs hover:text-green-400 transition-colors"
                    >
                      [ HIDE ]
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleShowPhrase}
                  className="w-full border border-green-700 text-green-600 py-2 px-3 rounded font-mono text-xs hover:bg-green-900/20 transition-colors"
                >
                  [ VIEW RECOVERY PHRASE ]
                </button>
              )}
            </div>
          )}

          {/* Export Private Key */}
          {mnemonic && (
            <div className="border-t border-green-900 pt-2">
              {!keyConfirmed && showKey ? (
                <div className="space-y-2">
                  <div className="border border-yellow-800 rounded p-2">
                    <div className="text-yellow-500 text-xs font-bold mb-1">
                      WARNING — PRIVATE KEY
                    </div>
                    <div className="text-yellow-700 text-xs">
                      Your private key gives full control of your wallet.
                      Only export it to import into another wallet like MetaMask.
                      Never paste it into any website or share it.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setKeyConfirmed(true);
                      const key = derivePrivateKey();
                      setPrivateKey(key);
                    }}
                    className="w-full border border-yellow-600 text-yellow-400 py-2 px-3 rounded font-mono text-xs hover:bg-yellow-900/20 transition-colors"
                  >
                    [ I UNDERSTAND — SHOW KEY ]
                  </button>
                  <button
                    onClick={() => setShowKey(false)}
                    className="w-full text-green-700 text-xs hover:text-green-400 transition-colors"
                  >
                    [ CANCEL ]
                  </button>
                </div>
              ) : keyConfirmed && showKey && privateKey ? (
                <div className="space-y-2">
                  <div className="text-green-700 text-xs mb-1">Private Key</div>
                  <div className="bg-black border border-green-900 rounded p-2 font-mono text-xs text-green-400 break-all select-all">
                    {privateKey}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(privateKey, "key")}
                      className="text-green-600 text-xs hover:text-green-400 transition-colors"
                    >
                      {copied === "key" ? "COPIED" : "[ COPY KEY ]"}
                    </button>
                    <button
                      onClick={() => {
                        setShowKey(false);
                        setPrivateKey(null);
                      }}
                      className="text-green-600 text-xs hover:text-green-400 transition-colors"
                    >
                      [ HIDE ]
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleShowKey}
                  className="w-full border border-green-700 text-green-600 py-2 px-3 rounded font-mono text-xs hover:bg-green-900/20 transition-colors"
                >
                  [ EXPORT PRIVATE KEY ]
                </button>
              )}
            </div>
          )}

          {/* Backup warning for users who haven't saved phrase */}
          {!mnemonic && (
            <div className="border border-green-900 rounded p-2">
              <div className="text-green-700 text-xs">
                Using an external wallet (MetaMask). Manage keys in your wallet app.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
