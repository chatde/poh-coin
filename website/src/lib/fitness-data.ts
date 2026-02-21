/**
 * Fitness Data Pipeline — Terra API Integration
 *
 * Connects wearables (Apple Health, Garmin, Strava, Fitbit) via Terra API.
 * Computes Effort Scores for fitness mining rewards.
 *
 * Terra API: 100K free credits/month (~500 active users)
 */

import { supabase } from "@/lib/supabase";

const TERRA_API_KEY = process.env.TERRA_API_KEY || "";
const TERRA_DEV_ID = process.env.TERRA_DEV_ID || "";
const TERRA_BASE_URL = "https://api.tryterra.co/v2";

// ── Types ────────────────────────────────────────────────────────────

export interface FitnessConnection {
  wallet_address: string;
  device_id: string;
  terra_user_id: string;
  provider: string;
  connected_at: string;
  last_sync: string | null;
  is_active: boolean;
}

export interface FitnessActivity {
  activity_hash: string;
  activity_type: string;
  duration_min: number;
  active_minutes: number;
  avg_heart_rate: number | null;
  hr_zone_minutes: Record<string, number> | null;
  calories: number | null;
  distance_m: number | null;
  effort_score: number;
  source_provider: string;
  raw_data_hash: string;
  verified: boolean;
}

export interface EffortScoreBreakdown {
  base_score: number;
  hr_zone_factor: number;
  consistency_bonus: number;
  final_score: number;
}

// ── HR Zone Factors ──────────────────────────────────────────────────

const HR_ZONE_FACTORS = [0, 0.5, 1.0, 1.5, 2.0, 2.5]; // zones 0-5

// ── SHA-256 Hashing ──────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Effort Score Computation ─────────────────────────────────────────

export function computeEffortScore(
  activeMinutes: number,
  hrZoneMinutes: Record<string, number> | null,
  consecutiveDays: number,
): EffortScoreBreakdown {
  // Base score from active minutes
  const baseScore = activeMinutes;

  // HR zone weighted factor
  let hrZoneFactor = 1.0;
  if (hrZoneMinutes) {
    const totalZoneMinutes = Object.values(hrZoneMinutes).reduce((a, b) => a + b, 0);
    if (totalZoneMinutes > 0) {
      let weightedSum = 0;
      for (let zone = 1; zone <= 5; zone++) {
        const mins = hrZoneMinutes[`zone${zone}`] || 0;
        weightedSum += mins * HR_ZONE_FACTORS[zone];
      }
      hrZoneFactor = weightedSum / totalZoneMinutes;
    }
  }

  // Consistency bonus: +5% per consecutive day, max 50% (1.5x)
  const consistencyBonus = Math.min(1.5, 1.0 + consecutiveDays * 0.05);

  const finalScore = baseScore * hrZoneFactor * consistencyBonus;

  return {
    base_score: baseScore,
    hr_zone_factor: hrZoneFactor,
    consistency_bonus: consistencyBonus,
    final_score: Math.round(finalScore * 100) / 100,
  };
}

// ── Activity Deduplication ───────────────────────────────────────────

export async function computeActivityHash(
  userId: string,
  activityStartTime: string,
  activityType: string,
  durationMin: number,
): Promise<string> {
  return sha256(`${userId}:${activityStartTime}:${activityType}:${durationMin}`);
}

// ── Terra API Integration ────────────────────────────────────────────

/** Generate Terra widget session for OAuth flow */
export async function generateTerraWidgetSession(
  referenceId: string,
): Promise<{ url: string; session_id: string } | null> {
  try {
    const res = await fetch(`${TERRA_BASE_URL}/auth/generateWidgetSession`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TERRA_API_KEY,
        "dev-id": TERRA_DEV_ID,
      },
      body: JSON.stringify({
        reference_id: referenceId,
        providers: "APPLE,GARMIN,STRAVA,FITBIT",
        language: "en",
        auth_success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/mine/setup?terra=success`,
        auth_failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/mine/setup?terra=failed`,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      url: data.url,
      session_id: data.session_id,
    };
  } catch {
    return null;
  }
}

/** Store a Terra user connection after successful OAuth */
export async function storeTerraConnection(
  walletAddress: string,
  deviceId: string,
  terraUserId: string,
  provider: string,
): Promise<boolean> {
  const { error } = await supabase.from("fitness_connections").upsert({
    wallet_address: walletAddress.toLowerCase(),
    device_id: deviceId,
    terra_user_id: terraUserId,
    provider: provider.toLowerCase(),
    connected_at: new Date().toISOString(),
    is_active: true,
  }, { onConflict: "terra_user_id" });

  return !error;
}

/** Deactivate a Terra connection */
export async function disconnectTerra(
  walletAddress: string,
  terraUserId: string,
): Promise<boolean> {
  // Deauthenticate from Terra
  try {
    await fetch(`${TERRA_BASE_URL}/auth/deauthenticateUser`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TERRA_API_KEY,
        "dev-id": TERRA_DEV_ID,
      },
      body: JSON.stringify({ user_id: terraUserId }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Continue even if Terra API fails
  }

  const { error } = await supabase
    .from("fitness_connections")
    .update({ is_active: false })
    .eq("wallet_address", walletAddress.toLowerCase())
    .eq("terra_user_id", terraUserId);

  return !error;
}

// ── Terra Activity Sync ──────────────────────────────────────────────

interface TerraActivity {
  metadata: {
    start_time: string;
    end_time: string;
    type: number;
    name?: string;
  };
  distance_data?: { distance_meters: number };
  calories_data?: { total_burned_calories: number };
  heart_rate_data?: {
    summary: { avg_hr_bpm: number };
    hr_samples?: Array<{ bpm: number; timestamp: string }>;
  };
  active_durations_data?: {
    activity_seconds: number;
  };
  MET_data?: {
    MET_samples: Array<{ level: number }>;
  };
}

function mapTerraActivityType(typeNum: number): string {
  const typeMap: Record<number, string> = {
    0: "workout", 1: "run", 2: "cycle", 3: "swim", 4: "workout",
    5: "walk", 6: "hike", 7: "cycle", 8: "workout", 9: "run",
    10: "workout", 11: "yoga", 12: "workout",
  };
  return typeMap[typeNum] || "workout";
}

function estimateHrZones(avgHr: number, durationMin: number): Record<string, number> {
  // Estimate zone distribution based on average HR
  // Assumes max HR ~190 for simplicity
  const maxHr = 190;
  const pctMax = avgHr / maxHr;
  const zones: Record<string, number> = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };

  if (pctMax < 0.5) {
    zones.zone1 = durationMin;
  } else if (pctMax < 0.6) {
    zones.zone1 = durationMin * 0.3;
    zones.zone2 = durationMin * 0.7;
  } else if (pctMax < 0.7) {
    zones.zone2 = durationMin * 0.5;
    zones.zone3 = durationMin * 0.5;
  } else if (pctMax < 0.8) {
    zones.zone3 = durationMin * 0.6;
    zones.zone4 = durationMin * 0.4;
  } else if (pctMax < 0.9) {
    zones.zone4 = durationMin * 0.7;
    zones.zone5 = durationMin * 0.3;
  } else {
    zones.zone4 = durationMin * 0.3;
    zones.zone5 = durationMin * 0.7;
  }

  // Round all values
  for (const key of Object.keys(zones)) {
    zones[key] = Math.round(zones[key]);
  }

  return zones;
}

/** Sync activities from Terra for a user, compute effort scores, store in DB */
export async function syncFitnessActivities(
  walletAddress: string,
  deviceId: string,
  terraUserId: string,
  provider: string,
): Promise<{ synced: number; duplicates: number; errors: number }> {
  const result = { synced: 0, duplicates: 0, errors: 0 };

  try {
    // Fetch last 7 days of activities
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    const url = `${TERRA_BASE_URL}/activity?user_id=${terraUserId}&start_date=${startDate}&end_date=${endDate}`;
    const res = await fetch(url, {
      headers: {
        "x-api-key": TERRA_API_KEY,
        "dev-id": TERRA_DEV_ID,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      result.errors = 1;
      return result;
    }

    const data = await res.json();
    const activities: TerraActivity[] = data.data || [];

    // Get consecutive days for consistency bonus
    const { data: streakData } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();
    const consecutiveDays = streakData?.current_streak || 0;

    for (const activity of activities) {
      try {
        const startTime = activity.metadata.start_time;
        const activityType = mapTerraActivityType(activity.metadata.type);
        const activitySeconds = activity.active_durations_data?.activity_seconds || 0;
        const durationMin = activitySeconds / 60;

        // Skip very short activities
        if (durationMin < 5) continue;

        // Compute dedup hash
        const activityHash = await computeActivityHash(
          walletAddress, startTime, activityType, Math.round(durationMin)
        );

        // Check for duplicates
        const { data: existing } = await supabase
          .from("fitness_activities")
          .select("id")
          .eq("activity_hash", activityHash)
          .single();

        if (existing) {
          result.duplicates++;
          continue;
        }

        const avgHr = activity.heart_rate_data?.summary?.avg_hr_bpm || null;
        const hrZoneMinutes = avgHr ? estimateHrZones(avgHr, durationMin) : null;
        const activeMinutes = durationMin; // Simplification — use active_durations if available

        // Compute effort score
        const effortBreakdown = computeEffortScore(activeMinutes, hrZoneMinutes, consecutiveDays);

        // SHA-256 of raw payload for audit
        const rawDataHash = await sha256(JSON.stringify(activity));

        const { error } = await supabase.from("fitness_activities").insert({
          wallet_address: walletAddress.toLowerCase(),
          device_id: deviceId,
          activity_hash: activityHash,
          activity_type: activityType,
          duration_min: Math.round(durationMin * 10) / 10,
          active_minutes: Math.round(activeMinutes * 10) / 10,
          avg_heart_rate: avgHr,
          hr_zone_minutes: hrZoneMinutes,
          calories: activity.calories_data?.total_burned_calories || null,
          distance_m: activity.distance_data?.distance_meters || null,
          effort_score: effortBreakdown.final_score,
          source_provider: provider,
          raw_data_hash: rawDataHash,
          verified: false,
        });

        if (error) {
          result.errors++;
        } else {
          result.synced++;
        }
      } catch {
        result.errors++;
      }
    }

    // Update last_sync
    await supabase
      .from("fitness_connections")
      .update({ last_sync: new Date().toISOString() })
      .eq("terra_user_id", terraUserId);

  } catch {
    result.errors++;
  }

  return result;
}

// ── Fitness Verification Payload Builder ─────────────────────────────

export interface FitnessVerifyPayload {
  activity_id: number;
  activity_type: string;
  duration_min: number;
  active_minutes: number;
  avg_heart_rate: number | null;
  hr_zone_minutes: Record<string, number> | null;
  calories: number | null;
  distance_m: number | null;
  effort_score: number;
  overlapping_activities: Array<{ start: string; end: string }>;
  user_history: Array<{
    activity_type: string;
    duration_min: number;
    avg_heart_rate: number | null;
    distance_m: number | null;
  }>;
}

/** Build a fitness verification task payload for DePIN nodes to verify */
export async function buildFitnessVerifyPayload(
  activityId: number,
): Promise<FitnessVerifyPayload | null> {
  const { data: activity } = await supabase
    .from("fitness_activities")
    .select("*")
    .eq("id", activityId)
    .single();

  if (!activity) return null;

  // Get recent history for this user (for baseline comparison)
  const { data: history } = await supabase
    .from("fitness_activities")
    .select("activity_type, duration_min, avg_heart_rate, distance_m")
    .eq("wallet_address", activity.wallet_address)
    .eq("verified", true)
    .order("submitted_at", { ascending: false })
    .limit(20);

  return {
    activity_id: activity.id,
    activity_type: activity.activity_type,
    duration_min: activity.duration_min,
    active_minutes: activity.active_minutes,
    avg_heart_rate: activity.avg_heart_rate,
    hr_zone_minutes: activity.hr_zone_minutes,
    calories: activity.calories,
    distance_m: activity.distance_m,
    effort_score: activity.effort_score,
    overlapping_activities: [], // Populated by checking time ranges
    user_history: history || [],
  };
}
