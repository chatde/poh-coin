import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/mine/fitness/leaderboard
 *
 * Returns top 10 fitness miners by weekly effort score.
 */
export async function GET() {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Aggregate effort scores per wallet for the last 7 days
    const { data, error } = await supabase
      .from("fitness_activities")
      .select("wallet_address, effort_score, verified")
      .eq("verified", true)
      .gte("submitted_at", weekAgo);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by wallet
    const walletMap = new Map<string, { effort: number; activities: number }>();
    for (const row of data || []) {
      const addr = row.wallet_address.toLowerCase();
      const existing = walletMap.get(addr) || { effort: 0, activities: 0 };
      existing.effort += Number(row.effort_score) || 0;
      existing.activities += 1;
      walletMap.set(addr, existing);
    }

    // Get streak info for these wallets
    const wallets = Array.from(walletMap.keys());
    const streakMap = new Map<string, number>();

    if (wallets.length > 0) {
      const { data: streaks } = await supabase
        .from("streaks")
        .select("wallet_address, current_streak")
        .in("wallet_address", wallets);

      for (const s of streaks || []) {
        streakMap.set(s.wallet_address.toLowerCase(), s.current_streak || 0);
      }
    }

    // Build sorted leaderboard
    const leaders = Array.from(walletMap.entries())
      .map(([addr, stats]) => ({
        wallet_address: addr,
        week_effort: stats.effort,
        streak: streakMap.get(addr) || 0,
        activities: stats.activities,
      }))
      .sort((a, b) => b.week_effort - a.week_effort)
      .slice(0, 10);

    return NextResponse.json({ leaders });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
