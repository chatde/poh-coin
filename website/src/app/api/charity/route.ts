import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MAX_TEXT = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { org_name, contact_name, contact_email, mission, amount_requested, wallet_address } = body;

    // Validate required fields
    if (!org_name?.trim() || !contact_name?.trim() || !contact_email?.trim() || !mission?.trim()) {
      return NextResponse.json(
        { error: "org_name, contact_name, contact_email, and mission are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(contact_email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Validate length limits
    if (org_name.length > 200 || contact_name.length > 200 || mission.length > MAX_TEXT) {
      return NextResponse.json({ error: "Input exceeds maximum length" }, { status: 400 });
    }

    // Validate wallet address if provided
    if (wallet_address && !/^0x[0-9a-fA-F]{40}$/.test(wallet_address)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
    }

    // Validate amount if provided
    const parsedAmount = amount_requested ? Number(amount_requested) : null;
    if (parsedAmount !== null && (isNaN(parsedAmount) || parsedAmount < 0)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const { error } = await supabase.from("charity_applications").insert({
      org_name: org_name.trim(),
      contact_name: contact_name.trim(),
      contact_email: contact_email.trim().toLowerCase(),
      mission: mission.trim(),
      amount_requested: parsedAmount,
      wallet_address: wallet_address?.trim() || null,
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Application submitted successfully" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
