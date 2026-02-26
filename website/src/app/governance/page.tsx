"use client";

import { FadeIn } from "@/components/motion/FadeIn";

export default function GovernancePage() {
  return (
    <div className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <FadeIn>
          <header className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-accent-light sm:text-5xl">
              Governance
            </h1>
            <p className="mt-4 text-lg text-foreground/50">
              Token-weighted voting for community decisions
            </p>
          </header>
        </FadeIn>

        {/* ── Governance Overview ── */}
        <Section id="overview" title="Governance Overview">
          <p>
            POH uses <strong>OpenZeppelin Governor</strong> for fully on-chain
            governance. Token holders can create proposals, vote on them, and
            execute approved changes &mdash; no off-chain signatures or
            centralised approvals required.
          </p>
          <ul className="mt-6 list-disc space-y-3 pl-6 marker:text-accent-light">
            <li>
              <strong>4% quorum</strong> &mdash; at least 4% of total supply
              must participate for a vote to be valid.
            </li>
            <li>
              <strong>7-day voting period</strong> &mdash; every proposal
              remains open for a full week, giving holders around the world
              time to review and vote.
            </li>
            <li>
              <strong>48-hour timelock</strong> &mdash; after a vote passes,
              execution is delayed by 48 hours so the community can verify the
              outcome before changes take effect.
            </li>
            <li>
              <strong>0.1% proposal threshold</strong> &mdash; creating a
              proposal requires holding at least 24.5&nbsp;M POH (0.1% of
              total supply), preventing spam while keeping the bar accessible.
            </li>
          </ul>
        </Section>

        {/* ── How It Works ── */}
        <Section id="how-it-works" title="How It Works">
          <div className="grid gap-6 sm:grid-cols-2">
            <StepCard
              step="1"
              title="Delegate"
              description="Delegate your voting power to yourself or a trusted representative. You must delegate before you can vote — even to yourself."
            />
            <StepCard
              step="2"
              title="Propose"
              description="Create a proposal with on-chain calldata. Requires holding at least 0.1% of total supply (24.5M POH)."
            />
            <StepCard
              step="3"
              title="Vote"
              description="Cast your vote: For, Against, or Abstain. Your voting power equals your delegated token balance at the proposal snapshot block."
            />
            <StepCard
              step="4"
              title="Execute"
              description="After the vote passes and the 48-hour timelock expires, anyone can trigger execution. Changes take effect on-chain automatically."
            />
          </div>
        </Section>

        {/* ── What Can Be Governed ── */}
        <Section id="scope" title="What Can Be Governed">
          <ul className="list-disc space-y-3 pl-6 marker:text-accent-light">
            <li>
              <strong>Charity treasury distributions</strong> &mdash; amounts,
              recipients, and disbursement schedules
            </li>
            <li>
              <strong>Fee adjustments</strong> &mdash; buy, sell, and transfer
              fee rates
            </li>
            <li>
              <strong>Anti-whale limits</strong> &mdash; max wallet and max
              transaction thresholds
            </li>
            <li>
              <strong>Validator slashing decisions</strong> &mdash; penalising
              dishonest or unreliable validators
            </li>
            <li>
              <strong>Protocol upgrades and parameter changes</strong> &mdash;
              contract migrations, new module deployments, and configuration
              updates
            </li>
          </ul>
        </Section>

        {/* ── Current Parameters ── */}
        <Section id="parameters" title="Current Parameters">
          <div className="glass-card overflow-x-auto p-6">
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
                <Row label="Voting Delay" value="~1 day (7,200 blocks)" />
                <Row label="Voting Period" value="~7 days (50,400 blocks)" />
                <Row
                  label="Proposal Threshold"
                  value="24,526,000 POH (0.1%)"
                />
                <Row label="Quorum" value="4% of total supply" />
                <Row label="Timelock" value="48 hours" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Where to Vote ── */}
        <Section id="where-to-vote" title="Where to Vote">
          <div className="glass-card p-8 text-center">
            <p className="text-lg font-medium text-foreground/90">
              POH governance uses{" "}
              <strong className="text-accent-light">Tally</strong>, the
              leading governance front-end for on-chain DAOs. Connect your
              wallet, view proposals, and cast your vote.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="https://www.tally.xyz/gov/project-poh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-light px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-105"
              >
                Vote on Tally
              </a>
            </div>
            <p className="mt-4 text-foreground/50 text-xs">
              Once the POH Governor is registered on Tally, you can view all
              proposals, delegate voting power, and vote directly from the
              Tally interface. You can also use the governance contracts
              directly via Basescan.
            </p>
          </div>
        </Section>

        {/* ── Governance Contracts ── */}
        <Section id="contracts" title="Governance Contracts">
          <div className="glass-card overflow-x-auto p-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-light">
                  <th className="py-3 pr-4 font-semibold text-accent-light">Contract</th>
                  <th className="py-3 font-semibold text-accent-light">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-light text-foreground/80">
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">POHGovernor</td>
                  <td className="py-3">
                    <a href="https://basescan.org/address/0x7C96Ed675033F15a53557f1d0190e00B19522e6e" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-accent-light underline underline-offset-2 hover:text-accent break-all">
                      0x7C96Ed675033F15a53557f1d0190e00B19522e6e
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">TimelockController</td>
                  <td className="py-3">
                    <a href="https://basescan.org/address/0x64981B544a20d6933466c363dD175cA1FaD96Bb6" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-accent-light underline underline-offset-2 hover:text-accent break-all">
                      0x64981B544a20d6933466c363dD175cA1FaD96Bb6
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">POHToken (voting power)</td>
                  <td className="py-3">
                    <a href="https://basescan.org/address/0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-accent-light underline underline-offset-2 hover:text-accent break-all">
                      0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Progressive Decentralization ── */}
        <Section id="decentralization" title="Progressive Decentralization">
          <p>
            POH follows a three-phase transition from founder control to full
            community ownership. This graduated approach ensures early
            operational agility while building toward complete
            decentralisation.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <PhaseCard
              phase="Phase 1"
              title="Founder-Governed"
              status="current"
              description="The founder proposes charity distributions with a 24-hour timelock. All actions are on-chain and publicly verifiable. Emergency pause capability is retained for critical vulnerabilities."
            />
            <PhaseCard
              phase="Phase 2"
              title="Community Advisory"
              description="A council of elected token holders reviews and approves proposals before execution. Veto power transitions to the community. The founder retains operational authority but cannot override council vetoes."
            />
            <PhaseCard
              phase="Phase 3"
              title="Full DAO"
              description="Governance transitions entirely to token-weighted voting. POH holders vote directly on all treasury decisions, protocol changes, and parameter updates. The founder becomes one vote among many."
            />
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
      <div className="mb-8 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
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

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent-light">
          {step}
        </span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-foreground/70">
        {description}
      </p>
    </div>
  );
}

function PhaseCard({
  phase,
  title,
  status,
  description,
}: {
  phase: string;
  title: string;
  status?: "current";
  description: string;
}) {
  return (
    <div className="glass-card p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent-light">
        {phase}
        {status === "current" && (
          <span className="ml-2 rounded bg-voyager-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-voyager-gold">
            Current
          </span>
        )}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground/70">
        {description}
      </p>
    </div>
  );
}
