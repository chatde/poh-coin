import { NextRequest, NextResponse } from "next/server";
import { verifyOAuthState, getProvider, storeConnection } from "@/lib/fitness-data";

/**
 * GET /api/mine/fitness/callback
 *
 * OAuth callback handler. Strava redirects here after user authorizes.
 * Query params: code, state (format: "provider.hmacSignedPayload")
 *
 * 1. Parse provider from state prefix
 * 2. Verify HMAC-signed state → extract walletAddress + deviceId
 * 3. Exchange auth code for tokens
 * 4. Store connection in DB
 * 5. Redirect to /mine/setup?fitness=success&provider=xxx
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const setupUrl = `${appUrl}/mine/setup`;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");

    // Handle OAuth errors (user denied, etc.)
    const error = searchParams.get("error");
    if (error) {
      return NextResponse.redirect(`${setupUrl}?fitness=failed&reason=${encodeURIComponent(error)}`);
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(`${setupUrl}?fitness=failed&reason=missing_params`);
    }

    // State format: "provider.hmacPayload"
    const dotIndex = stateParam.indexOf(".");
    if (dotIndex === -1) {
      return NextResponse.redirect(`${setupUrl}?fitness=failed&reason=invalid_state`);
    }
    const providerName = stateParam.substring(0, dotIndex);
    const hmacState = stateParam.substring(dotIndex + 1);

    // Verify HMAC-signed state
    const stateData = await verifyOAuthState(hmacState);
    if (!stateData) {
      return NextResponse.redirect(`${setupUrl}?fitness=failed&reason=state_expired`);
    }

    // Get provider
    const provider = getProvider(providerName);
    if (!provider) {
      return NextResponse.redirect(`${setupUrl}?fitness=failed&reason=unknown_provider`);
    }

    // Exchange code for tokens
    const tokens = await provider.exchangeCode(code);
    if (!tokens) {
      return NextResponse.redirect(`${setupUrl}?fitness=failed&reason=token_exchange_failed`);
    }

    // Store connection
    const stored = await storeConnection(
      stateData.walletAddress,
      stateData.deviceId,
      providerName,
      tokens,
    );

    if (!stored) {
      return NextResponse.redirect(`${setupUrl}?fitness=failed&reason=storage_failed`);
    }

    return NextResponse.redirect(
      `${setupUrl}?fitness=success&provider=${providerName}`,
    );
  } catch {
    return NextResponse.redirect(`${setupUrl}?fitness=failed&reason=internal_error`);
  }
}
