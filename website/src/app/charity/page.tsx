"use client";

import { useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";

type FormState = "idle" | "submitting" | "success" | "error";

export default function CharityPage() {
  const [form, setForm] = useState({
    org_name: "",
    contact_name: "",
    contact_email: "",
    mission: "",
    amount_requested: "",
    wallet_address: "",
  });
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/charity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount_requested: form.amount_requested ? Number(form.amount_requested) : null,
        }),
      });
      const data: { success?: boolean; error?: string } = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Submission failed. Please try again.");
        setState("error");
      } else {
        setState("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-accent-light sm:text-5xl">
              Charity Application
            </h1>
            <p className="mt-4 text-lg text-foreground/50">
              Apply for funding from the POH charity treasury — governed by token holders.
            </p>
          </header>
        </FadeIn>

        {state === "success" ? (
          <FadeIn>
            <div className="glass-card p-10 text-center">
              <div className="mb-4 text-5xl">🌟</div>
              <h2 className="text-2xl font-bold text-accent-light">Application Received</h2>
              <p className="mt-4 text-foreground/70">
                Thank you for applying. The POH community will review your application and
                vote on funding through on-chain governance. We&apos;ll be in touch at{" "}
                <span className="text-accent-light">{form.contact_email}</span>.
              </p>
              <p className="mt-4 text-sm text-foreground/50">
                Track governance proposals on{" "}
                <a
                  href="https://www.tally.xyz/gov/project-poh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-light underline underline-offset-2 hover:text-accent"
                >
                  Tally
                </a>
                .
              </p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn>
            <form onSubmit={handleSubmit} className="glass-card space-y-6 p-8">
              {/* Organization */}
              <Field
                label="Organization Name"
                name="org_name"
                value={form.org_name}
                onChange={handleChange}
                required
                placeholder="e.g. Ocean Cleanup Foundation"
              />

              {/* Contact */}
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Contact Name"
                  name="contact_name"
                  value={form.contact_name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
                <Field
                  label="Contact Email"
                  name="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                />
              </div>

              {/* Mission */}
              <div>
                <label htmlFor="mission" className="block text-sm font-medium text-foreground/80 mb-2">
                  Mission & Impact <span className="text-accent-light">*</span>
                </label>
                <textarea
                  id="mission"
                  name="mission"
                  rows={5}
                  value={form.mission}
                  onChange={handleChange}
                  required
                  maxLength={5000}
                  placeholder="Describe your organization's mission, the specific project you want funded, expected impact, and how the funds will be used."
                  className="w-full rounded-xl border border-surface-light bg-surface/50 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 resize-none"
                />
                <p className="mt-1 text-xs text-foreground/40">{form.mission.length}/5000</p>
              </div>

              {/* Amount */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="amount_requested" className="block text-sm font-medium text-foreground/80 mb-2">
                    Funding Requested (USD)
                  </label>
                  <input
                    id="amount_requested"
                    name="amount_requested"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount_requested}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-surface-light bg-surface/50 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                  />
                  <p className="mt-1 text-xs text-foreground/40">Optional — leave blank if flexible</p>
                </div>
                <div>
                  <label htmlFor="wallet_address" className="block text-sm font-medium text-foreground/80 mb-2">
                    Wallet Address
                  </label>
                  <input
                    id="wallet_address"
                    name="wallet_address"
                    type="text"
                    value={form.wallet_address}
                    onChange={handleChange}
                    placeholder="0x..."
                    className="w-full rounded-xl border border-surface-light bg-surface/50 px-4 py-3 text-sm font-mono text-foreground placeholder:text-foreground/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                  />
                  <p className="mt-1 text-xs text-foreground/40">Base network address for disbursement</p>
                </div>
              </div>

              {state === "error" && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={state === "submitting"}
                className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-light px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {state === "submitting" ? "Submitting…" : "Submit Application"}
              </button>

              <p className="text-center text-xs text-foreground/40">
                Applications are reviewed by the community via on-chain governance. Token holders
                vote on funding decisions. All decisions are transparent and publicly verifiable.
              </p>
            </form>
          </FadeIn>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-foreground/80 mb-2">
        {label} {required && <span className="text-accent-light">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-surface-light bg-surface/50 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
      />
    </div>
  );
}
