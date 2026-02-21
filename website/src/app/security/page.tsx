"use client";

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 sm:px-6">
          <h1 className="text-4xl font-bold text-white mb-4">
            Secure Your Tokens
          </h1>
          <p className="text-gray-300 mb-8">
            Your mining phone should never hold valuable tokens. Here's how to
            set up a secure savings wallet so your POH goes straight to cold
            storage.
          </p>

          {/* Warning */}
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
            <h3 className="text-red-400 font-bold mb-2">Important</h3>
            <p className="text-red-300 text-sm">
              Your mining phone's wallet (hot wallet) is exposed to the internet
              and vulnerable to theft. Never store large amounts of POH on it.
              Always set up a savings wallet.
            </p>
          </div>

          {/* Setup Guide */}
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Step 1: Get a Hardware Wallet
              </h2>
              <div className="bg-[var(--surface)] rounded-lg p-6 border border-gray-800">
                <p className="text-gray-300 mb-4">
                  A hardware wallet (like Ledger Nano S/X) stores your private
                  keys offline. It's the safest way to hold crypto.
                </p>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[var(--charity-green)]">1.</span>
                    Purchase a hardware wallet directly from the manufacturer (never secondhand)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--charity-green)]">2.</span>
                    Set it up following the manufacturer's instructions
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--charity-green)]">3.</span>
                    Write down your 24-word seed phrase on paper. Never digitally.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--charity-green)]">4.</span>
                    Add the Base network to your hardware wallet
                  </li>
                </ul>
                <p className="text-gray-500 text-xs mt-4">
                  Don't have a hardware wallet? A separate phone (kept offline)
                  or a MetaMask on a computer you don't carry around also works
                  as an intermediate solution.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Step 2: Set Your Savings Wallet in POH
              </h2>
              <div className="bg-[var(--surface)] rounded-lg p-6 border border-gray-800">
                <p className="text-gray-300 mb-4">
                  Tell the POH mining system to send all claimed rewards directly
                  to your hardware wallet address.
                </p>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[var(--charity-green)]">1.</span>
                    Open the mining dashboard at /mine
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--charity-green)]">2.</span>
                    During setup, enter your hardware wallet address as the "Savings Wallet"
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--charity-green)]">3.</span>
                    When you claim rewards, tokens go directly to your hardware wallet
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--charity-green)]">4.</span>
                    Your mining phone never touches the POH — it just proves your compute work
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Step 3: How Claiming Works
              </h2>
              <div className="bg-[var(--surface)] rounded-lg p-6 border border-gray-800">
                <p className="text-gray-300 mb-4">
                  Each week, the Proof of Planet system calculates your rewards
                  and creates a merkle proof. Here's the flow:
                </p>
                <div className="space-y-3 text-gray-400 text-sm">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded bg-[var(--surface-light)] flex items-center justify-center shrink-0 text-xs text-[var(--voyager-gold)]">
                      Su
                    </div>
                    <div>
                      <strong className="text-white">Sunday:</strong> Weekly epoch
                      closes. The system calculates everyone's share based on
                      points earned.
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded bg-[var(--surface-light)] flex items-center justify-center shrink-0 text-xs text-[var(--voyager-gold)]">
                      Mo
                    </div>
                    <div>
                      <strong className="text-white">Monday:</strong> Merkle root
                      is posted to the blockchain with a 24-hour timelock. Anyone
                      can verify the tree is correct.
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded bg-[var(--surface-light)] flex items-center justify-center shrink-0 text-xs text-[var(--voyager-gold)]">
                      Tu
                    </div>
                    <div>
                      <strong className="text-white">Tuesday:</strong> After 24hrs,
                      the root is activated. Claims open!
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded bg-[var(--surface-light)] flex items-center justify-center shrink-0 text-xs text-green-400">
                      Claim
                    </div>
                    <div>
                      <strong className="text-white">You claim:</strong> Your
                      mining phone signs the claim transaction. The immediate
                      portion goes straight to your savings wallet. The vesting
                      portion unlocks after 30-180 days.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Step 4: Understanding Vesting
              </h2>
              <div className="bg-[var(--surface)] rounded-lg p-6 border border-gray-800">
                <p className="text-gray-300 mb-4">
                  To protect the network, rewards are partially vested based on
                  your mining history:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[var(--background)] rounded p-4 border border-gray-700">
                    <h4 className="text-[var(--voyager-gold)] font-bold mb-2">
                      New Miners (&#60; 6 months)
                    </h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>25% immediate to savings wallet</li>
                      <li>75% vests over 180 days</li>
                      <li>After 180 days, claim the rest</li>
                    </ul>
                  </div>
                  <div className="bg-[var(--background)] rounded p-4 border border-gray-700">
                    <h4 className="text-[var(--charity-green)] font-bold mb-2">
                      Veterans (6+ months)
                    </h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>75% immediate to savings wallet</li>
                      <li>25% vests over 30 days</li>
                      <li>After 30 days, claim the rest</li>
                    </ul>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-4">
                  Vested tokens are locked in the smart contract and released
                  automatically after the vesting period. You call
                  releaseVested() to claim them.
                </p>
              </div>
            </div>
          </section>

          {/* Security Tips */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">
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
                  className="flex gap-3 text-gray-300 text-sm"
                >
                  <span className="text-[var(--charity-green)] shrink-0">
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
