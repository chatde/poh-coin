import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReferralCode } from "@/lib/crypto";
import { REFERRAL_DURATION_DAYS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
    }

    const wallet = walletAddress.toLowerCase();

    // Check if user already has an active referral code
    const { data: existing } = await supabase
      .from("referrals")
      .select("referral_code, bonus_expires_at")
      .eq("referrer_wallet", wallet)
      .eq("active", true)
      .is("invitee_wallet", null)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ code: existing.referral_code });
    }

    const code = generateReferralCode(wallet);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFERRAL_DURATION_DAYS);

    const { error } = await supabase.from("referrals").insert({
      referrer_wallet: wallet,
      invitee_wallet: "", // Placeholder until redeemed
      referral_code: code,
      bonus_expires_at: expiresAt.toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ code, expiresAt: expiresAt.toISOString() });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
