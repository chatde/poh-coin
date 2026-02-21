import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whitepaper — Project POH",
  description:
    "The full Project POH whitepaper: tokenomics, the Voyager model, supply allocation, fee rationale, security, and roadmap.",
};

export default function WhitepaperPage() {
  return (
    <div className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-accent-light sm:text-5xl">
            Project POH Whitepaper
          </h1>
          <p className="mt-4 text-lg text-foreground/50">Version 1.0</p>
        </header>

        {/* ── Mission ── */}
        <Section id="mission" title="Mission">
          <blockquote className="border-l-4 border-voyager-gold pl-6 text-xl font-medium italic leading-relaxed text-foreground/90">
            Change the trajectory of humankind by creating the most trusted
            charity crypto ecosystem on the planet.
          </blockquote>
        </Section>

        {/* ── The Voyager Model ── */}
        <Section id="voyager-model" title="The Voyager Model">
          <p>
            Project POH ties its entire token supply to one of humanity&rsquo;s
            greatest achievements: <strong className="text-voyager-gold">Voyager&nbsp;1</strong>,
            the farthest human-made object from Earth.
          </p>
          <ul className="mt-6 list-disc space-y-3 pl-6 marker:text-accent-light">
            <li>
              <strong>Total supply&nbsp;&mdash; 24,526,000,000 POH</strong> is
              permanently locked to Voyager&nbsp;1&rsquo;s distance from the Sun
              in kilometres at the moment of the token&rsquo;s conceptual
              launch.
            </li>
            <li>
              <strong>Annual emissions of ~536&nbsp;M tokens</strong> mirror
              Voyager&rsquo;s cruising speed of approximately 17&nbsp;km/s,
              translating its relentless outward journey into a predictable token
              release schedule.
            </li>
            <li>
              <strong>Year&nbsp;1 inflation: ~2.18%</strong>, declining
              asymptotically toward 0% as the fixed emission becomes a smaller
              fraction of the growing circulating supply.
            </li>
            <li>
              This creates a{" "}
              <strong>naturally deflationary model</strong> conceptually similar
              to Bitcoin&rsquo;s halvings but with a smoother, continuous curve
              &mdash; no sudden supply shocks, just a steady march outward.
            </li>
          </ul>
        </Section>

        {/* ── Tokenomics ── */}
        <Section id="tokenomics" title="Tokenomics">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-light">
                  <th className="py-3 pr-4 font-semibold text-accent-light">
                    Parameter
                  </th>
                  <th className="py-3 font-semibold text-accent-light">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-light text-foreground/80">
                <Row label="Max Supply" value="24,526,000,000 POH" />
                <Row label="Decimals" value="18" />
                <Row label="Network" value="Base (Coinbase L2)" />
                <Row
                  label="Buy Fee"
                  value="1% (0.5% charity + 0.5% liquidity)"
                />
                <Row
                  label="Sell Fee"
                  value="3% (1.5% charity + 1% burn + 0.5% liquidity)"
                />
                <Row label="Transfer Fee" value="0.5% (charity)" />
                <Row label="Max Wallet" value="2% of supply" />
                <Row label="Max Transaction" value="1% of supply" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Supply Allocation ── */}
        <Section id="supply-allocation" title="Supply Allocation">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-light">
                  <th className="py-3 pr-4 font-semibold text-accent-light">
                    Allocation
                  </th>
                  <th className="py-3 pr-4 font-semibold text-accent-light">
                    Share
                  </th>
                  <th className="py-3 pr-4 font-semibold text-accent-light">
                    Tokens
                  </th>
                  <th className="py-3 font-semibold text-accent-light">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-light text-foreground/80">
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">
                    Community Rewards
                  </td>
                  <td className="py-3 pr-4">50%</td>
                  <td className="py-3 pr-4 font-mono text-sm">12.263B</td>
                  <td className="py-3">Released over 10+ years</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">
                    Charity Treasury
                  </td>
                  <td className="py-3 pr-4">20%</td>
                  <td className="py-3 pr-4 font-mono text-sm">4.905B</td>
                  <td className="py-3">
                    Governed by founder then DAO
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">
                    Liquidity Pool
                  </td>
                  <td className="py-3 pr-4">15%</td>
                  <td className="py-3 pr-4 font-mono text-sm">3.679B</td>
                  <td className="py-3">Uniswap on Base</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">
                    Founder
                  </td>
                  <td className="py-3 pr-4">10%</td>
                  <td className="py-3 pr-4 font-mono text-sm">2.453B</td>
                  <td className="py-3">
                    4-year vesting, 6-month cliff
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">
                    Airdrop / Marketing
                  </td>
                  <td className="py-3 pr-4">5%</td>
                  <td className="py-3 pr-4 font-mono text-sm">1.226B</td>
                  <td className="py-3">&mdash;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Fee Rationale ── */}
        <Section id="fee-rationale" title="Fee Rationale">
          <ul className="list-disc space-y-3 pl-6 marker:text-accent-light">
            <li>
              <strong>Low buy fee (1%)</strong> encourages entry and lowers the
              barrier for new holders who want to support charitable causes.
            </li>
            <li>
              <strong>Higher sell fee (3%)</strong> discourages short-term
              dumping while channelling a larger share of proceeds to the charity
              treasury.
            </li>
            <li>
              <strong>Burn on sells (1%)</strong> permanently removes tokens from
              circulation, making POH deflationary over time and rewarding
              long-term holders.
            </li>
            <li>
              <strong>Transfer fee (0.5%)</strong> ensures that even
              peer-to-peer transfers contribute to the charity mission, closing a
              common fee-avoidance loophole.
            </li>
          </ul>
        </Section>

        {/* ── Security ── */}
        <Section id="security" title="Security">
          <ul className="list-disc space-y-3 pl-6 marker:text-accent-light">
            <li>
              Built on{" "}
              <strong>OpenZeppelin v5 battle-tested contracts</strong> &mdash;
              the industry gold standard for Solidity security.
            </li>
            <li>
              <strong>Emergency pause capability</strong> is retained during the
              early phases under a progressive decentralisation plan, ensuring
              the team can react to critical vulnerabilities.
            </li>
            <li>
              All contract source code is{" "}
              <strong>open source and verified on Basescan</strong> so anyone can
              audit the on-chain logic.
            </li>
            <li>
              <strong>Slither static analysis passed</strong> &mdash; automated
              vulnerability scanning confirms no high-severity findings.
            </li>
          </ul>
        </Section>

        {/* ── Roadmap ── */}
        <Section id="roadmap" title="Roadmap">
          <ol className="relative border-l-2 border-surface-light pl-8">
            <RoadmapPhase
              phase="Phase 1"
              title="Smart Contracts + Testnet"
              status="complete"
            />
            <RoadmapPhase
              phase="Phase 2"
              title="Website + Community"
              status="active"
            />
            <RoadmapPhase
              phase="Phase 3"
              title="Mainnet Launch on Base"
            />
            <RoadmapPhase
              phase="Phase 4"
              title="Proof of Impact v1 (Partner-Verified)"
            />
            <RoadmapPhase
              phase="Phase 5"
              title="DAO Governance Transition"
            />
            <RoadmapPhase
              phase="Phase 6"
              title="Proof of Impact v2 (AI-Verified)"
              last
            />
          </ol>
        </Section>

        {/* ── Legal Disclaimer ── */}
        <Section id="disclaimer" title="Legal Disclaimer">
          <div className="rounded-lg border border-surface-light bg-surface p-6 text-sm leading-relaxed text-foreground/60">
            POH is a utility token used to participate in charitable giving. It
            is not an investment, and no financial returns are promised. This is
            not financial advice. Consult a licensed attorney before making any
            decisions.
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ──────────────────────────── Sub-components ──────────────────────────── */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16">
      <h2 className="mb-6 text-2xl font-bold text-accent-light sm:text-3xl">
        {title}
      </h2>
      <div className="space-y-4 text-base leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-3 pr-4 font-medium text-foreground">{label}</td>
      <td className="py-3 font-mono text-sm">{value}</td>
    </tr>
  );
}

function RoadmapPhase({
  phase,
  title,
  status,
  last,
}: {
  phase: string;
  title: string;
  status?: "complete" | "active";
  last?: boolean;
}) {
  const dotColor =
    status === "complete"
      ? "bg-charity-green"
      : status === "active"
        ? "bg-voyager-gold animate-pulse"
        : "bg-surface-light";

  return (
    <div className={`relative ${last ? "" : "pb-10"}`}>
      {/* Dot on the timeline */}
      <span
        className={`absolute -left-[1.3rem] top-1 h-4 w-4 rounded-full border-2 border-background ${dotColor}`}
      />
      <p className="text-xs font-semibold uppercase tracking-widest text-accent-light">
        {phase}
        {status === "complete" && (
          <span className="ml-2 rounded bg-charity-green/20 px-2 py-0.5 text-[10px] font-bold uppercase text-charity-green">
            Complete
          </span>
        )}
      </p>
      <p className="mt-1 text-base font-medium text-foreground">{title}</p>
    </div>
  );
}
