import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { deviceId, taskId, result, computeTimeMs } = await req.json();

    if (!deviceId || !taskId || result === undefined) {
      return NextResponse.json(
        { error: "deviceId, taskId, and result are required" },
        { status: 400 }
      );
    }

    // Find the assignment
    const { data: assignment, error: findErr } = await supabase
      .from("task_assignments")
      .select("id")
      .eq("task_id", taskId)
      .eq("device_id", deviceId)
      .is("submitted_at", null)
      .single();

    if (findErr || !assignment) {
      return NextResponse.json(
        { error: "No pending assignment found" },
        { status: 404 }
      );
    }

    // Record the submission
    const { error: updateErr } = await supabase
      .from("task_assignments")
      .update({
        result,
        compute_time_ms: computeTimeMs,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", assignment.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Check if we have enough submissions for verification (2-of-3)
    const { data: allSubs } = await supabase
      .from("task_assignments")
      .select("id, result, device_id")
      .eq("task_id", taskId)
      .not("submitted_at", "is", null);

    if (allSubs && allSubs.length >= 2) {
      // Compare results — group by JSON string
      const resultStrings = allSubs.map((s) => JSON.stringify(s.result));
      const groups = new Map<string, string[]>();

      for (let i = 0; i < resultStrings.length; i++) {
        const key = resultStrings[i];
        const existing = groups.get(key) || [];
        existing.push(allSubs[i].device_id);
        groups.set(key, existing);
      }

      // Find consensus group (must have 2+ matching results)
      let consensusDevices: string[] = [];
      let outlierDevices: string[] = [];

      for (const [, devices] of groups) {
        if (devices.length >= 2 && devices.length > consensusDevices.length) {
          // If we had a previous consensus pick, those become outliers
          if (consensusDevices.length > 0) {
            outlierDevices.push(...consensusDevices);
          }
          consensusDevices = devices;
        } else if (devices.length < 2) {
          outlierDevices.push(...devices);
        }
      }

      // Only proceed if we actually found a consensus (2+ matching)
      if (consensusDevices.length >= 2) {
        // Mark matching/outlier submissions
        for (const sub of allSubs) {
          const isMatch = consensusDevices.includes(sub.device_id);
          await supabase
            .from("task_assignments")
            .update({ is_match: isMatch })
            .eq("id", sub.id);
        }

        // Mark task as completed
        await supabase
          .from("compute_tasks")
          .update({ status: "completed" })
          .eq("task_id", taskId);

        // Get current epoch
        const { data: epoch } = await supabase
          .from("epochs")
          .select("epoch_number")
          .eq("status", "active")
          .single();

        if (epoch) {
          // Award points to consensus devices
          for (const did of consensusDevices) {
            await supabase.from("proofs").insert({
              device_id: did,
              epoch: epoch.epoch_number,
              points_earned: 1,
              tasks_completed: 1,
              quality_verified: true,
            });
          }

          // Only penalize outliers if consensus is clear (don't penalize if all 3 are different)
          if (outlierDevices.length > 0 && consensusDevices.length >= 2) {
            for (const did of outlierDevices) {
              const { data: node } = await supabase
                .from("nodes")
                .select("reputation")
                .eq("device_id", did)
                .single();

              if (node) {
                await supabase
                  .from("nodes")
                  .update({ reputation: Math.max(0, node.reputation - 1) })
                  .eq("device_id", did);
              }

              // Still record proof (0 points, not verified) for tracking
              await supabase.from("proofs").insert({
                device_id: did,
                epoch: epoch.epoch_number,
                points_earned: 0,
                tasks_completed: 1,
                quality_verified: false,
              });
            }
          }
        }

        return NextResponse.json({ verified: true, consensus: true });
      }
      // No consensus yet (e.g., all 3 different) — don't penalize anyone, just wait
    }

    return NextResponse.json({ verified: false, message: "Awaiting more submissions" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
