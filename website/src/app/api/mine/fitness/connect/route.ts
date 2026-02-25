import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getProvider, createOAuthState } from "@/lib/fitness-data";

/**
 * POST /api/mine/fitness/connect
 *
 * Accepts { walletAddress, deviceId, provider } and returns { authUrl }
 * for the OAuth authorize redirect.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, deviceId, provider } = body;

    if (!walletAddress || !deviceId || !provider) {
      return NextResponse.json(
        { error: "walletAddress, deviceId, and provider are required" },
        { status: 400 },
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

    // Validate provider
    const fitnessProvider = getProvider(provider);
    if (!fitnessProvider) {
      return NextResponse.json(
        { error: "Unsupported provider. Use 'strava'." },
        { status: 400 },
      );
    }

    // Create HMAC-signed state
    const state = await createOAuthState(walletAddress, deviceId);

    // Generate OAuth authorize URL
    const authUrl = fitnessProvider.getAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
