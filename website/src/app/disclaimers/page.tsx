import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Disclaimers — Project POH",
  description:
    "Legal disclaimers, risk warnings, and regulatory notices for Project POH, a charity cryptocurrency on the Base network.",
};

const disclaimers = [
  {
    id: "not-financial-advice",
    number: 1,
    title: "Not Financial Advice",
    content: (
      <>
        <p>
          Nothing on this website, in the Project POH whitepaper, or in any
          communication from the Project POH team constitutes financial advice,
          investment advice, trading advice, or any other sort of professional
          advice. You should not treat any of the content presented here as such.
        </p>
        <p>
          POH tokens are <strong>not an investment</strong>. No promise,
          guarantee, or representation of future returns, profits, or price
          appreciation is made or implied. The purchase of POH tokens should be
          considered a charitable contribution to the ecosystem, not a financial
          investment.
        </p>
        <p>
          You are strongly encouraged to conduct your own research and consult
          with a qualified, licensed financial advisor before making any
          financial decisions.
        </p>
      </>
    ),
  },
  {
    id: "token-classification",
    number: 2,
    title: "Token Classification",
    content: (
      <>
        <p>
          POH is a <strong>utility and charity token</strong> designed to
          facilitate charitable giving through blockchain technology. POH is{" "}
          <strong>not a security</strong>, equity, share, bond, derivative, or
          any other regulated financial instrument.
        </p>
        <p>
          Holding POH tokens does not grant the holder any ownership stake,
          dividend rights, revenue share, voting rights (except as explicitly
          provided through future DAO governance mechanisms), or any claim to
          the assets, intellectual property, or revenues of Project POH or its
          affiliates.
        </p>
        <p>
          The classification of tokens varies across jurisdictions. Project POH
          makes no representation regarding the regulatory classification of POH
          tokens in any particular jurisdiction.
        </p>
      </>
    ),
  },
  {
    id: "risk-warning",
    number: 3,
    title: "Risk Warning",
    content: (
      <>
        <p>
          Cryptocurrency and digital assets are inherently{" "}
          <strong>volatile and high-risk</strong>. The value of POH tokens may
          fluctuate significantly and{" "}
          <strong>you may lose your entire contribution</strong>. Past
          performance of any cryptocurrency is not indicative of future results.
        </p>
        <ul className="mt-4 space-y-2 pl-1">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-voyager-gold" />
            Token prices can drop to zero with no possibility of recovery.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-voyager-gold" />
            Market conditions, regulatory changes, or technical failures can
            cause sudden and severe losses.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-voyager-gold" />
            Liquidity may be limited, meaning you may not be able to sell tokens
            at any given time.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-voyager-gold" />
            Only participate with funds you can afford to lose entirely.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "no-guarantees",
    number: 4,
    title: "No Guarantees",
    content: (
      <>
        <p>
          Project POH makes <strong>no guarantees</strong> regarding:
        </p>
        <ul className="mt-4 space-y-2 pl-1">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            The current or future value of POH tokens
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            The availability of liquidity on any decentralised or centralised
            exchange
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            Listing on any centralised exchange (CEX) at any time
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            The continued operation of the Base network or any third-party
            infrastructure
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            The completion of any items on the project roadmap
          </li>
        </ul>
        <p className="mt-4">
          The project roadmap is aspirational and subject to change. Features,
          timelines, and deliverables may be modified, delayed, or cancelled at
          the sole discretion of the project team.
        </p>
      </>
    ),
  },
  {
    id: "regulatory",
    number: 5,
    title: "Regulatory Compliance",
    content: (
      <>
        <p>
          Cryptocurrency regulations{" "}
          <strong>vary significantly by jurisdiction</strong> and are rapidly
          evolving. It is your sole responsibility to determine whether your
          purchase, holding, or use of POH tokens is lawful in your jurisdiction.
        </p>
        <p>
          Project POH does not make any representations regarding the legality
          of POH tokens in any jurisdiction. Some jurisdictions may restrict or
          prohibit the purchase, sale, or use of cryptocurrency tokens. By
          acquiring POH tokens, you represent and warrant that you have
          determined that doing so is lawful in your jurisdiction.
        </p>
        <p>
          Project POH reserves the right to restrict access to the website or
          token functionality for users in jurisdictions where doing so is
          required by law.
        </p>
      </>
    ),
  },
  {
    id: "charity-disclaimer",
    number: 6,
    title: "Charity Disclaimer",
    content: (
      <>
        <p>
          Charitable distributions from the Project POH treasury are made at the{" "}
          <strong>
            discretion of the treasury governance structure
          </strong>{" "}
          (initially the founder, transitioning to a DAO). While the project is
          committed to its charitable mission, specific charity distributions
          are <strong>not guaranteed</strong>.
        </p>
        <ul className="mt-4 space-y-2 pl-1">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-charity-green" />
            The timing, amount, and recipients of charitable donations are
            determined by the governing body.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-charity-green" />
            Project POH is not a registered charity or non-profit organisation
            in any jurisdiction.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-charity-green" />
            Purchasing POH tokens does not entitle you to a tax deduction for
            charitable contributions.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-charity-green" />
            The &ldquo;Proof of Impact&rdquo; system is designed to provide
            transparency, but verified impact reporting is still in development.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "smart-contract-risk",
    number: 7,
    title: "Smart Contract Risk",
    content: (
      <>
        <p>
          The POH smart contracts are built on OpenZeppelin v5 battle-tested
          libraries and have undergone Slither static analysis. However, the
          contracts have <strong>not been formally audited</strong> by a
          third-party security firm. They are community-reviewed only.
        </p>
        <p>
          Smart contracts may contain bugs, vulnerabilities, or unexpected
          behaviours that could result in the{" "}
          <strong>partial or total loss of your tokens</strong>. By interacting
          with POH smart contracts, you acknowledge and accept these risks.
        </p>
        <ul className="mt-4 space-y-2 pl-1">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-voyager-gold" />
            All contract source code is open source and verified on Basescan.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-voyager-gold" />
            You interact with the smart contracts entirely at your own risk.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-voyager-gold" />
            Project POH is not liable for any losses arising from smart contract
            interactions, including but not limited to exploits, bugs, or
            network failures.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "tax-responsibility",
    number: 8,
    title: "Tax Responsibility",
    content: (
      <>
        <p>
          You are <strong>solely responsible</strong> for determining and
          fulfilling any tax obligations arising from your purchase, sale,
          transfer, or holding of POH tokens. Tax treatment of cryptocurrency
          varies by jurisdiction and is subject to change.
        </p>
        <p>
          Project POH does not provide tax advice and does not report
          transactions to any tax authority on your behalf. You should consult a
          qualified tax professional regarding the tax implications of your
          cryptocurrency activities.
        </p>
      </>
    ),
  },
  {
    id: "age-restriction",
    number: 9,
    title: "Age Restriction",
    content: (
      <>
        <p>
          You must be at least <strong>18 years of age</strong>, or the legal
          age of majority in your jurisdiction (whichever is higher), to
          purchase, hold, or interact with POH tokens.
        </p>
        <p>
          By accessing this website and interacting with POH tokens, you
          represent and warrant that you meet the minimum age requirement in your
          jurisdiction. Project POH reserves the right to request proof of age
          at any time.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    number: 10,
    title: "Changes to These Disclaimers",
    content: (
      <>
        <p>
          Project POH reserves the right to{" "}
          <strong>modify, update, or replace</strong> these disclaimers at any
          time without prior notice. Changes take effect immediately upon
          publication on this website.
        </p>
        <p>
          It is your responsibility to review these disclaimers periodically.
          Your continued use of the website or interaction with POH tokens after
          any changes constitutes your acceptance of the updated disclaimers.
        </p>
        <p className="mt-4 text-sm text-foreground/40">
          Last updated: February 2026
        </p>
      </>
    ),
  },
];

export default function DisclaimersPage() {
  return (
    <div className="bg-background">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-surface-light">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_60%)] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Legal{" "}
            <span className="text-accent-light">Disclaimers</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-foreground/60">
            Please read these disclaimers carefully before interacting with
            Project POH or purchasing POH tokens.
          </p>
        </div>
      </section>

      {/* Important Notice Banner */}
      <section className="mx-auto max-w-4xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-voyager-gold/30 bg-voyager-gold/5 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mt-0.5 h-6 w-6 shrink-0 text-voyager-gold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-voyager-gold">
                Important Notice
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                POH is a utility and charity token on the Base network. It is
                not an investment, security, or financial product. No returns
                are promised or implied. Cryptocurrency is volatile and you may
                lose your entire contribution. By purchasing or holding POH
                tokens, you acknowledge that you have read, understood, and
                agreed to all disclaimers on this page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="mx-auto max-w-4xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-surface-light bg-surface p-6 sm:p-8">
          <h2 className="mb-4 text-lg font-semibold text-accent-light">
            Contents
          </h2>
          <ol className="grid gap-2 sm:grid-cols-2">
            {disclaimers.map((d) => (
              <li key={d.id}>
                <a
                  href={`#${d.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/60 transition-colors hover:bg-surface-light hover:text-accent-light"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-light text-xs font-semibold text-foreground/50">
                    {d.number}
                  </span>
                  {d.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Disclaimer Sections */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-10">
          {disclaimers.map((d) => (
            <div
              key={d.id}
              id={d.id}
              className="scroll-mt-24 rounded-xl border border-surface-light bg-surface p-6 shadow-lg shadow-black/20 sm:p-8"
            >
              <div className="mb-5 flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface text-sm font-bold text-accent-light shadow-lg shadow-accent/10">
                  {d.number}
                </span>
                <h2 className="text-xl font-semibold text-accent-light sm:text-2xl">
                  {d.title}
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-foreground/70 sm:text-base">
                {d.content}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact / Questions */}
      <section className="border-t border-surface-light bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Questions?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-foreground/50">
            If you have questions about these disclaimers or Project POH,
            please reach out to the community through our official channels.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/whitepaper"
              className="inline-flex items-center gap-2 rounded-lg border border-surface-light bg-background px-6 py-3 text-sm font-semibold text-foreground/70 transition-colors hover:border-accent hover:text-accent-light"
            >
              Read the Whitepaper
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-light hover:shadow-accent-light/20"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
