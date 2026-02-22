"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { RPC_URL, CONTRACTS, TOKEN_ABI, formatPOH } from "@/lib/contracts";

interface WalletManagerProps {
  walletAddress: string;
  savingsWallet: string | null;
  points: number;
}

export default function WalletManager({
  walletAddress,
  savingsWallet,
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

          {/* Savings Wallet */}
          <div className="border-t border-green-900 pt-2">
            <div className="text-green-700 text-xs mb-1">
              Savings Wallet (Cold){" "}
              {savingsWallet ? (
                <span className="text-green-500">SET</span>
              ) : (
                <span className="text-yellow-500">NOT SET</span>
              )}
            </div>
            {savingsWallet ? (
              <div className="bg-black border border-green-900 rounded p-2 font-mono text-xs text-green-400 break-all select-all">
                {savingsWallet}
              </div>
            ) : (
              <div className="text-yellow-600 text-xs">
                No savings wallet set. Rewards will be held in your mining wallet.
              </div>
            )}
          </div>

          {/* How Rewards Work */}
          <div className="border-t border-green-900 pt-2">
            <div className="text-green-700 text-xs mb-1">How Rewards Work</div>
            <div className="text-green-800 text-xs space-y-1">
              <div>1. Mine (compute + fitness) and earn points each week</div>
              <div>2. Sunday: epoch closes, rewards calculated</div>
              <div>3. Monday: merkle root posted (24h timelock)</div>
              <div>4. Tuesday: claim your POH tokens</div>
              <div>5. Tokens go to savings wallet (if set)</div>
            </div>
          </div>

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
