import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { disconnectTerra } from "@/lib/fitness-data";

/**
 * POST /api/mine/fitness/disconnect
 *
 * Revoke Terra connection and deactivate fitness mining for this wallet.
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, terraUserId } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    // If no terraUserId provided, disconnect all for this wallet
    if (!terraUserId) {
      const { data: connections } = await supabase
        .from("fitness_connections")
        .select("terra_user_id")
        .eq("wallet_address", walletAddress.toLowerCase())
        .eq("is_active", true);

      if (connections) {
        for (const conn of connections) {
          await disconnectTerra(walletAddress, conn.terra_user_id);
        }
      }

      return NextResponse.json({ disconnected: true, count: connections?.length || 0 });
    }

    const success = await disconnectTerra(walletAddress, terraUserId);

    if (!success) {
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    return NextResponse.json({ disconnected: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
