import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { shouldSpotCheck, spotCheckResult } from "@/lib/reference-compute";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";

const AI_VERIFIER_URL = process.env.AI_VERIFIER_URL || "http://localhost:8000";

/** Call the AI verification service. Returns null if unavailable. */
async function callAiVerifier(
  taskType: string,
  result: unknown,
  computeTimeMs: number,
  peerResults: unknown[],
): Promise<{ confidence: number; flags: string[]; recommendation: string } | null> {
  try {
    const res = await fetch(`${AI_VERIFIER_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_type: taskType,
        result,
        compute_time_ms: computeTimeMs,
        peer_results: peerResults,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    console.warn("AI verifier unreachable, falling back to consensus-only");
    return null;
  }
}

/** Record a verification failure and apply graduated penalty */
async function recordFailure(
  deviceId: string,
  taskId: string,
  failureType: string,
): Promise<void> {
  // Count recent failures (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("verification_failures")
    .select("*", { count: "exact", head: true })
    .eq("device_id", deviceId)
    .gte("created_at", weekAgo);

  const failureCount = (count || 0) + 1;

  // Exponential penalty: 2^failureCount
  const penalty = Math.pow(2, failureCount);

  // Record failure
  await supabase.from("verification_failures").insert({
    device_id: deviceId,
    task_id: taskId,
    failure_type: failureType,
    penalty,
  });

  // Apply reputation penalty
  const { data: node } = await supabase
    .from("nodes")
    .select("reputation")
    .eq("device_id", deviceId)
    .single();

  if (node) {
    const newReputation = Math.max(0, node.reputation - penalty);
    await supabase
      .from("nodes")
      .update({
        reputation: newReputation,
        // Auto-deactivate if reputation hits 0
        is_active: newReputation > 0,
      })
      .eq("device_id", deviceId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { deviceId, taskId, result, computeTimeMs, proof } = await req.json();

    if (!deviceId || !taskId || result === undefined) {
      return NextResponse.json(
        { error: "deviceId, taskId, and result are required" },
        { status: 400 }
      );
    }

    // Rate limit
    const rateLimitOk = await checkRateLimit(
      `submit:${deviceId}`,
      RATE_LIMITS.SUBMIT.maxCount,
      RATE_LIMITS.SUBMIT.windowMs,
    );
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
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

    // Record the submission with computation proof
    const { error: updateErr } = await supabase
      .from("task_assignments")
      .update({
        result,
        compute_time_ms: computeTimeMs,
        submitted_at: new Date().toISOString(),
        computation_proof: proof || null,
      })
      .eq("id", assignment.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Get task info for verification
    const { data: taskInfo } = await supabase
      .from("compute_tasks")
      .select("task_type, payload, seed")
      .eq("task_id", taskId)
      .single();

    // ── Handle fitness_verify tasks specially ─────────────────────
    if (taskInfo?.task_type === "fitness_verify") {
      // Check if we have 3 submissions for consensus
      const { data: allSubs } = await supabase
        .from("task_assignments")
        .select("id, result, device_id")
        .eq("task_id", taskId)
        .not("submitted_at", "is", null);

      if (allSubs && allSubs.length >= 3) {
        // Count verified vs not-verified votes
        let verifiedCount = 0;
        let notVerifiedCount = 0;
        for (const sub of allSubs) {
          const subResult = sub.result as Record<string, unknown>;
          if (subResult?.verified) verifiedCount++;
          else notVerifiedCount++;
        }

        // 2-of-3 consensus
        const activityId = (taskInfo.payload as Record<string, unknown>)?.activity_id;
        if (verifiedCount >= 2 && activityId) {
          await supabase
            .from("fitness_activities")
            .update({ verified: true })
            .eq("id", activityId);
        } else if (notVerifiedCount >= 2 && activityId) {
          // Fitness fraud detected — penalize the submitter
          const { data: activity } = await supabase
            .from("fitness_activities")
            .select("device_id")
            .eq("id", activityId)
            .single();
          if (activity) {
            await recordFailure(activity.device_id, taskId, "fitness_fraud");
          }
        }

        // Mark all submissions
        for (const sub of allSubs) {
          const subResult = sub.result as Record<string, unknown>;
          const isMatch = verifiedCount >= 2 ? !!subResult?.verified : !subResult?.verified;
          await supabase
            .from("task_assignments")
            .update({ is_match: isMatch })
            .eq("id", sub.id);
        }

        await supabase
          .from("compute_tasks")
          .update({ status: "completed" })
          .eq("task_id", taskId);
      }

      return NextResponse.json({ verified: true, type: "fitness_verify" });
    }

    // ── Server-side spot check (10% of compute tasks) ────────────
    if (taskInfo && shouldSpotCheck()) {
      const spotResult = spotCheckResult(
        taskInfo.task_type,
        taskInfo.payload as Record<string, unknown>,
        result as Record<string, unknown>,
      );

      if (!spotResult.passed) {
        await recordFailure(deviceId, taskId, "reference_mismatch");

        return NextResponse.json({
          verified: false,
          spotCheck: {
            passed: false,
            deviation: spotResult.deviation,
          },
        });
      }
    }

    // ── Check if we have enough submissions for verification (2-of-3) ─
    const { data: allSubs } = await supabase
      .from("task_assignments")
      .select("id, result, device_id")
      .eq("task_id", taskId)
      .not("submitted_at", "is", null);

    if (allSubs && allSubs.length >= 2) {
      const resultStrings = allSubs.map((s) => JSON.stringify(s.result));
      const groups = new Map<string, string[]>();

      for (let i = 0; i < resultStrings.length; i++) {
        const key = resultStrings[i];
        const existing = groups.get(key) || [];
        existing.push(allSubs[i].device_id);
        groups.set(key, existing);
      }

      let consensusDevices: string[] = [];
      let outlierDevices: string[] = [];

      for (const [, devices] of groups) {
        if (devices.length >= 2 && devices.length > consensusDevices.length) {
          if (consensusDevices.length > 0) {
            outlierDevices.push(...consensusDevices);
          }
          consensusDevices = devices;
        } else if (devices.length < 2) {
          outlierDevices.push(...devices);
        }
      }

      if (consensusDevices.length >= 2) {
        // AI Verification
        const consensusResult = allSubs.find((s) => consensusDevices.includes(s.device_id))?.result;
        const peerResults = allSubs.filter((s) => consensusDevices.includes(s.device_id)).map((s) => s.result);

        const aiResult = taskInfo
          ? await callAiVerifier(taskInfo.task_type, consensusResult, computeTimeMs, peerResults)
          : null;

        // Mark submissions
        for (const sub of allSubs) {
          const isMatch = consensusDevices.includes(sub.device_id);
          await supabase
            .from("task_assignments")
            .update({
              is_match: isMatch,
              ai_confidence: aiResult?.confidence ?? null,
              ai_flags: aiResult?.flags ?? null,
            })
            .eq("id", sub.id);
        }

        const aiRejected = aiResult?.recommendation === "reject";

        await supabase
          .from("compute_tasks")
          .update({ status: aiRejected ? "ai_rejected" : "completed" })
          .eq("task_id", taskId);

        // Get current epoch
        const { data: epoch } = await supabase
          .from("epochs")
          .select("epoch_number")
          .eq("status", "active")
          .single();

        if (epoch && !aiRejected) {
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

          // Graduated penalties for outliers
          if (outlierDevices.length > 0 && consensusDevices.length >= 2) {
            for (const did of outlierDevices) {
              await recordFailure(did, taskId, "consensus_outlier");

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

        return NextResponse.json({
          verified: true,
          consensus: true,
          aiVerification: aiResult
            ? { confidence: aiResult.confidence, recommendation: aiResult.recommendation }
            : null,
        });
      }
    }

    return NextResponse.json({ verified: false, message: "Awaiting more submissions" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
