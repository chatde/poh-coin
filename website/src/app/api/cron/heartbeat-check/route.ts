import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { HEARTBEAT_INTERVAL_MS, HEARTBEAT_GRACE_MS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret (Vercel Cron or manual trigger)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date(
      Date.now() - HEARTBEAT_INTERVAL_MS - HEARTBEAT_GRACE_MS
    ).toISOString();

    // Find active nodes with stale heartbeats
    const { data: staleNodes } = await supabase
      .from("nodes")
      .select("device_id, wallet_address, last_heartbeat")
      .eq("is_active", true)
      .lt("last_heartbeat", cutoff);

    if (!staleNodes || staleNodes.length === 0) {
      return NextResponse.json({ flagged: 0 });
    }

    // Deactivate nodes with missed heartbeats
    const deviceIds = staleNodes.map((n) => n.device_id);
    await supabase
      .from("nodes")
      .update({ is_active: false })
      .in("device_id", deviceIds);

    return NextResponse.json({
      flagged: staleNodes.length,
      devices: deviceIds,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
