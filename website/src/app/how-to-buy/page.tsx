import type { Metadata } from "next";
import { FadeIn } from "@/components/motion/FadeIn";
import { CONTRACTS } from "@/lib/contracts";

export const metadata: Metadata = {
  title: "How to Buy POH — Project POH",
  description:
    "A beginner-friendly guide to purchasing Pursuit of Happiness tokens on the Base network.",
};

const networkDetails = [
  { label: "Network Name", value: "Base" },
  { label: "RPC URL", value: "https://mainnet.base.org" },
  { label: "Chain ID", value: "8453" },
  { label: "Currency Symbol", value: "ETH" },
  { label: "Block Explorer", value: "https://basescan.org" },
];

const steps = [
  {
    number: 1,
    title: "Set Up a Wallet",
    content: (
      <>
        <ul className="space-y-3 text-foreground/70">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            Install the{" "}
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-light underline decoration-accent-light/30 underline-offset-2 transition-colors hover:text-accent"
            >
              MetaMask
            </a>{" "}
            browser extension
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            Create a new wallet or import an existing one
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            Save your seed phrase securely &mdash; never share it with anyone
          </li>
        </ul>
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent-light">
          MetaMask is free and works on Chrome, Firefox, Brave, and Edge.
        </div>
      </>
    ),
  },
  {
    number: 2,
    title: "Buy ETH",
    content: (
      <>
        <ul className="space-y-3 text-foreground/70">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            Create a free account on{" "}
            <a
              href="https://coinbase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-light underline decoration-accent-light/30 underline-offset-2 transition-colors hover:text-accent"
            >
              Coinbase
            </a>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            Buy ETH (Ethereum) with your debit card or bank transfer
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            Even $10&ndash;20 of ETH is enough to start
          </li>
        </ul>
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent-light">
          Coinbase is recommended because it&apos;s the easiest way to get ETH
          on the Base network.
        </div>
      </>
    ),
  },
  {
    number: 3,
    title: "Transfer to Base Network",
    content: (
      <>
        <ul className="space-y-3 text-foreground/70">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-charity-green" />
            <span>
              <span className="font-semibold text-charity-green">
                Option A (Easiest):
              </span>{" "}
              Withdraw ETH directly to Base from Coinbase &mdash; select
              &ldquo;Base&rdquo; as the network when withdrawing
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            <span>
              <span className="font-semibold text-foreground">Option B:</span>{" "}
              Use the official{" "}
              <a
                href="https://bridge.base.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-light underline decoration-accent-light/30 underline-offset-2 transition-colors hover:text-accent"
              >
                Base Bridge
              </a>{" "}
              to move ETH from Ethereum to Base
            </span>
          </li>
        </ul>
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent-light">
          Coinbase withdrawals to Base are free. Bridging from Ethereum costs a
          small gas fee.
        </div>
      </>
    ),
  },
  {
    number: 4,
    title: "Add Base Network to MetaMask",
    content: (
      <>
        <p className="mb-4 text-foreground/70">
          Open MetaMask, go to Settings &rarr; Networks &rarr; Add Network, and
          enter the following details:
        </p>
        <div className="overflow-hidden rounded-lg border border-surface-light bg-background">
          <table className="w-full text-sm">
            <tbody>
              {networkDetails.map((detail, idx) => (
                <tr
                  key={detail.label}
                  className={
                    idx !== networkDetails.length - 1
                      ? "border-b border-surface-light"
                      : ""
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground/50">
                    {detail.label}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-foreground/90 break-all">
                    {detail.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent-light">
          Or visit{" "}
          <a
            href="https://chainlist.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline decoration-accent-light/30 underline-offset-2 transition-colors hover:text-accent"
          >
            chainlist.org
          </a>{" "}
          and search for &ldquo;Base&rdquo; to add it automatically.
        </div>
      </>
    ),
  },
  {
    number: 5,
    title: "Swap ETH for POH on Uniswap",
    content: (
      <>
        <ol className="space-y-3 text-foreground/70">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-light text-xs font-semibold text-foreground/60">
              1
            </span>
            Go to{" "}
            <a
              href="https://app.uniswap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-light underline decoration-accent-light/30 underline-offset-2 transition-colors hover:text-accent"
            >
              Uniswap
            </a>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-light text-xs font-semibold text-foreground/60">
              2
            </span>
            Connect your MetaMask wallet
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-light text-xs font-semibold text-foreground/60">
              3
            </span>
            Select the Base network
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-light text-xs font-semibold text-foreground/60">
              4
            </span>
            <span>
              Paste the POH token contract address:
              <span className="mt-2 block rounded-md border border-voyager-gold/30 bg-voyager-gold/5 px-3 py-2 font-mono text-sm text-voyager-gold">
                {CONTRACTS.token}
              </span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-light text-xs font-semibold text-foreground/60">
              5
            </span>
            Enter the amount of ETH you want to swap
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-light text-xs font-semibold text-foreground/60">
              6
            </span>
            Set slippage to 4% (to account for the 3% sell fee)
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-light text-xs font-semibold text-foreground/60">
              7
            </span>
            Click Swap and confirm the transaction in MetaMask
          </li>
        </ol>
      </>
    ),
  },
];

const warnings = [
  "Always verify the contract address on our official website or Basescan.",
  "Never share your seed phrase or private keys.",
  "Start with a small amount to test the process.",
  "POH is a utility token, not an investment. No financial returns are promised.",
];

export default function HowToBuyPage() {
  return (
    <div className="bg-background">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_60%)] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <FadeIn>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              How to Buy{" "}
              <span className="text-accent-light">POH</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-foreground/60">
              A beginner-friendly guide to purchasing Pursuit of Happiness tokens
              on the Base network.
            </p>
          </FadeIn>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-accent via-accent-light/40 to-transparent sm:block"
            aria-hidden="true"
          />

          <div className="space-y-10">
            {steps.map((step) => (
              <FadeIn key={step.number} delay={step.number * 0.05}>
                <div className="relative flex gap-6">
                  {/* Step number circle */}
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface text-lg font-bold text-accent-light shadow-lg shadow-accent/10">
                    {step.number}
                  </div>

                  {/* Card */}
                  <div className="glass-card flex-1 p-6 shadow-lg shadow-black/20 sm:p-8">
                    <h2 className="mb-4 text-xl font-semibold text-foreground">
                      {step.title}
                    </h2>
                    {step.content}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-voyager-gold/30 bg-voyager-gold/5 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 text-voyager-gold"
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
            <h3 className="text-lg font-semibold text-voyager-gold">
              Important Notes
            </h3>
          </div>
          <ul className="space-y-3">
            {warnings.map((warning) => (
              <li
                key={warning}
                className="flex items-start gap-3 text-sm leading-relaxed text-foreground/70"
              >
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-voyager-gold" />
                {warning}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Gradient divider ─── */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* CTA */}
      <section className="bg-gradient-to-b from-background to-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Ready to make an impact?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-foreground/50">
            Every POH transaction funds environmental, humanitarian,
            educational, and health initiatives around the world.
          </p>
          <a
            href="#"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:shadow-accent-light/20 hover:scale-105"
          >
            Buy POH on Uniswap
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
