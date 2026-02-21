import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { STARTING_REPUTATION } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { deviceId, walletAddress, tier, h3Cell } = await req.json();

    if (!deviceId || !walletAddress) {
      return NextResponse.json(
        { error: "deviceId and walletAddress are required" },
        { status: 400 }
      );
    }

    if (tier && ![1, 2].includes(tier)) {
      return NextResponse.json(
        { error: "tier must be 1 (data node) or 2 (validator)" },
        { status: 400 }
      );
    }

    // Check if device already registered
    const { data: existing } = await supabase
      .from("nodes")
      .select("device_id")
      .eq("device_id", deviceId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Device already registered" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase.from("nodes").insert({
      device_id: deviceId,
      wallet_address: walletAddress.toLowerCase(),
      tier: tier || 1,
      h3_cell: h3Cell || null,
      reputation: STARTING_REPUTATION,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Initialize streak tracking
    await supabase.from("streaks").upsert({
      wallet_address: walletAddress.toLowerCase(),
      current_streak: 0,
      longest_streak: 0,
    });

    return NextResponse.json({ node: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
