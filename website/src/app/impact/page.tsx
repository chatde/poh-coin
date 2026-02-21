import Link from "next/link";
import { VoyagerTracker } from "@/components/VoyagerTracker";

const TOTAL_SUPPLY = 24_526_000_000;

const allocations = [
  {
    label: "Community Rewards",
    percentage: 50,
    tokens: TOTAL_SUPPLY * 0.5,
    color: "bg-accent",
  },
  {
    label: "Charity Treasury",
    percentage: 20,
    tokens: TOTAL_SUPPLY * 0.2,
    color: "bg-charity-green",
  },
  {
    label: "Liquidity Pool",
    percentage: 15,
    tokens: TOTAL_SUPPLY * 0.15,
    color: "bg-blue-500",
  },
  {
    label: "Founder (Vesting)",
    percentage: 10,
    tokens: TOTAL_SUPPLY * 0.1,
    color: "bg-voyager-gold",
  },
  {
    label: "Airdrop",
    percentage: 5,
    tokens: TOTAL_SUPPLY * 0.05,
    color: "bg-purple-500",
  },
];

function formatTokenCount(n: number): string {
  return Math.floor(n).toLocaleString("en-US");
}

export default function ImpactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* ───────────────── Header ───────────────── */}
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Impact Dashboard
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/60">
          Every transaction makes a difference. Track our charitable impact in
          real-time.
        </p>
      </header>

      {/* ───────────────── Stats Grid ───────────────── */}
      <section className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Charity Collected */}
        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">
            Total Charity Collected
          </p>
          <p className="mt-2 text-3xl font-bold text-charity-green">$0.00</p>
          <p className="mt-1 text-xs text-foreground/40">
            Updates live from on-chain data
          </p>
        </div>

        {/* Tokens Burned */}
        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">
            Tokens Burned
          </p>
          <p className="mt-2 text-3xl font-bold text-voyager-gold">0 POH</p>
          <p className="mt-1 text-xs text-foreground/40">
            Deflationary burn from sell fees
          </p>
        </div>

        {/* Charity Distributions */}
        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">
            Charity Distributions
          </p>
          <p className="mt-2 text-3xl font-bold text-accent-light">0</p>
          <p className="mt-1 text-xs text-foreground/40">
            On-chain verified donations
          </p>
        </div>

        {/* Community Members */}
        <div className="rounded-xl border border-surface-light bg-surface p-6">
          <p className="text-sm font-medium text-foreground/50">
            Community Members
          </p>
          <p className="mt-2 text-3xl font-bold text-accent-light">0</p>
          <p className="mt-1 text-xs text-foreground/40">Growing every day</p>
        </div>
      </section>

      {/* ───────────────── Voyager Distance Section ───────────────── */}
      <section className="mb-16">
        <VoyagerTracker />
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-foreground/50">
          Our supply model mirrors Voyager 1&apos;s journey. As Voyager travels
          deeper into interstellar space, our ecosystem grows.
        </p>
      </section>

      {/* ───────────────── Recent Distributions Table ───────────────── */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Charity Distributions
        </h2>

        <div className="overflow-hidden rounded-xl border border-surface-light bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-light">
                <th className="px-6 py-4 font-medium text-foreground/50">
                  Date
                </th>
                <th className="px-6 py-4 font-medium text-foreground/50">
                  Recipient
                </th>
                <th className="px-6 py-4 font-medium text-foreground/50">
                  Amount
                </th>
                <th className="px-6 py-4 font-medium text-foreground/50">
                  Tx Hash
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-foreground/40"
                >
                  No distributions yet. The charity treasury will begin
                  distributing once the project launches on mainnet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────────── Token Allocation ───────────────── */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Token Allocation
        </h2>

        <div className="space-y-5 rounded-xl border border-surface-light bg-surface p-6 sm:p-8">
          {allocations.map((alloc) => (
            <div key={alloc.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground/80">
                  {alloc.label}
                </span>
                <span className="font-mono text-foreground/50">
                  {alloc.percentage}% &middot;{" "}
                  {formatTokenCount(alloc.tokens)} POH
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-light">
                <div
                  className={`h-full rounded-full ${alloc.color}`}
                  style={{ width: `${alloc.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── Bottom CTA ───────────────── */}
      <section className="text-center">
        <div className="rounded-xl border border-surface-light bg-surface px-6 py-12 sm:px-12">
          <p className="mx-auto max-w-xl text-lg text-foreground/70">
            Want to contribute? Buy POH and every transaction funds real-world
            impact.
          </p>
          <Link
            href="/how-to-buy"
            className="mt-6 inline-block rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light"
          >
            How to Buy POH
          </Link>
        </div>
      </section>
    </div>
  );
}
