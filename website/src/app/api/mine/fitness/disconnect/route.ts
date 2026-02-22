import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { disconnectProvider } from "@/lib/fitness-data";
import type { FitnessConnection } from "@/lib/fitness-data";

/**
 * POST /api/mine/fitness/disconnect
 *
 * Revoke provider tokens and deactivate fitness connection.
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 },
      );
    }

    // Find all active connections for this wallet
    const { data: connections } = await supabase
      .from("fitness_connections")
      .select("id, wallet_address, device_id, provider_user_id, provider, access_token, refresh_token, token_expires_at, connected_at, last_sync, is_active")
      .eq("wallet_address", walletAddress.toLowerCase())
      .eq("is_active", true);

    if (!connections || connections.length === 0) {
      return NextResponse.json({ disconnected: true, count: 0 });
    }

    let disconnected = 0;
    for (const conn of connections) {
      const success = await disconnectProvider(walletAddress, conn as FitnessConnection);
      if (success) disconnected++;
    }

    return NextResponse.json({ disconnected: true, count: disconnected });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
