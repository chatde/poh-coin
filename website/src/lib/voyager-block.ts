// ── Voyager Block Helpers ──────────────────────────────────────────────
//
// Thin re-exports combining voyager.ts distance and block-rewards.ts
// for easy consumption by React hooks.

export { getBlockHeight, getBlocksPerDay, getNextBlockEta } from "./voyager";
export { getBlockReward, getBlockRewardBreakdown } from "./block-rewards";
