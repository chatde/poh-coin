import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { THROTTLE_TEMP_C, STOP_TEMP_C } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { deviceId, challenge, response, batteryPct, temperatureC } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // If no challenge provided, issue a new one and store in DB
    if (!challenge) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const newChallenge = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");

      // Store challenge in heartbeats table as a pending challenge
      await supabase.from("heartbeats").insert({
        device_id: deviceId,
        challenge: newChallenge,
        response: null,
        compute_status: "pending",
      });

      return NextResponse.json({ challenge: newChallenge });
    }

    // Verify challenge-response: find the pending challenge in DB
    const { data: pending } = await supabase
      .from("heartbeats")
      .select("id, created_at")
      .eq("device_id", deviceId)
      .eq("challenge", challenge)
      .eq("compute_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!pending) {
      return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 401 });
    }

    // Check expiry (60 seconds)
    const createdAt = new Date(pending.created_at).getTime();
    if (Date.now() - createdAt > 60_000) {
      // Clean up expired challenge
      await supabase.from("heartbeats").delete().eq("id", pending.id);
      return NextResponse.json({ error: "Challenge expired" }, { status: 401 });
    }

    // Verify response = SHA256(challenge + deviceId)
    const encoder = new TextEncoder();
    const data = encoder.encode(challenge + deviceId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const expected = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expected !== response) {
      return NextResponse.json({ error: "Invalid response" }, { status: 401 });
    }

    // Determine compute status based on battery/temperature
    let computeStatus = "active";
    if (temperatureC && temperatureC >= STOP_TEMP_C) {
      computeStatus = "stopped";
    } else if (temperatureC && temperatureC >= THROTTLE_TEMP_C) {
      computeStatus = "throttled";
    }

    // Update the pending heartbeat to mark it verified
    await supabase
      .from("heartbeats")
      .update({
        response,
        battery_pct: batteryPct || null,
        temperature_c: temperatureC || null,
        compute_status: computeStatus,
      })
      .eq("id", pending.id);

    // Update node's last heartbeat
    await supabase
      .from("nodes")
      .update({ last_heartbeat: new Date().toISOString(), is_active: true })
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
