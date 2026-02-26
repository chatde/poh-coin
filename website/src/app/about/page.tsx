import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerParent, StaggerChild } from "@/components/motion/StaggerChildren";

const milestones = [
  {
    date: "Q1 2026",
    title: "Genesis",
    description: "Smart contracts deployed on Base mainnet. Open source launch. Mining app live.",
    status: "complete" as const,
  },
  {
    date: "Q2 2026",
    title: "Community Growth",
    description: "First charity distributions. Fitness mining launch. DAO governance activation.",
    status: "current" as const,
  },
  {
    date: "Q3 2026",
    title: "Ecosystem Expansion",
    description: "School node program. BOINC and Folding@Home integrations. Partnership announcements.",
    status: "upcoming" as const,
  },
  {
    date: "Q4 2026",
    title: "Impact at Scale",
    description: "501(c)(3) nonprofit established. First sanctuary farm acquisition. Third-party audit.",
    status: "upcoming" as const,
  },
  {
    date: "2027+",
    title: "The Voyager Chase",
    description: "Progressive decentralization. International expansion. Interstellar fund activation.",
    status: "upcoming" as const,
  },
];

const values = [
  {
    title: "Transparency",
    description: "Every charity dollar is on-chain. Every decision is public. No black boxes.",
    color: "text-charity-green",
    bg: "bg-charity-green/10",
  },
  {
    title: "Accessibility",
    description: "Mine with your phone. Buy with $10. No expensive hardware. No gatekeeping.",
    color: "text-accent-light",
    bg: "bg-accent/10",
  },
  {
    title: "Permanence",
    description: "Charity funding is hardcoded, not promised. Smart contracts enforce what humans can forget.",
    color: "text-voyager-gold",
    bg: "bg-voyager-gold/10",
  },
  {
    title: "Purpose",
    description: "Every feature exists to fund real-world impact. No meme culture. No hype cycles.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_60%)] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <FadeIn>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              About{" "}
              <span className="text-accent-light">Project POH</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-foreground/60">
              The Pursuit of Happiness &mdash; a cryptocurrency built for the health
              of both the planet and its people.
            </p>
          </FadeIn>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </section>

      {/* Origin Story */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <FadeIn>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-voyager-gold">
            The Origin
          </h2>
          <h3 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Why Voyager?
          </h3>
          <div className="mt-8 space-y-6 text-foreground/70 leading-relaxed">
            <p>
              In 1977, NASA launched Voyager 1 carrying the Golden Record &mdash; a message from
              all of humanity to whoever might find it in the vastness of space. It was an act
              of pure optimism: the belief that humanity is worth representing, that our music
              and our greetings and our existence matter.
            </p>
            <p>
              Almost 50 years later, Voyager 1 is still traveling. Over 24 billion kilometers
              from Earth, powered by a decaying plutonium battery that loses 4 watts per year.
              One day, it will go silent. And when it does, the Golden Record will continue
              drifting through interstellar space for billions of years &mdash; the last
              artifact of a species that dared to dream.
            </p>
            <p>
              Project POH was born from a simple question: <em className="text-foreground">what if we
              could tie cryptocurrency to something that actually matters?</em> Not market
              speculation. Not meme culture. But the same audacious optimism that put Voyager
              on its course &mdash; the pursuit of happiness for all life on this planet.
            </p>
            <p>
              Every POH token is tied to Voyager&apos;s journey. The supply equals its distance.
              The block rewards decay with its power source. When Voyager goes silent, mining
              stops forever. It&apos;s a cryptocurrency with an expiration date written in the stars.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-charity-green/30 to-transparent" />

      {/* Mission & Values */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-charity-green">
              Our Values
            </h2>
            <p className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              What we stand for
            </p>
          </div>
        </FadeIn>

        <StaggerParent className="mt-14 grid gap-6 sm:grid-cols-2">
          {values.map((value) => (
            <StaggerChild key={value.title}>
              <div className="glass-card h-full p-8">
                <div className={`mb-4 inline-flex rounded-lg ${value.bg} px-3 py-1.5`}>
                  <span className={`text-sm font-bold ${value.color}`}>{value.title}</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/60">
                  {value.description}
                </p>
              </div>
            </StaggerChild>
          ))}
        </StaggerParent>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* The Founder */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <FadeIn>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-light">
            The Founder
          </h2>
          <h3 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Built by one person, for everyone
          </h3>
          <div className="mt-8 space-y-6 text-foreground/70 leading-relaxed">
            <p>
              Project POH was built by a solo developer and father who believes technology should
              serve life, not extract from it. No VC backing. No pre-sale. No insider allocations.
              Just smart contracts, open source code, and a vision for what cryptocurrency could be
              if it was built for purpose instead of profit.
            </p>
            <p>
              The entire infrastructure runs on a Mac Mini, a Samsung phone, and a Raspberry Pi &mdash;
              an ecosystem of AI agents (Albert, Watson, and J.A.R.V.I.S.) that manage operations,
              monitor systems, and learn autonomously. It&apos;s proof that you don&apos;t need
              a Silicon Valley office to build something meaningful.
            </p>
            <p>
              The founder&apos;s tokens are locked in a 4-year vesting contract with a 6-month cliff,
              publicly verifiable on-chain. The long-term goal is full progressive decentralization &mdash;
              transferring ownership to the DAO so the community controls the project&apos;s future.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-voyager-gold/30 to-transparent" />

      {/* Roadmap */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-voyager-gold">
              Roadmap
            </h2>
            <p className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Where we&apos;re headed
            </p>
          </div>
        </FadeIn>

        <div className="mt-14 relative">
          {/* Vertical line */}
          <div
            className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-charity-green via-accent-light/40 to-transparent sm:left-6"
            aria-hidden="true"
          />

          <div className="space-y-10">
            {milestones.map((milestone) => (
              <FadeIn key={milestone.date}>
                <div className="relative flex gap-6 pl-2 sm:pl-4">
                  <div
                    className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      milestone.status === "complete"
                        ? "border-charity-green bg-charity-green"
                        : milestone.status === "current"
                          ? "border-accent-light bg-accent/20"
                          : "border-surface-light bg-surface"
                    }`}
                  >
                    {milestone.status === "complete" && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {milestone.status === "current" && (
                      <span className="h-2 w-2 rounded-full bg-accent-light animate-pulse" />
                    )}
                  </div>

                  <div>
                    <span className={`text-xs font-semibold uppercase tracking-widest ${
                      milestone.status === "complete"
                        ? "text-charity-green"
                        : milestone.status === "current"
                          ? "text-accent-light"
                          : "text-foreground/40"
                    }`}>
                      {milestone.date}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-foreground">{milestone.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/60">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* CTA */}
      <section className="bg-gradient-to-b from-background to-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Join the pursuit
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-foreground/50">
            Whether you mine, hold, or just follow along &mdash; every participant
            helps fund real-world impact.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/mine"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:shadow-accent-light/20 hover:scale-105"
            >
              Start Mining
            </Link>
            <Link
              href="/whitepaper"
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-foreground backdrop-blur-sm transition-all hover:border-accent-light hover:text-accent-light"
            >
              Read Whitepaper
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
