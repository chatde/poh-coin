"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 120;

interface EngineTrailProps {
  positionRef: React.RefObject<THREE.Vector3>;
}

/**
 * GPU-friendly particle system for the spacecraft engine trail.
 * Gold-to-blue gradient, additive blending, tracks the Voyager position.
 */
export function EngineTrail({ positionRef }: EngineTrailProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes, velocities, lifetimes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const siz = new Float32Array(PARTICLE_COUNT);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const life = new Float32Array(PARTICLE_COUNT * 2); // [current, max]

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = -100;
      pos[i * 3 + 1] = -100;
      pos[i * 3 + 2] = 0;
      col[i * 3] = 0.96;
      col[i * 3 + 1] = 0.62;
      col[i * 3 + 2] = 0.04;
      siz[i] = 0;
      life[i * 2] = 0;
      life[i * 2 + 1] = 0;
    }

    return { positions: pos, colors: col, sizes: siz, velocities: vel, lifetimes: life };
  }, []);

  /* Set up buffer attributes imperatively to avoid R3F typing issues */
  useEffect(() => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  }, [positions, colors, sizes]);

  const nextSpawn = useRef(0);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute | undefined;
    const colAttr = geo.attributes.color as THREE.BufferAttribute | undefined;
    const sizeAttr = geo.attributes.size as THREE.BufferAttribute | undefined;
    if (!posAttr || !colAttr || !sizeAttr) return;

    const srcPos = positionRef.current ?? new THREE.Vector3(-100, -100, 0);

    /* Spawn 2 particles every ~0.03s */
    nextSpawn.current -= delta;
    if (nextSpawn.current <= 0) {
      nextSpawn.current = 0.03;
      for (let burst = 0; burst < 2; burst++) {
        let idx = -1;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          if (lifetimes[i * 2] >= lifetimes[i * 2 + 1] || lifetimes[i * 2 + 1] === 0) {
            idx = i;
            break;
          }
        }
        if (idx === -1) idx = Math.floor(Math.random() * PARTICLE_COUNT);

        positions[idx * 3] = srcPos.x - 0.6 + (Math.random() - 0.5) * 0.3;
        positions[idx * 3 + 1] = srcPos.y + (Math.random() - 0.5) * 0.2;
        positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.2;

        velocities[idx * 3] = -(0.5 + Math.random() * 0.8);
        velocities[idx * 3 + 1] = (Math.random() - 0.5) * 0.15;
        velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.1;

        lifetimes[idx * 2] = 0;
        lifetimes[idx * 2 + 1] = 1.0 + Math.random() * 1.5;

        sizes[idx] = 0.04 + Math.random() * 0.06;

        colors[idx * 3] = 0.96;
        colors[idx * 3 + 1] = 0.62;
        colors[idx * 3 + 2] = 0.04;
      }
    }

    /* Update all particles */
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      lifetimes[i * 2] += delta;
      const life = lifetimes[i * 2];
      const maxLife = lifetimes[i * 2 + 1];

      if (maxLife === 0 || life >= maxLife) {
        sizes[i] = 0;
        continue;
      }

      const t = life / maxLife;
      const fade = 1 - t;

      positions[i * 3] += velocities[i * 3] * delta;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      /* Gold (#f59e0b) -> Blue (#6366f1) gradient */
      colors[i * 3] = 0.96 - 0.57 * t;
      colors[i * 3 + 1] = 0.62 - 0.22 * t;
      colors[i * 3 + 2] = 0.04 + 0.91 * t;

      sizes[i] = (0.04 + Math.random() * 0.02) * fade;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
