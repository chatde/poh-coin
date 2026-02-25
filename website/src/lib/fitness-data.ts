/**
 * Fitness Data Pipeline — Strava Integration
 *
 * Connects wearables via OAuth 2.0 directly to the Strava API.
 * Computes Effort Scores for fitness mining rewards.
 *
 * Strava: runs, rides, swims, yoga — Apple Health syncs via Strava app
 * Fitbit: provider code retained but disabled (not registered in provider map)
 */

import { supabase } from "@/lib/supabase";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || "";
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "";
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || "";
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || "";
const OAUTH_STATE_SECRET = process.env.OAUTH_STATE_SECRET || "poh-oauth-state-secret";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

// ── Types ────────────────────────────────────────────────────────────

export interface FitnessConnection {
  id: number;
  wallet_address: string;
  device_id: string;
  provider_user_id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
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

interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  providerUserId: string;
}

interface NormalizedActivity {
  startTime: string;
  type: string;
  elapsedSeconds: number;
  movingSeconds: number;
  avgHeartRate: number | null;
  calories: number | null;
  distanceMeters: number | null;
  rawPayload: unknown;
}

// ── Provider Interface ──────────────────────────────────────────────

interface FitnessProvider {
  name: string;
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<OAuthTokens | null>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null>;
  fetchActivities(accessToken: string, since: Date): Promise<NormalizedActivity[]>;
  revokeToken(accessToken: string): Promise<boolean>;
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

// ── HR Zone Estimation ───────────────────────────────────────────────

function estimateHrZones(avgHr: number, durationMin: number): Record<string, number> {
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

  for (const key of Object.keys(zones)) {
    zones[key] = Math.round(zones[key]);
  }

  return zones;
}

// ── OAuth State (HMAC-signed) ────────────────────────────────────────

export async function createOAuthState(walletAddress: string, deviceId: string): Promise<string> {
  const payload = JSON.stringify({
    walletAddress: walletAddress.toLowerCase(),
    deviceId,
    timestamp: Date.now(),
  });

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(OAUTH_STATE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // base64url encode: payload.signature
  const b64Payload = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64Sig = btoa(sig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64Payload}.${b64Sig}`;
}

export async function verifyOAuthState(
  state: string,
): Promise<{ walletAddress: string; deviceId: string } | null> {
  try {
    const [b64Payload, b64Sig] = state.split(".");
    if (!b64Payload || !b64Sig) return null;

    // Restore base64 padding
    const payload = atob(b64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    const sig = atob(b64Sig.replace(/-/g, "+").replace(/_/g, "/"));

    // Verify HMAC
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(OAUTH_STATE_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSig = Array.from(new Uint8Array(expectedSigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (sig !== expectedSig) return null;

    const parsed = JSON.parse(payload);

    // Check 10-minute expiry
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) return null;

    return {
      walletAddress: parsed.walletAddress,
      deviceId: parsed.deviceId,
    };
  } catch {
    return null;
  }
}

// ── Strava Provider ──────────────────────────────────────────────────

const STRAVA_TYPE_MAP: Record<string, string> = {
  Run: "run",
  VirtualRun: "run",
  TrailRun: "run",
  Ride: "cycle",
  VirtualRide: "cycle",
  GravelRide: "cycle",
  MountainBikeRide: "cycle",
  EBikeRide: "cycle",
  Walk: "walk",
  Hike: "hike",
  Swim: "swim",
  Yoga: "yoga",
  Workout: "workout",
  WeightTraining: "workout",
  Crossfit: "workout",
  Elliptical: "workout",
  StairStepper: "workout",
  Rowing: "workout",
  RockClimbing: "workout",
};

const stravaProvider: FitnessProvider = {
  name: "strava",

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      response_type: "code",
      redirect_uri: `${APP_URL}/api/mine/fitness/callback`,
      scope: "activity:read_all",
      state: `strava.${state}`,
      approval_prompt: "auto",
    });
    return `https://www.strava.com/oauth/authorize?${params}`;
  },

  async exchangeCode(code: string): Promise<OAuthTokens | null> {
    try {
      const res = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * 1000),
        providerUserId: String(data.athlete?.id || ""),
      };
    } catch {
      return null;
    }
  },

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
    try {
      const res = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * 1000),
        providerUserId: "",
      };
    } catch {
      return null;
    }
  },

  async fetchActivities(accessToken: string, since: Date): Promise<NormalizedActivity[]> {
    try {
      const after = Math.floor(since.getTime() / 1000);
      const res = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=30`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!res.ok) return [];
      const activities = await res.json();
      return (activities as Array<Record<string, unknown>>).map((a) => ({
        startTime: a.start_date as string,
        type: STRAVA_TYPE_MAP[a.type as string] || "workout",
        elapsedSeconds: (a.elapsed_time as number) || 0,
        movingSeconds: (a.moving_time as number) || 0,
        avgHeartRate: (a.average_heartrate as number) || null,
        calories: (a.calories as number) || null,
        distanceMeters: (a.distance as number) || null,
        rawPayload: a,
      }));
    } catch {
      return [];
    }
  },

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const res = await fetch(
        `https://www.strava.com/oauth/deauthorize?access_token=${accessToken}`,
        { method: "POST", signal: AbortSignal.timeout(10_000) },
      );
      return res.ok;
    } catch {
      return false;
    }
  },
};

// ── Fitbit Provider ──────────────────────────────────────────────────

const fitbitProvider: FitnessProvider = {
  name: "fitbit",

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: FITBIT_CLIENT_ID,
      response_type: "code",
      redirect_uri: `${APP_URL}/api/mine/fitness/callback`,
      scope: "activity heartrate",
      state: `fitbit.${state}`,
    });
    return `https://www.fitbit.com/oauth2/authorize?${params}`;
  },

  async exchangeCode(code: string): Promise<OAuthTokens | null> {
    try {
      const basicAuth = btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`);
      const res = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          redirect_uri: `${APP_URL}/api/mine/fitness/callback`,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        providerUserId: data.user_id || "",
      };
    } catch {
      return null;
    }
  },

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
    try {
      const basicAuth = btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`);
      const res = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        providerUserId: data.user_id || "",
      };
    } catch {
      return null;
    }
  },

  async fetchActivities(accessToken: string, since: Date): Promise<NormalizedActivity[]> {
    try {
      const afterDate = since.toISOString().split("T")[0];
      const res = await fetch(
        `https://api.fitbit.com/1/user/-/activities/list.json?afterDate=${afterDate}&sort=desc&limit=20&offset=0`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!res.ok) return [];
      const data = await res.json();
      const activities = data.activities || [];
      return (activities as Array<Record<string, unknown>>).map((a) => {
        const name = ((a.activityName as string) || "").toLowerCase();
        let type = "workout";
        if (name.includes("run") || name.includes("jog")) type = "run";
        else if (name.includes("walk")) type = "walk";
        else if (name.includes("bike") || name.includes("cycl") || name.includes("ride")) type = "cycle";
        else if (name.includes("swim")) type = "swim";
        else if (name.includes("hike")) type = "hike";
        else if (name.includes("yoga")) type = "yoga";

        return {
          startTime: (a.startTime as string) || (a.startDate as string) || new Date().toISOString(),
          type,
          elapsedSeconds: (a.activeDuration as number || 0) / 1000,
          movingSeconds: (a.activeDuration as number || 0) / 1000,
          avgHeartRate: (a.averageHeartRate as number) || null,
          calories: (a.calories as number) || null,
          distanceMeters: a.distance ? (a.distance as number) * 1000 : null, // Fitbit returns km
          rawPayload: a,
        };
      });
    } catch {
      return [];
    }
  },

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const basicAuth = btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`);
      const res = await fetch("https://api.fitbit.com/oauth2/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({ token: accessToken }),
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

// ── Provider Registry ────────────────────────────────────────────────

const providers: Record<string, FitnessProvider> = {
  strava: stravaProvider,
  // fitbit: fitbitProvider,  // Disabled — re-enable when Fitbit OAuth credentials are configured
};

export function getProvider(name: string): FitnessProvider | null {
  return providers[name.toLowerCase()] || null;
}

// ── Token Refresh ────────────────────────────────────────────────────

export async function ensureValidToken(
  connection: FitnessConnection,
): Promise<{ accessToken: string; updated: boolean } | null> {
  const provider = getProvider(connection.provider);
  if (!provider || !connection.access_token) return null;

  // Check if token expires within 5 minutes
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  if (expiresAt && expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return { accessToken: connection.access_token, updated: false };
  }

  // Token expired or expiring soon — refresh
  if (!connection.refresh_token) return null;
  const tokens = await provider.refreshAccessToken(connection.refresh_token);
  if (!tokens) return null;

  // Update DB with new tokens
  await supabase
    .from("fitness_connections")
    .update({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expires_at: tokens.expiresAt.toISOString(),
    })
    .eq("id", connection.id);

  return { accessToken: tokens.accessToken, updated: true };
}

// ── Store Connection ─────────────────────────────────────────────────

export async function storeConnection(
  walletAddress: string,
  deviceId: string,
  providerName: string,
  tokens: OAuthTokens,
): Promise<boolean> {
  // Deactivate any existing connection for this wallet + provider
  await supabase
    .from("fitness_connections")
    .update({ is_active: false })
    .eq("wallet_address", walletAddress.toLowerCase())
    .eq("provider", providerName)
    .eq("is_active", true);

  const { error } = await supabase.from("fitness_connections").insert({
    wallet_address: walletAddress.toLowerCase(),
    device_id: deviceId,
    provider_user_id: `${providerName}:${tokens.providerUserId}`,
    provider: providerName,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_expires_at: tokens.expiresAt.toISOString(),
    connected_at: new Date().toISOString(),
    is_active: true,
  });

  return !error;
}

// ── Disconnect ───────────────────────────────────────────────────────

export async function disconnectProvider(
  walletAddress: string,
  connection: FitnessConnection,
): Promise<boolean> {
  const provider = getProvider(connection.provider);

  // Attempt token revocation (best-effort)
  if (provider && connection.access_token) {
    await provider.revokeToken(connection.access_token);
  }

  const { error } = await supabase
    .from("fitness_connections")
    .update({
      is_active: false,
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
    })
    .eq("wallet_address", walletAddress.toLowerCase())
    .eq("id", connection.id);

  return !error;
}

// ── Activity Sync ────────────────────────────────────────────────────

export async function syncFitnessActivities(
  walletAddress: string,
  deviceId: string,
  connection: FitnessConnection,
): Promise<{ synced: number; duplicates: number; errors: number }> {
  const result = { synced: 0, duplicates: 0, errors: 0 };

  const provider = getProvider(connection.provider);
  if (!provider) {
    result.errors = 1;
    return result;
  }

  // Ensure valid access token
  const tokenResult = await ensureValidToken(connection);
  if (!tokenResult) {
    result.errors = 1;
    return result;
  }

  try {
    // Fetch last 7 days of activities
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activities = await provider.fetchActivities(tokenResult.accessToken, since);

    // Get consecutive days for consistency bonus
    const { data: streakData } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();
    const consecutiveDays = streakData?.current_streak || 0;

    for (const activity of activities) {
      try {
        const durationMin = activity.movingSeconds / 60;

        // Skip very short activities
        if (durationMin < 5) continue;

        // Compute dedup hash
        const activityHash = await computeActivityHash(
          walletAddress, activity.startTime, activity.type, Math.round(durationMin),
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

        const avgHr = activity.avgHeartRate;
        const hrZoneMinutes = avgHr ? estimateHrZones(avgHr, durationMin) : null;

        // Compute effort score
        const effortBreakdown = computeEffortScore(durationMin, hrZoneMinutes, consecutiveDays);

        // SHA-256 of raw payload for audit
        const rawDataHash = await sha256(JSON.stringify(activity.rawPayload));

        const { error } = await supabase.from("fitness_activities").insert({
          wallet_address: walletAddress.toLowerCase(),
          device_id: deviceId,
          activity_hash: activityHash,
          activity_type: activity.type,
          duration_min: Math.round(durationMin * 10) / 10,
          active_minutes: Math.round(durationMin * 10) / 10,
          avg_heart_rate: avgHr,
          hr_zone_minutes: hrZoneMinutes,
          calories: activity.calories,
          distance_m: activity.distanceMeters,
          effort_score: effortBreakdown.final_score,
          source_provider: connection.provider,
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
      .eq("id", connection.id);
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
