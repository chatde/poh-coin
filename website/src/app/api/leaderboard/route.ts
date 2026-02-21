import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Get current active epoch
    const { data: epoch } = await supabase
      .from("epochs")
      .select("epoch_number")
      .eq("status", "active")
      .single();

    const epochNum = epoch?.epoch_number || 0;

    // Top miners by total points (current epoch)
    const { data: topMiners } = await supabase
      .from("rewards")
      .select("wallet_address, total_points, poh_amount")
      .eq("epoch", epochNum)
      .order("total_points", { ascending: false })
      .limit(50);

    // Top miners by all-time earnings
    const { data: allTimeMiners } = await supabase
      .rpc("leaderboard_all_time", { limit_count: 50 });

    // Top validators by reputation
    const { data: topValidators } = await supabase
      .from("nodes")
      .select("wallet_address, reputation, device_id")
      .eq("tier", 2)
      .eq("is_active", true)
      .order("reputation", { ascending: false })
      .limit(20);

    // Regional stats (H3 cell activity)
    const { data: regions } = await supabase
      .from("nodes")
      .select("h3_cell")
      .eq("is_active", true)
      .not("h3_cell", "is", null);

    // Count devices per H3 cell
    const regionCounts = new Map<string, number>();
    regions?.forEach((n) => {
      const count = regionCounts.get(n.h3_cell) || 0;
      regionCounts.set(n.h3_cell, count + 1);
    });

    const topRegions = Array.from(regionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([cell, count]) => ({ h3Cell: cell, deviceCount: count }));

    return NextResponse.json({
      epoch: epochNum,
      topMiners: topMiners || [],
      allTimeMiners: allTimeMiners || [],
      topValidators: topValidators || [],
      topRegions,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
