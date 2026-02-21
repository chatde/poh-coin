import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateChallenge, verifyChallenge } from "@/lib/crypto";
import { THROTTLE_TEMP_C, STOP_TEMP_C } from "@/lib/constants";

// In-memory challenge store (per-instance; fine for single-region deploy)
// In production, store in Redis or Supabase
const pendingChallenges = new Map<string, { challenge: string; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const { deviceId, challenge, response, batteryPct, temperatureC } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // If no challenge provided, issue a new one
    if (!challenge) {
      const newChallenge = generateChallenge();
      pendingChallenges.set(deviceId, {
        challenge: newChallenge,
        expires: Date.now() + 60_000, // 1 minute to respond
      });
      return NextResponse.json({ challenge: newChallenge });
    }

    // Verify challenge-response
    const pending = pendingChallenges.get(deviceId);
    if (!pending || pending.challenge !== challenge || Date.now() > pending.expires) {
      return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 401 });
    }

    if (!verifyChallenge(challenge, deviceId, response)) {
      return NextResponse.json({ error: "Invalid response" }, { status: 401 });
    }

    pendingChallenges.delete(deviceId);

    // Determine compute status based on battery/temperature
    let computeStatus = "active";
    if (temperatureC && temperatureC >= STOP_TEMP_C) {
      computeStatus = "stopped";
    } else if (temperatureC && temperatureC >= THROTTLE_TEMP_C) {
      computeStatus = "throttled";
    }

    // Record heartbeat
    const { error: hbError } = await supabase.from("heartbeats").insert({
      device_id: deviceId,
      battery_pct: batteryPct || null,
      temperature_c: temperatureC || null,
      compute_status: computeStatus,
      challenge,
      response,
    });

    if (hbError) {
      return NextResponse.json({ error: hbError.message }, { status: 500 });
    }

    // Update node's last heartbeat
    await supabase
      .from("nodes")
      .update({ last_heartbeat: new Date().toISOString() })
      .eq("device_id", deviceId);

    return NextResponse.json({
      ok: true,
      computeStatus,
      nextHeartbeatMs: 15 * 60 * 1000,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
