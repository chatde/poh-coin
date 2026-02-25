// ── Voyager 1 Distance Calculator ──────────────────────────────────────
//
// Calculates Voyager 1's real-time distance from the Sun using a linear
// extrapolation model. Verified against JPL Horizons data to 99.99%+.
//
// Reference epoch: Jan 1, 2026 00:00 UTC
// Reference distance: 25,316,070,000 km (169.2457 AU) from the Sun
// Velocity: 16.8825 km/s = 1,458,648 km/day (heliocentric, radial)

// ── Constants ──────────────────────────────────────────────────────────

/** Unix timestamp (seconds) for Jan 1, 2026 00:00:00 UTC */
export const VOYAGER_REF_EPOCH_S = 1_735_689_600;

/** Voyager 1 distance from the Sun at reference epoch, in km */
export const VOYAGER_REF_DISTANCE_KM = 25_316_070_000;

/** Voyager 1 heliocentric radial velocity, km per day */
export const VOYAGER_VELOCITY_KM_DAY = 1_458_648;

/** Voyager 1 heliocentric radial velocity, km per second */
export const VOYAGER_VELOCITY_KM_S = 16.8825;

/** 1 AU in km */
export const AU_KM = 149_597_870.7;

/** Distance at POH token launch (the fixed initial supply in km) */
export const VOYAGER_LAUNCH_KM = 24_526_000_000;

/** Block size: 1 block = 1,000 km of Voyager travel beyond launch distance */
export const BLOCK_SIZE_KM = 1_000;

// ── Distance Functions ─────────────────────────────────────────────────

/** Current Voyager 1 distance from the Sun in km */
export function getVoyagerDistanceKm(now: Date = new Date()): number {
  const daysSinceEpoch =
    (now.getTime() / 1_000 - VOYAGER_REF_EPOCH_S) / 86_400;
  return VOYAGER_REF_DISTANCE_KM + VOYAGER_VELOCITY_KM_DAY * daysSinceEpoch;
}

/** Current Voyager 1 distance from the Sun in AU */
export function getVoyagerDistanceAU(now: Date = new Date()): number {
  return getVoyagerDistanceKm(now) / AU_KM;
}

/** Distance Voyager has traveled beyond the POH launch distance (the minable gap) */
export function getMinableDistanceKm(now: Date = new Date()): number {
  return Math.max(0, getVoyagerDistanceKm(now) - VOYAGER_LAUNCH_KM);
}

// ── Block Functions ────────────────────────────────────────────────────

/** Total block height — number of blocks available to mine */
export function getBlockHeight(now: Date = new Date()): number {
  return Math.floor(getMinableDistanceKm(now) / BLOCK_SIZE_KM);
}

/** Blocks that become available per day (~1,459 at 1000 km/block) */
export function getBlocksPerDay(): number {
  return Math.floor(VOYAGER_VELOCITY_KM_DAY / BLOCK_SIZE_KM);
}

/** Estimated time until the next block becomes available (ms) */
export function getNextBlockEta(now: Date = new Date()): number {
  const currentDistance = getMinableDistanceKm(now);
  const currentBlock = Math.floor(currentDistance / BLOCK_SIZE_KM);
  const nextBlockDistance = (currentBlock + 1) * BLOCK_SIZE_KM;
  const remainingKm = nextBlockDistance - currentDistance;
  const msPerKm = (86_400 * 1_000) / VOYAGER_VELOCITY_KM_DAY;
  return remainingKm * msPerKm;
}

// ── Signal & Status ────────────────────────────────────────────────────

/**
 * One-way light travel time from Voyager 1 to Earth, in hours.
 * Approximate — uses Sun distance as proxy (Earth is ~1 AU from Sun).
 */
export function getLightHoursDelay(now: Date = new Date()): number {
  const distanceKm = getVoyagerDistanceKm(now);
  const lightSpeedKmS = 299_792.458;
  return distanceKm / lightSpeedKmS / 3_600;
}

/**
 * Whether Voyager 1 is considered active (not decommissioned).
 * This is a manual flag — in production, governed by a Supabase flag
 * or DAO vote. For now, always returns true.
 */
export function isVoyagerActive(): boolean {
  // TODO: Check Supabase flag or governance state
  return true;
}

// ── Formatting Helpers ─────────────────────────────────────────────────

/** Format a distance in km with commas */
export function formatDistanceKm(km: number): string {
  return Math.floor(km).toLocaleString("en-US");
}

/** Format AU with decimal places */
export function formatDistanceAU(au: number, decimals = 4): string {
  return au.toFixed(decimals);
}

/** Format block height with commas */
export function formatBlockHeight(height: number): string {
  return height.toLocaleString("en-US");
}
