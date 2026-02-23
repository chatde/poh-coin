"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  /** How fast the background elements move relative to scroll. Default 0.3 */
  speed?: number;
}

export function ParallaxSection({
  children,
  className = "",
  speed = 0.3,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);

  return (
    <section ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Parallax background orbs */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ y }}
        aria-hidden="true"
      >
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[400px] rounded-full bg-accent/6 blur-[100px]" />
        <div className="absolute right-1/3 bottom-1/3 h-[250px] w-[350px] rounded-full bg-voyager-gold/5 blur-[80px]" />
      </motion.div>
      {children}
    </section>
  );
}
