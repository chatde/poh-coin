"use client";

import { useEffect, useRef, useCallback } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  vx: number;
  vy: number;
}

const STAR_COUNT = 100;
const CONNECTION_DISTANCE = 120;
const MOUSE_RADIUS = 200;

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(true);

  const initStars = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const baseAlpha = 0.2 + Math.random() * 0.5;
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.5 + Math.random() * 1.5,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
      if (starsRef.current.length === 0) {
        initStars(rect.width, rect.height);
      }
    }
    resize();
    window.addEventListener("resize", resize);

    /* Mouse tracking */
    function handleMouse(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    /* IntersectionObserver — pause when off-screen */
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    /* Animation loop */
    let time = 0;
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      if (!visibleRef.current || !ctx || !canvas) return;

      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      const stars = starsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const star of stars) {
        if (!prefersReduced) {
          star.x += star.vx;
          star.y += star.vy;
          if (star.x < 0) star.x = w;
          if (star.x > w) star.x = 0;
          if (star.y < 0) star.y = h;
          if (star.y > h) star.y = 0;
        }

        /* Twinkle */
        const twinkle =
          Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        star.alpha = star.baseAlpha * twinkle;

        /* Mouse proximity glow */
        const dx = star.x - mx;
        const dy = star.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const boost = 1 - dist / MOUSE_RADIUS;
          star.alpha = Math.min(1, star.alpha + boost * 0.6);
        }

        /* Draw star */
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
      }

      /* Draw constellation lines between nearby stars */
      ctx.lineWidth = 0.5;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.15;

            /* Only draw lines near the mouse for a more subtle effect */
            const midX = (stars[i].x + stars[j].x) / 2;
            const midY = (stars[i].y + stars[j].y) / 2;
            const mouseDist = Math.sqrt(
              (midX - mx) ** 2 + (midY - my) ** 2
            );
            if (mouseDist < MOUSE_RADIUS * 1.5) {
              const mouseAlpha =
                alpha * (1 - mouseDist / (MOUSE_RADIUS * 1.5));
              ctx.beginPath();
              ctx.moveTo(stars[i].x, stars[i].y);
              ctx.lineTo(stars[j].x, stars[j].y);
              ctx.strokeStyle = `rgba(129, 140, 248, ${mouseAlpha})`;
              ctx.stroke();
            }
          }
        }
      }
    }

    if (!prefersReduced) {
      animate();
    } else {
      /* Static render for reduced motion */
      const stars = starsRef.current;
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.baseAlpha})`;
        ctx.fill();
      }
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
    };
  }, [initStars]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-auto absolute inset-0 h-full w-full"
      aria-hidden="true"
      style={{ position: "absolute", top: 0, left: 0 }}
    />
  );
}
