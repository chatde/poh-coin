"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** GSAP "from" properties (default: { opacity: 0, y: 40 }) */
  from?: gsap.TweenVars;
  /** GSAP "to" properties (default: { opacity: 1, y: 0 }) */
  to?: gsap.TweenVars;
  /** Scrub animation to scroll progress (false = play-once) */
  scrub?: boolean | number;
  /** ScrollTrigger start (default: "top 85%") */
  start?: string;
  /** ScrollTrigger end (default: "bottom 20%") */
  end?: string;
  /** Animation duration (default: 0.8) */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
}

/**
 * Declarative wrapper for GSAP ScrollTrigger animations.
 * Coexists with Framer Motion (used on different elements).
 */
export function ScrollReveal({
  children,
  className,
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  scrub = false,
  start = "top 85%",
  end = "bottom 20%",
  duration = 0.8,
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;

    gsap.set(el, from);

    const tween = gsap.to(el, {
      ...to,
      duration: scrub ? undefined : duration,
      delay,
      ease: scrub ? "none" : "power2.out",
      scrollTrigger: {
        trigger: el,
        start,
        end: scrub ? end : undefined,
        scrub: scrub === true ? 1 : scrub || undefined,
        toggleActions: scrub ? undefined : "play none none none",
      },
    });

    return () => {
      tween.kill();
      tween.scrollTrigger?.kill();
    };
  }, [from, to, scrub, start, end, duration, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
