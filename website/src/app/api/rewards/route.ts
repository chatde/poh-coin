import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json({ error: "address required" }, { status: 400 });
    }

    const wallet = address.toLowerCase();

    // Get all rewards for this wallet
    const { data: rewards, error } = await supabase
      .from("rewards")
      .select(`
        epoch,
        total_points,
        poh_amount,
        claimable_now,
        vesting_amount,
        vesting_duration_days,
        claimed,
        merkle_proof,
        epochs(start_date, end_date, status)
      `)
      .eq("wallet_address", wallet)
      .order("epoch", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Separate into claimable and history
    const unclaimed = rewards?.filter((r) => !r.claimed) || [];
    const claimed = rewards?.filter((r) => r.claimed) || [];

    const totalEarned = rewards?.reduce((sum, r) => sum + Number(r.poh_amount), 0) || 0;
    const totalClaimed = claimed.reduce((sum, r) => sum + Number(r.poh_amount), 0);

    return NextResponse.json({
      unclaimed,
      history: claimed,
      totalEarned,
      totalClaimed,
      totalUnclaimed: totalEarned - totalClaimed,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
