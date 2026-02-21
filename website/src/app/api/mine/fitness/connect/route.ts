import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTerraWidgetSession, storeTerraConnection } from "@/lib/fitness-data";

/**
 * POST /api/mine/fitness/connect
 *
 * Two modes:
 *   1. { walletAddress, deviceId } → Generate Terra widget URL for OAuth
 *   2. { walletAddress, deviceId, terraUserId, provider } → Store connection after OAuth callback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, deviceId, terraUserId, provider } = body;

    if (!walletAddress || !deviceId) {
      return NextResponse.json(
        { error: "walletAddress and deviceId are required" },
        { status: 400 }
      );
    }

    // Verify device belongs to wallet
    const { data: node } = await supabase
      .from("nodes")
      .select("wallet_address, is_active")
      .eq("device_id", deviceId)
      .single();

    if (!node || !node.is_active) {
      return NextResponse.json({ error: "Device not found or inactive" }, { status: 404 });
    }

    if (node.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Device does not belong to this wallet" }, { status: 403 });
    }

    // Mode 2: Store connection after OAuth callback
    if (terraUserId && provider) {
      const success = await storeTerraConnection(walletAddress, deviceId, terraUserId, provider);
      if (!success) {
        return NextResponse.json({ error: "Failed to store connection" }, { status: 500 });
      }
      return NextResponse.json({ connected: true, provider });
    }

    // Mode 1: Generate Terra widget session
    const session = await generateTerraWidgetSession(walletAddress.toLowerCase());
    if (!session) {
      return NextResponse.json(
        { error: "Failed to generate Terra widget session. Check TERRA_API_KEY config." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      widgetUrl: session.url,
      sessionId: session.session_id,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
