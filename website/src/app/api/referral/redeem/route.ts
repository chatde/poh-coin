import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { REFERRAL_DURATION_DAYS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, referralCode } = await req.json();

    if (!walletAddress || !referralCode) {
      return NextResponse.json(
        { error: "walletAddress and referralCode required" },
        { status: 400 }
      );
    }

    const wallet = walletAddress.toLowerCase();

    // Find the referral code
    const { data: referral } = await supabase
      .from("referrals")
      .select("*")
      .eq("referral_code", referralCode)
      .eq("active", true)
      .single();

    if (!referral) {
      return NextResponse.json({ error: "Invalid or expired referral code" }, { status: 404 });
    }

    // Can't refer yourself
    if (referral.referrer_wallet === wallet) {
      return NextResponse.json({ error: "Cannot redeem your own code" }, { status: 400 });
    }

    // Check if already redeemed by someone else
    if (referral.invitee_wallet && referral.invitee_wallet !== "") {
      return NextResponse.json({ error: "Code already redeemed" }, { status: 409 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFERRAL_DURATION_DAYS);

    // Update referral with invitee
    const { error } = await supabase
      .from("referrals")
      .update({
        invitee_wallet: wallet,
        bonus_expires_at: expiresAt.toISOString(),
      })
      .eq("id", referral.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      referrer: referral.referrer_wallet,
      bonusExpiresAt: expiresAt.toISOString(),
      message: "Both you and your referrer get +10% bonus points for 30 days!",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
