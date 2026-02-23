"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

export function VoyagerBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  /* Parallax offsets for each layer */
  const starsX = useTransform(smoothX, [0, 1], [10, -10]);
  const starsY = useTransform(smoothY, [0, 1], [10, -10]);
  const nebulaX = useTransform(smoothX, [0, 1], [20, -20]);
  const nebulaY = useTransform(smoothY, [0, 1], [20, -20]);
  const voyagerX = useTransform(smoothX, [0, 1], [30, -30]);
  const voyagerY = useTransform(smoothY, [0, 1], [30, -30]);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    function handleMouse(e: MouseEvent) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    }

    const el = containerRef.current;
    el?.addEventListener("mousemove", handleMouse);
    return () => el?.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Layer 1 — distant stars (slow drift) */}
      <motion.div
        className="absolute inset-0"
        style={{ x: starsX, y: starsY }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_20%_30%,rgba(255,255,255,0.5)_50%,transparent_50%),radial-gradient(1.5px_1.5px_at_60%_70%,rgba(255,255,255,0.4)_50%,transparent_50%),radial-gradient(1px_1px_at_80%_20%,rgba(255,255,255,0.6)_50%,transparent_50%),radial-gradient(1px_1px_at_40%_80%,rgba(255,255,255,0.3)_50%,transparent_50%)] bg-[length:200px_200px]" />
      </motion.div>

      {/* Layer 2 — nebula glow (medium drift) */}
      <motion.div
        className="absolute inset-0"
        style={{ x: nebulaX, y: nebulaY }}
      >
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[500px] rounded-full bg-accent/8 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[400px] rounded-full bg-voyager-gold/6 blur-[80px]" />
      </motion.div>

      {/* Layer 3 — Voyager spacecraft (foreground) */}
      <motion.div
        className="absolute inset-0"
        style={{ x: voyagerX, y: voyagerY }}
      >
        <div className="voyager-drift absolute top-[40%] left-0">
          <svg
            width="80"
            height="40"
            viewBox="0 0 80 40"
            fill="none"
            className="opacity-40"
          >
            {/* Main body */}
            <rect
              x="20"
              y="16"
              width="40"
              height="8"
              rx="2"
              fill="url(#vBody)"
            />
            {/* Antenna dish */}
            <ellipse cx="64" cy="20" rx="8" ry="12" fill="url(#vDish)" />
            <line
              x1="60"
              y1="20"
              x2="72"
              y2="20"
              stroke="rgba(245,158,11,0.3)"
              strokeWidth="0.5"
            />
            {/* Boom arms */}
            <line
              x1="30"
              y1="16"
              x2="18"
              y2="4"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
            <line
              x1="30"
              y1="24"
              x2="18"
              y2="36"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
            {/* Instruments at ends of booms */}
            <rect
              x="14"
              y="2"
              width="8"
              height="4"
              rx="1"
              fill="rgba(99,102,241,0.3)"
            />
            <rect
              x="14"
              y="34"
              width="8"
              height="4"
              rx="1"
              fill="rgba(16,185,129,0.3)"
            />
            {/* RTG power source */}
            <rect
              x="10"
              y="17"
              width="10"
              height="6"
              rx="1"
              fill="rgba(245,158,11,0.2)"
            />
            {/* Signal waves */}
            <path
              d="M74 20 Q78 14, 80 20 Q78 26, 74 20"
              stroke="rgba(245,158,11,0.15)"
              strokeWidth="0.5"
              fill="none"
            />
            <defs>
              <linearGradient id="vBody" x1="20" y1="20" x2="60" y2="20">
                <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
              <linearGradient id="vDish" x1="56" y1="8" x2="72" y2="32">
                <stop offset="0%" stopColor="rgba(245,158,11,0.15)" />
                <stop offset="100%" stopColor="rgba(245,158,11,0.05)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
