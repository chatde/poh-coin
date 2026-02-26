"use client";

import { useState } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const faqSections: FaqSection[] = [
  {
    title: "General",
    items: [
      {
        question: "What is Project POH?",
        answer: (
          <p>
            Project POH (Pursuit of Happiness) is a charity cryptocurrency on the Base network.
            Every transaction automatically funds environmental, humanitarian, educational, and health
            causes. The tokenomics are tied to NASA&apos;s Voyager 1 spacecraft &mdash; the max supply
            equals Voyager&apos;s distance from Earth in kilometers, and new blocks are mined as
            Voyager travels deeper into interstellar space.
          </p>
        ),
      },
      {
        question: "Is this a scam or rug pull?",
        answer: (
          <div className="space-y-3">
            <p>
              No. POH is designed with multiple anti-rug-pull protections hardcoded into the smart contracts:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>LP tokens are burned permanently &mdash; liquidity can never be pulled</li>
              <li>Founder tokens are locked in a 4-year vesting contract with a 6-month cliff</li>
              <li>Charity wallet is a smart contract with a 48-hour timelock, not an externally-owned account</li>
              <li>All contracts are verified on Basescan and open source on GitHub</li>
              <li>Contracts have been analyzed by Slither and Mythril (automated security tools)</li>
            </ul>
            <p>
              That said, smart contracts have not been formally audited by a third-party firm.
              Always do your own research.
            </p>
          </div>
        ),
      },
      {
        question: "Where does the charity money actually go?",
        answer: (
          <div className="space-y-3">
            <p>
              Transaction fees (1% buy, 3% sell, 0.5% transfer) are collected in the POHCharity
              smart contract. Distributions require a 48-hour timelock and are fully visible on-chain.
              Target causes include animal rescue, environmental sustainability, medical research,
              and humanitarian aid.
            </p>
            <p>
              You can track all charity activity on the{" "}
              <Link href="/impact" className="text-accent-light hover:underline">Impact Dashboard</Link>.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Mining",
    items: [
      {
        question: "How does mining work?",
        answer: (
          <div className="space-y-3">
            <p>
              POH uses &quot;Proof of Planet&quot; mining. Your device runs two parallel Web Workers:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A science worker that solves real computational tasks (protein folding, climate modeling)</li>
              <li>A block equation worker that solves the current block&apos;s mathematical challenge</li>
            </ul>
            <p>
              When both are solved, you earn POH based on your contribution quality, device trust score,
              and the current block reward (which decays 5% annually, mirroring Voyager&apos;s RTG power decay).
            </p>
          </div>
        ),
      },
      {
        question: "Can I mine on my phone?",
        answer: (
          <p>
            Yes! POH is designed for phone mining. The mining app runs in your browser &mdash; no app
            store download needed. It includes automatic thermal management to protect your device.
            You can also mine on any computer with a modern browser.
          </p>
        ),
      },
      {
        question: "What is fitness mining?",
        answer: (
          <p>
            If you connect your Strava account, your physical activities (running, cycling, swimming, etc.)
            earn bonus POH. The system converts your effort into mining rewards, encouraging healthy living
            while earning tokens. You can connect and disconnect Strava at any time from the mining dashboard.
          </p>
        ),
      },
      {
        question: "How much POH can I earn?",
        answer: (
          <p>
            Earnings depend on several factors: your device&apos;s compute performance, trust score
            (built over time), mining streak bonuses, geographic diversity, and fitness activity.
            Block rewards start high and decay 5% annually. The earlier you start mining, the more
            you can earn per block.
          </p>
        ),
      },
    ],
  },
  {
    title: "Token",
    items: [
      {
        question: "How do I buy POH?",
        answer: (
          <p>
            POH is available on Uniswap (Base network). You need ETH on the Base network to swap for POH.
            See our step-by-step{" "}
            <Link href="/how-to-buy" className="text-accent-light hover:underline">How to Buy guide</Link>{" "}
            for detailed instructions.
          </p>
        ),
      },
      {
        question: "What are the transaction fees?",
        answer: (
          <div className="space-y-3">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Buy fee:</strong> 1% (goes to charity)</li>
              <li><strong>Sell fee:</strong> 3% (split between charity and liquidity)</li>
              <li><strong>Transfer fee:</strong> 0.5% (minimal friction for peer-to-peer transfers)</li>
            </ul>
            <p>
              All fees are hardcoded in the smart contract and cannot be changed by anyone.
            </p>
          </div>
        ),
      },
      {
        question: "What is the total supply?",
        answer: (
          <p>
            The initial supply is 24,526,000,000 POH &mdash; equal to Voyager 1&apos;s distance from Earth
            in kilometers at launch. Additional POH is minted through mining (1 block per 1,000 km of
            Voyager travel). When Voyager 1&apos;s instruments go silent (estimated ~2025&ndash;2030),
            new block creation stops forever.
          </p>
        ),
      },
    ],
  },
  {
    title: "Charity",
    items: [
      {
        question: "How is charity funding transparent?",
        answer: (
          <p>
            All charity funds are held in the POHCharity smart contract on-chain. Every distribution
            requires a 48-hour timelock, giving the community time to review. All transactions are
            publicly visible on Basescan. Nothing happens off-chain or behind closed doors.
          </p>
        ),
      },
      {
        question: "What happens when Voyager 1 goes silent?",
        answer: (
          <div className="space-y-3">
            <p>
              When NASA confirms Voyager 1&apos;s instruments have gone silent, new block creation stops
              permanently. The remaining unmined POH is locked forever. However, the token continues to
              exist and trade &mdash; it becomes a fixed-supply asset. Charity funding continues from
              transaction fees on existing supply.
            </p>
            <p>
              This design creates a &quot;Voyager Chase Fund&quot; &mdash; a portion of charity
              allocation dedicated to interstellar exploration, honoring Voyager&apos;s legacy.
            </p>
          </div>
        ),
      },
      {
        question: "Is Project POH a registered charity?",
        answer: (
          <p>
            Not yet. Project POH is currently a community-driven token project. We are planning to
            establish a 501(c)(3) nonprofit organization to formalize the charity arm. Until then,
            charity distributions are governed by the smart contract&apos;s timelock mechanism and
            community governance.
          </p>
        ),
      },
    ],
  },
  {
    title: "Governance",
    items: [
      {
        question: "How does governance work?",
        answer: (
          <p>
            POH uses an on-chain DAO with token-weighted voting. POH holders can create and vote on
            proposals through the Governor contract. The system uses a Timelock contract for execution
            delay, ensuring the community has time to review decisions. Governance is progressively
            decentralizing as the community grows.
          </p>
        ),
      },
      {
        question: "Can the founder change the smart contracts?",
        answer: (
          <p>
            The core token contract is immutable &mdash; fees, supply, and charity allocation cannot be
            changed. The charity distribution mechanism has a 48-hour timelock for transparency. Ownership
            is planned to transfer to the Timelock/DAO, removing any single point of control.
          </p>
        ),
      },
    ],
  },
  {
    title: "Technical",
    items: [
      {
        question: "What blockchain is POH on?",
        answer: (
          <p>
            POH is on <strong>Base</strong> (Chain ID 8453), a Layer 2 network built on Ethereum by Coinbase.
            Base offers low gas fees (typically under $0.01), fast transactions, and the security of Ethereum
            settlement. This makes POH accessible to everyone, not just crypto veterans.
          </p>
        ),
      },
      {
        question: "Are the smart contracts audited?",
        answer: (
          <p>
            Smart contracts have been analyzed with Slither and Mythril, two industry-standard automated
            security analysis tools &mdash; no vulnerabilities were found. However, the contracts have
            not been formally audited by a third-party security firm. All contract source code is
            verified on Basescan and open source on GitHub for independent review.
          </p>
        ),
      },
      {
        question: "What is the contract address?",
        answer: (
          <p>
            The POH token contract on Base mainnet is:{" "}
            <code className="rounded bg-surface-light px-1.5 py-0.5 text-xs font-mono text-voyager-gold">
              0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07
            </code>
            . Always verify on our official website or Basescan before interacting.
          </p>
        ),
      },
    ],
  },
];

function ChevronIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Accordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-surface-light last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-foreground transition-colors hover:text-accent-light"
        aria-expanded={open}
      >
        <span>{item.question}</span>
        <ChevronIcon className="h-5 w-5 shrink-0 text-foreground/50" open={open} />
      </button>
      {open && (
        <div className="pb-5 text-sm leading-relaxed text-foreground/70">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="bg-background">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_60%)] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <FadeIn>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Frequently Asked{" "}
              <span className="text-accent-light">Questions</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-foreground/60">
              Everything you need to know about Project POH, mining, charity, and governance.
            </p>
          </FadeIn>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </section>

      {/* FAQ Sections */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="space-y-12">
          {faqSections.map((section) => (
            <FadeIn key={section.title}>
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent-light">
                  {section.title}
                </h2>
                <div className="rounded-xl border border-surface-light bg-surface/50 px-6">
                  {section.items.map((item) => (
                    <Accordion key={item.question} item={item} />
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* CTA */}
      <section className="bg-gradient-to-b from-background to-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Still have questions?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-foreground/50">
            Join our community on Discord or reach out on Twitter. We&apos;re happy to help.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://discord.com/invite/4P3bjZRsz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:shadow-accent-light/20 hover:scale-105"
            >
              Join Discord
            </a>
            <a
              href="https://x.com/projectpoh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-foreground backdrop-blur-sm transition-all hover:border-accent-light hover:text-accent-light"
            >
              Follow on X
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
