"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface VoyagerModelProps {
  /** Shared ref so other components (EngineTrail) can track position */
  positionRef: React.RefObject<THREE.Vector3>;
  /** Normalized mouse position [0..1, 0..1] for parallax */
  mouseRef: React.RefObject<{ x: number; y: number }>;
}

/**
 * Procedural Voyager-inspired spacecraft built from Three.js primitives.
 * Custom design — no NASA IP. POH brand colors (gold, indigo, green).
 */
export function VoyagerModel({ positionRef, mouseRef }: VoyagerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(performance.now() / 1000);

  /* Pre-compute materials once */
  const materials = useMemo(() => ({
    bus: new THREE.MeshStandardMaterial({
      color: 0x141830,
      metalness: 0.7,
      roughness: 0.3,
    }),
    dish: new THREE.MeshStandardMaterial({
      color: 0xe8e8ec,
      metalness: 0.4,
      roughness: 0.5,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.08,
    }),
    dishRim: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.3,
    }),
    boom: new THREE.MeshStandardMaterial({
      color: 0x8888a0,
      metalness: 0.3,
      roughness: 0.7,
    }),
    rtg: new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      emissive: 0xff4500,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.4,
    }),
    goldenRecord: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    }),
    instrument: new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      metalness: 0.4,
      roughness: 0.5,
    }),
    instrumentGreen: new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.4,
      roughness: 0.5,
    }),
    strutLine: new THREE.LineBasicMaterial({
      color: 0xaaaacc,
      transparent: true,
      opacity: 0.4,
    }),
  }), []);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() / 1000 - startTime.current;

    /* 90-second traverse from left to right */
    const cycleDuration = 90;
    const progress = (t % cycleDuration) / cycleDuration;
    const xPos = -14 + progress * 28; // -14 to +14 world units
    const yBob = Math.sin(t * 0.8) * 0.3; // gentle bob

    groupRef.current.position.set(xPos, yBob, 0);

    /* Mouse parallax rotation */
    if (mouseRef.current) {
      const targetPitch = (mouseRef.current.y - 0.5) * 0.15;
      const targetYaw = (mouseRef.current.x - 0.5) * -0.15;
      groupRef.current.rotation.x += (targetPitch - groupRef.current.rotation.x) * 0.03;
      groupRef.current.rotation.y += (targetYaw - groupRef.current.rotation.y) * 0.03;
    }

    /* Slow dish rotation */
    if (dishRef.current) {
      dishRef.current.rotation.z = t * 0.05;
    }

    /* Update shared position for engine trail */
    if (positionRef.current) {
      positionRef.current.set(xPos, yBob, 0);
    }
  });

  return (
    <group ref={groupRef} scale={0.4}>
      {/* ── Main Bus (central body) ── */}
      <mesh material={materials.bus}>
        <boxGeometry args={[3, 0.6, 0.8]} />
      </mesh>

      {/* ── High-Gain Antenna ── */}
      {/* Stalk */}
      <mesh position={[2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.boom}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
      </mesh>
      {/* Dish */}
      <mesh ref={dishRef} position={[2.8, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.dish}>
        <circleGeometry args={[1.2, 32]} />
      </mesh>
      {/* Dish rim ring (bloom target) */}
      <mesh position={[2.82, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.dishRim}>
        <ringGeometry args={[1.1, 1.2, 32]} />
      </mesh>
      {/* Feed point */}
      <mesh position={[3.5, 0, 0]} material={materials.goldenRecord}>
        <sphereGeometry args={[0.1, 12, 12]} />
      </mesh>

      {/* ── Magnetometer Boom (long arm upward-left) ── */}
      <mesh position={[-0.8, -1.4, 0]} rotation={[0, 0, -0.5]} material={materials.boom}>
        <cylinderGeometry args={[0.02, 0.02, 2.8, 6]} />
      </mesh>
      {/* Magnetometer sensor */}
      <mesh position={[-2.1, -2.6, 0]} material={materials.instrument}>
        <boxGeometry args={[0.4, 0.25, 0.2]} />
      </mesh>

      {/* ── Science Instrument Boom (shorter, opposite side) ── */}
      <mesh position={[-0.8, 1.4, 0]} rotation={[0, 0, 0.5]} material={materials.boom}>
        <cylinderGeometry args={[0.02, 0.02, 2.4, 6]} />
      </mesh>
      {/* Scan platform (camera cluster) */}
      <group position={[-2.0, 2.3, 0]}>
        <mesh material={materials.instrumentGreen}>
          <boxGeometry args={[0.3, 0.2, 0.2]} />
        </mesh>
        <mesh position={[0.2, 0.05, 0]} material={materials.instrument}>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
        </mesh>
      </group>

      {/* ── RTG Power Boom 1 ── */}
      <mesh position={[-2.2, -0.8, 0]} rotation={[0, 0, -0.3]} material={materials.boom}>
        <cylinderGeometry args={[0.03, 0.03, 2, 6]} />
      </mesh>
      {/* RTG unit 1 */}
      <mesh position={[-3.1, -1.3, 0]} material={materials.rtg}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
      </mesh>

      {/* ── RTG Power Boom 2 ── */}
      <mesh position={[-2.2, 0.8, 0]} rotation={[0, 0, 0.3]} material={materials.boom}>
        <cylinderGeometry args={[0.03, 0.03, 2, 6]} />
      </mesh>
      {/* RTG unit 2 */}
      <mesh position={[-3.1, 1.3, 0]} material={materials.rtg}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
      </mesh>

      {/* ── Golden Record (POH brand gold!) ── */}
      <mesh position={[0, 0.31, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={materials.goldenRecord}>
        <circleGeometry args={[0.22, 24]} />
      </mesh>

      {/* ── RTG point lights (warm nuclear glow) ── */}
      <pointLight position={[-3.1, -1.3, 0]} color={0xff4500} intensity={0.5} distance={2} />
      <pointLight position={[-3.1, 1.3, 0]} color={0xff4500} intensity={0.5} distance={2} />
    </group>
  );
}
