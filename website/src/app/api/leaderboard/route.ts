import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface ProofRow {
  device_id: string;
  points_earned: number;
  nodes: { wallet_address: string } | null;
}

interface RewardRow {
  wallet_address: string;
  poh_amount: number;
}

export async function GET() {
  try {
    // Get current active epoch
    const { data: epoch } = await supabase
      .from("epochs")
      .select("epoch_number")
      .eq("status", "active")
      .single();

    const epochNum = epoch?.epoch_number || 0;

    // Top miners by total points (current epoch) — query proofs joined to nodes
    const { data: proofRows } = await supabase
      .from("proofs")
      .select("device_id, points_earned, nodes(wallet_address)")
      .eq("epoch", epochNum)
      .not("nodes", "is", null);

    // Aggregate by wallet
    const walletPoints = new Map<string, number>();
    (proofRows as ProofRow[] | null)?.forEach((p) => {
      const wallet = p.nodes?.wallet_address;
      if (!wallet) return;
      walletPoints.set(wallet, (walletPoints.get(wallet) || 0) + Number(p.points_earned));
    });

    const topMiners = Array.from(walletPoints.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([wallet_address, total_points]) => ({ wallet_address, total_points }));

    // All-time miners — sum poh_amount from rewards table by wallet
    const { data: allTimeData } = await supabase
      .from("rewards")
      .select("wallet_address, poh_amount")
      .order("poh_amount", { ascending: false })
      .limit(50);

    const walletPoh = new Map<string, number>();
    (allTimeData as RewardRow[] | null)?.forEach((r) => {
      walletPoh.set(r.wallet_address, (walletPoh.get(r.wallet_address) || 0) + Number(r.poh_amount));
    });

    const allTimeMiners = Array.from(walletPoh.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([wallet_address, poh_amount]) => ({ wallet_address, poh_amount }));

    // Active miners — nodes with last_heartbeat within the last 15 minutes
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: activeNodes } = await supabase
      .from("nodes")
      .select("wallet_address, device_id, tier, reputation")
      .gte("last_heartbeat", cutoff)
      .eq("is_active", true)
      .order("reputation", { ascending: false });

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
      topMiners,
      allTimeMiners,
      activeMiners: activeNodes || [],
      topValidators: topValidators || [],
      topRegions,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
