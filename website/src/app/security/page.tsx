"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { BLOCK_EXPLORER, CONTRACTS, IS_MAINNET } from "@/lib/contracts";

const GOVERNOR_ADDRESS = "0x7C96Ed675033F15a53557f1d0190e00B19522e6e";
const TIMELOCK_ADDRESS = "0x64981B544a20d6933466c363dD175cA1FaD96Bb6";

const contracts = [
  { name: "POHToken", address: CONTRACTS.token },
  { name: "POHCharity", address: CONTRACTS.charity },
  { name: "POHVesting", address: CONTRACTS.vesting },
  { name: "POHRewards", address: CONTRACTS.rewards },
  { name: "POHNodeRegistry", address: CONTRACTS.registry },
  { name: "TimelockController", address: TIMELOCK_ADDRESS },
  { name: "POHGovernor", address: GOVERNOR_ADDRESS },
];

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 sm:px-6">
      <FadeIn>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Secure Your Tokens
        </h1>
        <p className="text-foreground/60 mb-8">
          Your mining phone should never hold valuable tokens. Here&apos;s how to
          set up a secure savings wallet so your POH goes straight to cold
          storage.
        </p>
      </FadeIn>

      {/* Smart Contract Security */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Smart Contract Security
        </h2>
        <div className="glass-card p-6 space-y-4">
          <p className="text-foreground/70 text-sm">
            All POH smart contracts are built on{" "}
            <strong className="text-foreground">OpenZeppelin v5</strong> battle-tested
            contracts and have passed two independent static analysis tools with
            zero critical or high-severity findings:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-charity-green/20 bg-charity-green/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-charity-green text-lg">&#10003;</span>
                <h3 className="font-semibold text-foreground">Slither Analysis</h3>
              </div>
              <p className="text-foreground/50 text-sm">
                Automated static analysis by Trail of Bits. No critical or
                high-severity vulnerabilities detected across all 7 contracts.
              </p>
            </div>
            <div className="rounded-lg border border-charity-green/20 bg-charity-green/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-charity-green text-lg">&#10003;</span>
                <h3 className="font-semibold text-foreground">Mythril Analysis</h3>
              </div>
              <p className="text-foreground/50 text-sm">
                Symbolic execution engine by ConsenSys. Zero issues detected
                across all 7 contracts. Checks for reentrancy, integer overflow,
                and more.
              </p>
            </div>
          </div>
          <p className="text-foreground/50 text-xs">
            Source code is open source at{" "}
            <a
              href="https://github.com/chatde/poh-coin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-light hover:text-accent underline underline-offset-2"
            >
              github.com/chatde/poh-coin
            </a>
            . All contracts are deployed and verified on {IS_MAINNET ? "Base mainnet" : "Base Sepolia testnet"}.
          </p>
        </div>
      </section>

      {/* Verified Contracts */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Verified Contracts on Basescan
        </h2>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-light/50">
                <th className="text-left px-4 py-3 font-medium text-foreground/50">Contract</th>
                <th className="text-left px-4 py-3 font-medium text-foreground/50">Address</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, i) => (
                <tr key={c.name} className={i < contracts.length - 1 ? "border-b border-surface-light/30" : ""}>
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`${BLOCK_EXPLORER}/address/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-accent-light hover:text-accent underline underline-offset-2 break-all"
                    >
                      {c.address}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-foreground/50 text-xs">
          All contracts are verified on {IS_MAINNET ? "Basescan" : "Base Sepolia Basescan"}. Click any address to view the full source code on-chain.
        </p>
      </section>

      {/* ─── Gradient divider ─── */}
      <div className="mb-12 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* Warning */}
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
        <h3 className="text-red-400 font-bold mb-2">Important</h3>
        <p className="text-red-300 text-sm">
          Your mining phone&apos;s wallet (hot wallet) is exposed to the internet
          and vulnerable to theft. Never store large amounts of POH on it.
          Always set up a savings wallet.
        </p>
      </div>

      {/* Setup Guide */}
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Step 1: Get a Hardware Wallet
          </h2>
          <div className="glass-card p-6">
            <p className="text-foreground/70 mb-4">
              A hardware wallet (like Ledger Nano S/X) stores your private
              keys offline. It&apos;s the safest way to hold crypto.
            </p>
            <ul className="space-y-2 text-foreground/50 text-sm">
              <li className="flex gap-2">
                <span className="text-charity-green">1.</span>
                Purchase a hardware wallet directly from the manufacturer (never secondhand)
              </li>
              <li className="flex gap-2">
                <span className="text-charity-green">2.</span>
                Set it up following the manufacturer&apos;s instructions
              </li>
              <li className="flex gap-2">
                <span className="text-charity-green">3.</span>
                Write down your 24-word seed phrase on paper. Never digitally.
              </li>
              <li className="flex gap-2">
                <span className="text-charity-green">4.</span>
                Add the Base network to your hardware wallet
              </li>
            </ul>
            <p className="text-foreground/50 text-xs mt-4">
              Don&apos;t have a hardware wallet? A separate phone (kept offline)
              or a MetaMask on a computer you don&apos;t carry around also works
              as an intermediate solution.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Step 2: Set Your Savings Wallet in POH
          </h2>
          <div className="glass-card p-6">
            <p className="text-foreground/70 mb-4">
              Tell the POH mining system to send all claimed rewards directly
              to your hardware wallet address.
            </p>
            <ul className="space-y-2 text-foreground/50 text-sm">
              <li className="flex gap-2">
                <span className="text-charity-green">1.</span>
                Open the mining dashboard at /mine
              </li>
              <li className="flex gap-2">
                <span className="text-charity-green">2.</span>
                During setup, enter your hardware wallet address as the &quot;Savings Wallet&quot;
              </li>
              <li className="flex gap-2">
                <span className="text-charity-green">3.</span>
                When you claim rewards, tokens go directly to your hardware wallet
              </li>
              <li className="flex gap-2">
                <span className="text-charity-green">4.</span>
                Your mining phone never touches the POH — it just proves your compute work
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Step 3: How Claiming Works
          </h2>
          <div className="glass-card p-6">
            <p className="text-foreground/70 mb-4">
              Each week, the Proof of Planet system calculates your rewards
              and creates a merkle proof. Here&apos;s the flow:
            </p>
            <div className="space-y-3 text-foreground/50 text-sm">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded bg-surface-light flex items-center justify-center shrink-0 text-xs text-voyager-gold">
                  Su
                </div>
                <div>
                  <strong className="text-foreground">Sunday:</strong> Weekly epoch
                  closes. The system calculates everyone&apos;s share based on
                  points earned.
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded bg-surface-light flex items-center justify-center shrink-0 text-xs text-voyager-gold">
                  Mo
                </div>
                <div>
                  <strong className="text-foreground">Monday:</strong> Merkle root
                  is posted to the blockchain with a 24-hour timelock. Anyone
                  can verify the tree is correct.
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded bg-surface-light flex items-center justify-center shrink-0 text-xs text-voyager-gold">
                  Tu
                </div>
                <div>
                  <strong className="text-foreground">Tuesday:</strong> After 24hrs,
                  the root is activated. Claims open!
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded bg-surface-light flex items-center justify-center shrink-0 text-xs text-green-400">
                  Claim
                </div>
                <div>
                  <strong className="text-foreground">You claim:</strong> Your
                  mining phone signs the claim transaction. The immediate
                  portion goes straight to your savings wallet. The vesting
                  portion unlocks after 30-180 days.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Step 4: Understanding Vesting
          </h2>
          <div className="glass-card p-6">
            <p className="text-foreground/70 mb-4">
              To protect the network, rewards are partially vested based on
              your mining history:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded p-4 border border-surface-light bg-background/50">
                <h4 className="text-voyager-gold font-bold mb-2">
                  New Miners (&#60; 6 months)
                </h4>
                <ul className="text-foreground/50 text-sm space-y-1">
                  <li>25% immediate to savings wallet</li>
                  <li>75% vests over 180 days</li>
                  <li>After 180 days, claim the rest</li>
                </ul>
              </div>
              <div className="rounded p-4 border border-surface-light bg-background/50">
                <h4 className="text-charity-green font-bold mb-2">
                  Veterans (6+ months)
                </h4>
                <ul className="text-foreground/50 text-sm space-y-1">
                  <li>75% immediate to savings wallet</li>
                  <li>25% vests over 30 days</li>
                  <li>After 30 days, claim the rest</li>
                </ul>
              </div>
            </div>
            <p className="text-foreground/50 text-xs mt-4">
              Vested tokens are locked in the smart contract and released
              automatically after the vesting period. You call
              releaseVested() to claim them.
            </p>
          </div>
        </div>
      </section>

      {/* Security Tips */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Security Best Practices
        </h2>
        <div className="space-y-3">
          {[
            "Never share your seed phrase or private key with anyone",
            "Never store seed phrases digitally (no photos, no cloud storage)",
            "Use a hardware wallet for any significant POH holdings",
            "Set up your savings wallet before claiming any rewards",
            "Verify the contract address on Basescan before interacting",
            "Be suspicious of anyone asking you to 'verify' or 'sync' your wallet",
            "POH team will never DM you first or ask for your keys",
            "If your mining phone is lost, your tokens are safe in the savings wallet",
          ].map((tip, i) => (
            <div
              key={i}
              className="flex gap-3 text-foreground/70 text-sm"
            >
              <span className="text-charity-green shrink-0">
                &#9679;
              </span>
              {tip}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
