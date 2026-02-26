"use client";

import { Suspense, useRef, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { VoyagerModel } from "./VoyagerModel";
import { EngineTrail } from "./EngineTrail";
import { ShootingStars3D } from "./ShootingStars3D";
import { SceneEffects } from "./SceneEffects";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

/**
 * Full R3F scene: Canvas wrapper with mouse parallax, lighting, and all 3D elements.
 * Replaces the old Canvas 2D VoyagerBackground.
 */
export function VoyagerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const voyagerPos = useRef(new THREE.Vector3(-14, 0, 0));
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [reducedMotion, setReducedMotion] = useState(false);

  /* Framer Motion mouse tracking (for nebula/star parallax layers) */
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  const starsX = useTransform(smoothX, [0, 1], [10, -10]);
  const starsY = useTransform(smoothY, [0, 1], [10, -10]);
  const nebulaX = useTransform(smoothX, [0, 1], [25, -25]);
  const nebulaY = useTransform(smoothY, [0, 1], [25, -25]);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      mouseRef.current = { x: nx, y: ny };
      mouseX.set(nx);
      mouseY.set(ny);
    },
    [mouseX, mouseY],
  );

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute inset-0 overflow-hidden"
      aria-hidden="true"
      onMouseMove={handleMouseMove}
    >
      {/* Layer 1 — distant stars (slow drift, same as old VoyagerBackground) */}
      <motion.div className="absolute inset-0" style={{ x: starsX, y: starsY }}>
        <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_20%_30%,rgba(255,255,255,0.5)_50%,transparent_50%),radial-gradient(1.5px_1.5px_at_60%_70%,rgba(255,255,255,0.4)_50%,transparent_50%),radial-gradient(1px_1px_at_80%_20%,rgba(255,255,255,0.6)_50%,transparent_50%),radial-gradient(1px_1px_at_40%_80%,rgba(255,255,255,0.3)_50%,transparent_50%)] bg-[length:200px_200px]" />
      </motion.div>

      {/* Layer 2 — nebula glow clouds (medium drift) */}
      <motion.div className="absolute inset-0" style={{ x: nebulaX, y: nebulaY }}>
        <div className="absolute left-[10%] top-[20%] h-[500px] w-[600px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute right-[15%] bottom-[20%] h-[400px] w-[500px] rounded-full bg-voyager-gold/5 blur-[100px]" />
        <div className="absolute left-[50%] top-[50%] h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-charity-green/4 blur-[100px]" />
      </motion.div>

      {/* Layer 3 — Three.js Canvas */}
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
        }}
        camera={{ position: [0, 0, 10], fov: 50 }}
        frameloop={reducedMotion ? "never" : "always"}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.15} />
        <directionalLight
          position={[8, 4, 6]}
          intensity={0.8}
          color={0xfff8e7}
        />

        <Suspense fallback={null}>
          <VoyagerModel positionRef={voyagerPos} mouseRef={mouseRef} />
          <EngineTrail positionRef={voyagerPos} />
          <ShootingStars3D />
          <SceneEffects />
        </Suspense>
      </Canvas>
    </div>
  );
}
