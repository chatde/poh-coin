"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealOptions {
  /** Start trigger position (default: "top 85%") */
  start?: string;
  /** Initial Y offset in px (default: 40) */
  yOffset?: number;
  /** Animation duration in seconds (default: 0.8) */
  duration?: number;
  /** Stagger delay between children (default: 0) */
  stagger?: number;
  /** Target children selector instead of the element itself */
  childSelector?: string;
}

/**
 * Hook to animate elements in on scroll using GSAP ScrollTrigger.
 * Respects prefers-reduced-motion. Cleans up on unmount.
 */
export function useGsapScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {},
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;

    const {
      start = "top 85%",
      yOffset = 40,
      duration = 0.8,
      stagger = 0,
      childSelector,
    } = options;

    const targets = childSelector ? el.querySelectorAll(childSelector) : [el];

    gsap.set(targets, { opacity: 0, y: yOffset });

    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: "play none none none",
      },
    });

    return () => {
      tween.kill();
      tween.scrollTrigger?.kill();
    };
  }, [options]);

  return ref;
}
