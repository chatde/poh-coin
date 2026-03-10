"use client";

import { useState } from "react";

type SignupState = "idle" | "submitting" | "success" | "error";

interface Props {
  source?: string;
}

export function NewsletterSignup({ source = "footer" }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SignupState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data: { success?: boolean; error?: string } = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Something went wrong. Try again.");
        setState("error");
      } else {
        setState("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <p className="text-sm text-accent-light">
        ✓ You&apos;re on the list — welcome to the mission.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:gap-0">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        placeholder="Enter your email"
        className="flex-1 rounded-xl sm:rounded-r-none border border-surface-light bg-surface/50 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
      />
      <button
        type="submit"
        disabled={state === "submitting"}
        className="rounded-xl sm:rounded-l-none bg-gradient-to-r from-accent to-accent-light px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-accent/30 disabled:opacity-50"
      >
        {state === "submitting" ? "…" : "Subscribe"}
      </button>
      {state === "error" && (
        <p className="mt-1 text-xs text-red-400 sm:absolute sm:bottom-[-20px]">{errorMsg}</p>
      )}
    </form>
  );
}
