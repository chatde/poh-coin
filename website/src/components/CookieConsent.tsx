"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "poh-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-xl border border-surface-light bg-surface/95 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        <p className="text-sm leading-relaxed text-foreground/80">
          We use a first-party analytics cookie (Vercel Analytics) to count page
          views. No personal data is collected or shared.{" "}
          <a
            href="/privacy"
            className="text-accent-light underline underline-offset-2 hover:text-accent"
          >
            Privacy Policy
          </a>
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={accept}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            Accept
          </button>
          <button
            onClick={decline}
            className="rounded-lg border border-surface-light px-4 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
