import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateFahBonus } from "@/lib/fah-data";

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet query parameter is required" },
        { status: 400 },
      );
    }

    const { data: link } = await supabase
      .from("fah_links")
      .select("*")
      .eq("wallet_address", wallet)
      .single();

    if (!link) {
      return NextResponse.json({
        linked: false,
        username: null,
        score: 0,
        wus: 0,
        bonusPoints: 0,
        verified: false,
        lastSynced: null,
      });
    }

    return NextResponse.json({
      linked: true,
      username: link.fah_username,
      score: link.fah_score || 0,
      wus: link.fah_wus || 0,
      bonusPoints: calculateFahBonus(link.fah_wus || 0),
      verified: link.verified || false,
      lastSynced: link.last_synced_at,
    });
  } catch (err) {
    console.error("F@H status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
