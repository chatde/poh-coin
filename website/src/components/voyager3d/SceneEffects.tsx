"use client";

import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Vector2 } from "three";

const chromaticOffset = /* @__PURE__ */ new Vector2(0.0015, 0.0015);

/**
 * Post-processing effects: Bloom, vignette, chromatic aberration, film grain.
 * Cinematic look matching dramatic NASA artist renderings.
 */
export function SceneEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette darkness={0.4} offset={0.3} />
      <ChromaticAberration offset={chromaticOffset} />
      <Noise opacity={0.015} />
    </EffectComposer>
  );
}
