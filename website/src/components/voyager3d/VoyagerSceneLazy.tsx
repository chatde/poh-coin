import dynamic from "next/dynamic";

/**
 * SSR boundary for the Three.js Voyager scene.
 * Prevents server-side rendering issues with WebGL/Canvas APIs.
 */
const VoyagerSceneLazy = dynamic(
  () => import("./VoyagerScene").then((m) => ({ default: m.VoyagerScene })),
  { ssr: false, loading: () => null },
);

export { VoyagerSceneLazy };
