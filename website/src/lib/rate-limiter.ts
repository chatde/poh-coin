/**
 * Rate Limiter — Sliding Window Counters in Supabase
 *
 * Applied to: registration, task requests, submissions, fitness activity submissions.
 * Uses 1-minute windows aggregated into sliding periods.
 */

import { supabase } from "@/lib/supabase";

/**
 * Check if an action is within rate limits.
 *
 * @param key - Rate limit key (e.g. "register:wallet:0x...", "task:deviceId", "fitness:wallet:0x...")
 * @param maxCount - Maximum allowed actions in the window
 * @param windowMs - Window duration in milliseconds
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Count recent entries
    const { count, error: countError } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("key", key)
      .gte("window_start", windowStart.toISOString());

    if (countError) return true; // Fail open on DB errors

    if ((count || 0) >= maxCount) {
      return false; // Rate limited
    }

    // Record this action
    await supabase.from("rate_limits").insert({
      key,
      window_start: now.toISOString(),
      count: 1,
    });

    return true;
  } catch {
    return true; // Fail open
  }
}

/**
 * Clean up expired rate limit entries (call periodically).
 * Removes entries older than 24 hours.
 */
export async function cleanupRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("rate_limits")
    .delete()
    .lt("window_start", cutoff);
}

// ── Predefined rate limit configs ────────────────────────────────────

export const RATE_LIMITS = {
  /** Max 3 device registrations per wallet per day */
  REGISTER_PER_WALLET: { maxCount: 3, windowMs: 24 * 60 * 60 * 1000 },

  /** Max 5 registrations per IP per hour */
  REGISTER_PER_IP: { maxCount: 5, windowMs: 60 * 60 * 1000 },

  /** Max 60 task requests per device per hour */
  TASK_REQUEST: { maxCount: 60, windowMs: 60 * 60 * 1000 },

  /** Max 60 submissions per device per hour */
  SUBMIT: { maxCount: 60, windowMs: 60 * 60 * 1000 },

  /** Max 20 fitness activities per wallet per day */
  FITNESS_ACTIVITY: { maxCount: 20, windowMs: 24 * 60 * 60 * 1000 },

  /** Max 10 fitness syncs per wallet per hour */
  FITNESS_SYNC: { maxCount: 10, windowMs: 60 * 60 * 1000 },
} as const;
