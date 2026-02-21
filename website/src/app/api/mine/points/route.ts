import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json({ error: "address required" }, { status: 400 });
    }

    const wallet = address.toLowerCase();

    // Get current active epoch
    const { data: epoch } = await supabase
      .from("epochs")
      .select("epoch_number")
      .eq("status", "active")
      .single();

    if (!epoch) {
      return NextResponse.json({ points: 0, epoch: null });
    }

    // Get all devices for this wallet
    const { data: nodes } = await supabase
      .from("nodes")
      .select("device_id")
      .eq("wallet_address", wallet);

    if (!nodes || nodes.length === 0) {
      return NextResponse.json({ points: 0, epoch: epoch.epoch_number });
    }

    const deviceIds = nodes.map((n) => n.device_id);

    // Sum points for all devices in this epoch
    const { data: proofs } = await supabase
      .from("proofs")
      .select("points_earned, tasks_completed, quality_verified")
      .in("device_id", deviceIds)
      .eq("epoch", epoch.epoch_number);

    const totalPoints = proofs?.reduce((sum, p) => sum + Number(p.points_earned), 0) || 0;
    const totalTasks = proofs?.reduce((sum, p) => sum + p.tasks_completed, 0) || 0;
    const verifiedTasks = proofs?.filter((p) => p.quality_verified).length || 0;

    // Get streak info
    const { data: streak } = await supabase
      .from("streaks")
      .select("current_streak, longest_streak")
      .eq("wallet_address", wallet)
      .single();

    return NextResponse.json({
      points: totalPoints,
      tasksCompleted: totalTasks,
      verifiedTasks,
      epoch: epoch.epoch_number,
      streak: streak?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
      devices: nodes.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
