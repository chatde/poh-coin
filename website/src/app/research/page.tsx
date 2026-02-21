import type { Metadata } from "next";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = {
  title: "Research Impact — Project POH",
  description:
    "How your compute power contributes to real science — protein folding, climate modeling, seismic analysis, and drug screening.",
};

export default function ResearchPage() {
  return (
    <div className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <FadeIn>
          <header className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-accent-light sm:text-5xl">
              Research Impact
            </h1>
            <p className="mt-4 text-lg text-foreground/50">
              How your compute power contributes to real science
            </p>
          </header>
        </FadeIn>

        {/* ── Research Areas ── */}
        <Section id="research-areas" title="Research Areas">
          <div className="grid gap-6 sm:grid-cols-2">
            <ResearchCard
              icon="&#x1F9EC;"
              title="Protein Folding"
              description="Modeling protein structures for Parkinson's, Alzheimer's, and cancer drug development"
            />
            <ResearchCard
              icon="&#x1F30D;"
              title="Climate Modeling"
              description="Simulating heat diffusion in Arctic ice sheets, ocean currents, and urban environments"
            />
            <ResearchCard
              icon="&#x1F4E1;"
              title="Seismic Analysis"
              description="Processing earthquake waveform data for early warning systems"
            />
            <ResearchCard
              icon="&#x1F48A;"
              title="Drug Screening"
              description="Virtual docking of drug candidates against cancer-related protein targets (EGFR, BRAF, HER2)"
            />
          </div>
        </Section>

        {/* ── How It Works ── */}
        <Section id="how-it-works" title="How It Works">
          <ol className="list-none space-y-6 pl-0">
            <Step
              number="1"
              text="Research partners submit compute tasks via our API"
            />
            <Step
              number="2"
              text="Tasks are distributed to POH miners worldwide"
            />
            <Step
              number="3"
              text="Results are verified by 2-of-3 consensus + AI anomaly detection"
            />
            <Step
              number="4"
              text="Validated results are returned to research partners"
            />
          </ol>
        </Section>

        {/* ── Partner With Us ── */}
        <Section id="partner" title="Partner With Us">
          <div className="glass-card p-8 text-center">
            <p className="text-lg font-medium text-foreground/90">
              Are you a research institution? Submit compute tasks to our
              distributed network.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="mailto:research@projectpoh.com"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-light px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-105"
              >
                research@projectpoh.com
              </a>
              <a
                href="/docs/api"
                className="inline-flex items-center gap-2 rounded-xl border border-surface-light px-6 py-3 text-sm font-semibold text-foreground/70 transition-colors hover:border-accent-light hover:text-accent-light"
              >
                API Documentation
              </a>
            </div>
          </div>
        </Section>

        {/* ── Network Stats ── */}
        <Section id="stats" title="Network Stats">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total compute hours donated" value="Coming soon" />
            <StatCard label="Tasks verified" value="Coming soon" />
            <StatCard label="Research partners" value="Coming soon" />
            <StatCard label="Active miners" value="Coming soon" />
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

function ResearchCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card p-6">
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        {description}
      </p>
    </div>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent-light">
        {number}
      </span>
      <p className="pt-1 text-foreground/80">{text}</p>
    </li>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-6 text-center">
      <p className="text-2xl font-bold text-voyager-gold">{value}</p>
      <p className="mt-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
        {label}
      </p>
    </div>
  );
}
