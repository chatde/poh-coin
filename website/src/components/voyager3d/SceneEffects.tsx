"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";

/**
 * Post-processing effects: Bloom for dish rim, RTGs, engine trail, golden record.
 * Tuned for M1 8GB — low intensity, small kernel.
 */
export function SceneEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.6}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
}
