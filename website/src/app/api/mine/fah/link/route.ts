import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { lookupFahUser, FAH_TEAM_ID } from "@/lib/fah-data";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, fahUsername } = await req.json();

    if (!walletAddress || !fahUsername) {
      return NextResponse.json(
        { error: "walletAddress and fahUsername are required" },
        { status: 400 },
      );
    }

    const wallet = walletAddress.toLowerCase();

    // Validate wallet exists in nodes table
    const { data: node } = await supabase
      .from("nodes")
      .select("device_id")
      .eq("wallet_address", wallet)
      .limit(1)
      .single();

    if (!node) {
      return NextResponse.json(
        { error: "Wallet not registered as a mining node" },
        { status: 400 },
      );
    }

    // Check if already linked
    const { data: existing } = await supabase
      .from("fah_links")
      .select("id")
      .eq("wallet_address", wallet)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Wallet already linked to a F@H account. Unlink first." },
        { status: 409 },
      );
    }

    // Validate F@H username exists
    const fahUser = await lookupFahUser(fahUsername);
    if (!fahUser) {
      return NextResponse.json(
        { error: "F@H username not found. Check spelling or complete at least one work unit." },
        { status: 404 },
      );
    }

    // Check team membership
    const isOnTeam = fahUser.team === FAH_TEAM_ID;

    // Store the link
    const { error: insertError } = await supabase.from("fah_links").insert({
      wallet_address: wallet,
      fah_username: fahUsername,
      fah_score: fahUser.score,
      fah_wus: fahUser.wus,
      verified: isOnTeam,
      last_synced_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("F@H link insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to link account" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      username: fahUsername,
      score: fahUser.score,
      wus: fahUser.wus,
      verified: isOnTeam,
      message: isOnTeam
        ? "Linked and verified! You're earning bonus points."
        : `Linked but not on POH team yet. Join team ${FAH_TEAM_ID} in your F@H client to earn bonus points.`,
    });
  } catch (err) {
    console.error("F@H link error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("fah_links")
      .delete()
      .eq("wallet_address", walletAddress.toLowerCase());

    if (error) {
      return NextResponse.json(
        { error: "Failed to unlink account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("F@H unlink error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
