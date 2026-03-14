import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateWeeklyPool } from "@/lib/constants";

export async function GET() {
  try {
    const heartbeatCutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    // Active nodes (with heartbeat freshness check)
    const { count: activeNodes } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gte("last_heartbeat", heartbeatCutoff);

    // Total registered nodes (regardless of heartbeat)
    const { count: registeredNodes } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true });

    // Active validators (with heartbeat freshness check)
    const { count: activeValidators } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true })
      .eq("tier", 2)
      .eq("is_active", true)
      .gte("last_heartbeat", heartbeatCutoff);

    // Verified tasks
    const { count: verifiedTasks } = await supabase
      .from("compute_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // Total distributed
    const { data: totalDist } = await supabase
      .from("rewards")
      .select("poh_amount")
      .eq("claimed", true);

    const totalDistributed = totalDist?.reduce(
      (sum, r) => sum + Number(r.poh_amount), 0
    ) || 0;

    // Unique miners (with heartbeat freshness check)
    const { data: uniqueMinersData } = await supabase
      .from("nodes")
      .select("wallet_address")
      .eq("is_active", true)
      .gte("last_heartbeat", heartbeatCutoff);

    const uniqueMiners = new Set(uniqueMinersData?.map((n) => n.wallet_address)).size;

    // Current epoch
    const { data: epoch } = await supabase
      .from("epochs")
      .select("epoch_number, start_date, end_date")
      .eq("status", "active")
      .single();

    return NextResponse.json({
      activeNodes: activeNodes || 0,
      registeredNodes: registeredNodes || 0,
      activeValidators: activeValidators || 0,
      verifiedTasks: verifiedTasks || 0,
      totalDistributed,
      uniqueMiners,
      currentEpoch: epoch?.epoch_number || 0,
      weeklyPool: calculateWeeklyPool(),
      epochStart: epoch?.start_date || null,
      epochEnd: epoch?.end_date || null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
