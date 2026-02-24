"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

/* ── Particle trail system ── */
interface Particle {
  x: number;
  y: number;
  alpha: number;
  size: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  life: number;
}

export function VoyagerBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const rafRef = useRef<number>(0);
  const voyagerPosRef = useRef({ x: -200, y: 0 });
  const timeRef = useRef(0);

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  /* Parallax offsets for each layer */
  const starsX = useTransform(smoothX, [0, 1], [10, -10]);
  const starsY = useTransform(smoothY, [0, 1], [10, -10]);
  const nebulaX = useTransform(smoothX, [0, 1], [25, -25]);
  const nebulaY = useTransform(smoothY, [0, 1], [25, -25]);

  const spawnParticle = useCallback((x: number, y: number) => {
    const particles = particlesRef.current;
    if (particles.length > 60) particles.shift();
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      alpha: 0.4 + Math.random() * 0.3,
      size: 0.5 + Math.random() * 1.5,
      vx: -(0.3 + Math.random() * 0.5),
      vy: (Math.random() - 0.5) * 0.3,
      life: 0,
      maxLife: 40 + Math.random() * 40,
    });
  }, []);

  const spawnShootingStar = useCallback((w: number, h: number) => {
    const stars = shootingStarsRef.current;
    if (stars.length > 3) return;
    const angle = (-20 + Math.random() * 40) * (Math.PI / 180);
    const speed = 4 + Math.random() * 6;
    stars.push({
      x: Math.random() * w * 0.8,
      y: Math.random() * h * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: 30 + Math.random() * 60,
      alpha: 0.6 + Math.random() * 0.4,
      life: 0,
    });
  }, []);

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

    /* Particle animation canvas */
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      if (!ctx || !canvas) return;

      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.016;

      /* Voyager position — slow traverse across screen */
      const cycleDuration = 90; // seconds for full crossing
      const progress = (timeRef.current % cycleDuration) / cycleDuration;
      const vx = -200 + progress * (w + 400);
      const vy = h * 0.38 + Math.sin(timeRef.current * 0.3) * 20;
      voyagerPosRef.current = { x: vx, y: vy };

      /* Spawn engine trail particles */
      if (timeRef.current % 0.05 < 0.02) {
        spawnParticle(vx - 10, vy);
        spawnParticle(vx - 15, vy + 2);
      }

      /* Random shooting stars */
      if (Math.random() < 0.003) {
        spawnShootingStar(w, h);
      }

      /* Draw shooting stars */
      const stars = shootingStarsRef.current;
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        const fade = Math.max(0, 1 - s.life / 60);

        const grad = ctx.createLinearGradient(
          s.x, s.y,
          s.x - s.vx * (s.length / 6), s.y - s.vy * (s.length / 6)
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.alpha * fade})`);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(
          s.x - s.vx * (s.length / 6),
          s.y - s.vy * (s.length / 6)
        );
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        /* Head glow */
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * fade})`;
        ctx.fill();

        if (s.life > 60 || s.x > w + 100 || s.y > h + 100) {
          stars.splice(i, 1);
        }
      }

      /* Draw engine trail particles */
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const fade = 1 - p.life / p.maxLife;

        if (fade <= 0) {
          particles.splice(i, 1);
          continue;
        }

        /* Gold-to-blue gradient for engine exhaust */
        const r = Math.round(245 - (245 - 99) * (p.life / p.maxLife));
        const g = Math.round(158 - (158 - 102) * (p.life / p.maxLife));
        const b = Math.round(11 + (241 - 11) * (p.life / p.maxLife));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * fade, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * fade})`;
        ctx.fill();
      }

      /* Draw Voyager spacecraft (larger, more detailed) */
      drawVoyager(ctx, vx, vy, timeRef.current);
    }

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      el?.removeEventListener("mousemove", handleMouse);
    };
  }, [mouseX, mouseY, spawnParticle, spawnShootingStar]);

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

      {/* Layer 2 — nebula glow clouds (medium drift) */}
      <motion.div
        className="absolute inset-0"
        style={{ x: nebulaX, y: nebulaY }}
      >
        <div className="absolute left-[10%] top-[20%] h-[500px] w-[600px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute right-[15%] bottom-[20%] h-[400px] w-[500px] rounded-full bg-voyager-gold/5 blur-[100px]" />
        <div className="absolute left-[50%] top-[50%] h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-charity-green/4 blur-[100px]" />
      </motion.div>

      {/* Layer 3 — Voyager canvas (spacecraft + particles + shooting stars) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}

/* ── Draw a detailed Voyager spacecraft ── */
function drawVoyager(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  const bobY = Math.sin(time * 0.5) * 3;
  ctx.translate(0, bobY);

  const scale = 1.8;
  ctx.scale(scale, scale);

  /* Engine glow */
  const glowGrad = ctx.createRadialGradient(-20, 0, 0, -20, 0, 25);
  glowGrad.addColorStop(0, "rgba(245, 158, 11, 0.3)");
  glowGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.08)");
  glowGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(-20, 0, 25, 0, Math.PI * 2);
  ctx.fill();

  /* Main bus (body) */
  const bodyGrad = ctx.createLinearGradient(-25, -5, 25, 5);
  bodyGrad.addColorStop(0, "rgba(200, 200, 210, 0.25)");
  bodyGrad.addColorStop(0.5, "rgba(220, 220, 230, 0.35)");
  bodyGrad.addColorStop(1, "rgba(180, 180, 190, 0.2)");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-25, -5, 50, 10, 2);
  ctx.fill();

  /* High-gain antenna dish */
  const dishGrad = ctx.createLinearGradient(25, -16, 40, 16);
  dishGrad.addColorStop(0, "rgba(245, 158, 11, 0.2)");
  dishGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.12)");
  dishGrad.addColorStop(1, "rgba(245, 158, 11, 0.05)");
  ctx.fillStyle = dishGrad;
  ctx.beginPath();
  ctx.ellipse(32, 0, 10, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(245, 158, 11, 0.15)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  /* Antenna feed strut */
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(25, 0);
  ctx.lineTo(42, 0);
  ctx.stroke();

  /* Antenna feed point */
  ctx.fillStyle = "rgba(245, 158, 11, 0.4)";
  ctx.beginPath();
  ctx.arc(42, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  /* Science boom (upper) */
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-5, -5);
  ctx.lineTo(-25, -25);
  ctx.stroke();

  /* Magnetometer boom instrument */
  ctx.fillStyle = "rgba(99, 102, 241, 0.35)";
  ctx.beginPath();
  ctx.roundRect(-30, -28, 10, 6, 1);
  ctx.fill();

  /* Science boom (lower) */
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.beginPath();
  ctx.moveTo(-5, 5);
  ctx.lineTo(-25, 25);
  ctx.stroke();

  /* Plasma instrument */
  ctx.fillStyle = "rgba(16, 185, 129, 0.35)";
  ctx.beginPath();
  ctx.roundRect(-30, 22, 10, 6, 1);
  ctx.fill();

  /* RTG (nuclear power source) */
  const rtgGrad = ctx.createLinearGradient(-35, -4, -25, 4);
  rtgGrad.addColorStop(0, "rgba(245, 158, 11, 0.2)");
  rtgGrad.addColorStop(1, "rgba(245, 158, 11, 0.1)");
  ctx.fillStyle = rtgGrad;
  ctx.beginPath();
  ctx.roundRect(-35, -4, 12, 8, 1);
  ctx.fill();

  /* RTG fin ridges */
  ctx.strokeStyle = "rgba(245, 158, 11, 0.12)";
  ctx.lineWidth = 0.3;
  for (let i = 0; i < 4; i++) {
    const fx = -33 + i * 3;
    ctx.beginPath();
    ctx.moveTo(fx, -4);
    ctx.lineTo(fx, 4);
    ctx.stroke();
  }

  /* Signal pulse (animated) */
  const pulseAlpha = (Math.sin(time * 2) + 1) * 0.08;
  ctx.strokeStyle = `rgba(245, 158, 11, ${pulseAlpha})`;
  ctx.lineWidth = 0.8;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(42 + i * 6, 0, i * 4, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.stroke();
  }

  ctx.restore();
}
