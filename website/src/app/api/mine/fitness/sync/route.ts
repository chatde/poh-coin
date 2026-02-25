import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { syncFitnessActivities } from "@/lib/fitness-data";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import type { FitnessConnection } from "@/lib/fitness-data";

/**
 * POST /api/mine/fitness/sync
 *
 * Pull latest activities from Strava, compute effort scores, store in DB.
 * Rate limited: max 10 syncs/wallet/hour.
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, deviceId } = await req.json();

    if (!walletAddress || !deviceId) {
      return NextResponse.json(
        { error: "walletAddress and deviceId are required" },
        { status: 400 },
      );
    }

    // Rate limit
    const syncKey = `fitness-sync:${walletAddress.toLowerCase()}`;
    const allowed = await checkRateLimit(
      syncKey,
      RATE_LIMITS.FITNESS_SYNC.maxCount,
      RATE_LIMITS.FITNESS_SYNC.windowMs,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many sync requests. Max 10 per hour." },
        { status: 429 },
      );
    }

    // Get active fitness connection for this wallet (with tokens)
    const { data: connection } = await supabase
      .from("fitness_connections")
      .select("id, wallet_address, device_id, provider_user_id, provider, access_token, refresh_token, token_expires_at, connected_at, last_sync, is_active")
      .eq("wallet_address", walletAddress.toLowerCase())
      .eq("device_id", deviceId)
      .eq("is_active", true)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: "No active fitness connection found. Connect a wearable first." },
        { status: 404 },
      );
    }

    // Sync activities
    const result = await syncFitnessActivities(
      walletAddress,
      deviceId,
      connection as FitnessConnection,
    );

    // Get today's total effort score
    const today = new Date().toISOString().split("T")[0];
    const { data: todayActivities } = await supabase
      .from("fitness_activities")
      .select("effort_score")
      .eq("wallet_address", walletAddress.toLowerCase())
      .gte("submitted_at", `${today}T00:00:00Z`);

    const todayEffort = todayActivities?.reduce((sum, a) => sum + (a.effort_score || 0), 0) || 0;

    return NextResponse.json({
      synced: result.synced,
      duplicates: result.duplicates,
      errors: result.errors,
      todayEffortScore: Math.round(todayEffort * 100) / 100,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
