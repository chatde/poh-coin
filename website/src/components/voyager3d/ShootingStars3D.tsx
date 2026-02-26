"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MAX_STARS = 4;
const VERTICES_PER_STAR = 2; // head + tail

interface StarData {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

/**
 * Shooting stars rendered as line segments with additive blending.
 * Max 4 simultaneous stars, random spawning, gradient fade.
 */
export function ShootingStars3D() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const nextSpawn = useRef(0);

  const starData = useMemo<StarData[]>(() =>
    Array.from({ length: MAX_STARS }, () => ({
      active: false,
      x: 0, y: 0,
      vx: 0, vy: 0,
      life: 0, maxLife: 0,
      length: 0,
    })),
  []);

  const positions = useMemo(() => new Float32Array(MAX_STARS * VERTICES_PER_STAR * 3), []);
  const colors = useMemo(() => new Float32Array(MAX_STARS * VERTICES_PER_STAR * 3), []);

  /* Set up buffer attributes imperatively */
  useEffect(() => {
    if (!lineRef.current) return;
    const geo = lineRef.current.geometry;
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (!lineRef.current) return;

    /* Spawn logic */
    nextSpawn.current -= delta;
    if (nextSpawn.current <= 0) {
      nextSpawn.current = 1.5 + Math.random() * 4; // 1.5-5.5s between spawns
      const slot = starData.find((s) => !s.active);
      if (slot) {
        const angle = (-15 + Math.random() * 30) * (Math.PI / 180);
        const speed = 6 + Math.random() * 8;
        slot.active = true;
        slot.x = -12 + Math.random() * 16;
        slot.y = 2 + Math.random() * 4;
        slot.vx = Math.cos(angle) * speed;
        slot.vy = Math.sin(angle) * speed;
        slot.life = 0;
        slot.maxLife = 0.6 + Math.random() * 0.6;
        slot.length = 1.5 + Math.random() * 3;
      }
    }

    /* Update stars */
    for (let i = 0; i < MAX_STARS; i++) {
      const s = starData[i];
      const headIdx = i * VERTICES_PER_STAR * 3;
      const tailIdx = headIdx + 3;

      if (!s.active) {
        /* Hide off-screen */
        positions[headIdx] = -100;
        positions[headIdx + 1] = -100;
        positions[headIdx + 2] = -5;
        positions[tailIdx] = -100;
        positions[tailIdx + 1] = -100;
        positions[tailIdx + 2] = -5;
        colors[headIdx] = 0;
        colors[headIdx + 1] = 0;
        colors[headIdx + 2] = 0;
        colors[tailIdx] = 0;
        colors[tailIdx + 1] = 0;
        colors[tailIdx + 2] = 0;
        continue;
      }

      s.life += delta;
      s.x += s.vx * delta;
      s.y += s.vy * delta;

      const fade = Math.max(0, 1 - s.life / s.maxLife);

      /* Head (bright white) */
      positions[headIdx] = s.x;
      positions[headIdx + 1] = s.y;
      positions[headIdx + 2] = -3;
      colors[headIdx] = fade;
      colors[headIdx + 1] = fade;
      colors[headIdx + 2] = fade;

      /* Tail (faded) */
      const tailFade = fade * 0.2;
      const dirLen = Math.sqrt(s.vx * s.vx + s.vy * s.vy) || 1;
      positions[tailIdx] = s.x - (s.vx / dirLen) * s.length;
      positions[tailIdx + 1] = s.y - (s.vy / dirLen) * s.length;
      positions[tailIdx + 2] = -3;
      colors[tailIdx] = tailFade;
      colors[tailIdx + 1] = tailFade;
      colors[tailIdx + 2] = tailFade;

      if (s.life >= s.maxLife) {
        s.active = false;
      }
    }

    const posAttr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute | undefined;
    const colAttr = lineRef.current.geometry.attributes.color as THREE.BufferAttribute | undefined;
    if (posAttr) posAttr.needsUpdate = true;
    if (colAttr) colAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        linewidth={1}
      />
    </lineSegments>
  );
}
