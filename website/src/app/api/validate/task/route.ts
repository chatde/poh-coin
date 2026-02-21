import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { validatorDeviceId, taskId, isValid, notes } = await req.json();

    if (!validatorDeviceId || !taskId || isValid === undefined) {
      return NextResponse.json(
        { error: "validatorDeviceId, taskId, and isValid are required" },
        { status: 400 }
      );
    }

    // Verify the device is a tier 2 validator
    const { data: validator } = await supabase
      .from("nodes")
      .select("tier, is_active, wallet_address")
      .eq("device_id", validatorDeviceId)
      .single();

    if (!validator || validator.tier !== 2 || !validator.is_active) {
      return NextResponse.json(
        { error: "Device is not an active validator" },
        { status: 403 }
      );
    }

    // Record validation result
    const { error } = await supabase.from("task_assignments").insert({
      task_id: taskId,
      device_id: validatorDeviceId,
      result: { validated: isValid, notes },
      submitted_at: new Date().toISOString(),
      is_match: isValid,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award validator points
    const { data: epoch } = await supabase
      .from("epochs")
      .select("epoch_number")
      .eq("status", "active")
      .single();

    if (epoch) {
      await supabase.from("proofs").insert({
        device_id: validatorDeviceId,
        epoch: epoch.epoch_number,
        points_earned: 1,
        tasks_completed: 1,
        quality_verified: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
