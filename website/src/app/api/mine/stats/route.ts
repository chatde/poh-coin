import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const wallet = req.nextUrl.searchParams.get("wallet");

    if (!deviceId && !wallet) {
      return NextResponse.json(
        { error: "deviceId or wallet required" },
        { status: 400 },
      );
    }

    // Rate limit keyed to whichever identifier is provided
    const rateLimitKey = deviceId
      ? `stats:device:${deviceId}`
      : `stats:wallet:${wallet!.toLowerCase()}`;

    const rateLimitOk = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.TASK_REQUEST.maxCount,
      RATE_LIMITS.TASK_REQUEST.windowMs,
    );
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Resolve the full set of device IDs to query
    let deviceIds: string[] = [];

    if (deviceId) {
      deviceIds.push(deviceId);
    }

    if (wallet) {
      const normalizedWallet = wallet.toLowerCase();
      const { data: nodes, error: nodesError } = await supabase
        .from("nodes")
        .select("device_id")
        .eq("wallet_address", normalizedWallet);

      if (!nodesError && nodes && nodes.length > 0) {
        const walletDeviceIds = nodes.map((n: { device_id: string }) => n.device_id);
        // Merge, deduplicating against any deviceId already in the list
        for (const id of walletDeviceIds) {
          if (!deviceIds.includes(id)) {
            deviceIds.push(id);
          }
        }
      }
    }

    // ── verifiedTasks & totalPoints from proofs ───────────────────────
    let verifiedTasks = 0;
    let totalPoints = 0;

    if (deviceIds.length > 0) {
      const { data: proofs, error: proofsError } = await supabase
        .from("proofs")
        .select("points_earned, quality_verified")
        .in("device_id", deviceIds);

      if (!proofsError && proofs) {
        totalPoints = proofs.reduce(
          (sum: number, p: { points_earned: number | string; quality_verified: boolean }) =>
            sum + Number(p.points_earned),
          0,
        );
        verifiedTasks = proofs.filter(
          (p: { points_earned: number | string; quality_verified: boolean }) =>
            p.quality_verified,
        ).length;
      }
      // If proofsError (e.g. table missing), both fields stay at 0
    }

    // ── consensusRate from task_assignments ───────────────────────────
    let consensusRate = 0;

    if (deviceIds.length > 0) {
      const { data: assignments, error: assignError } = await supabase
        .from("task_assignments")
        .select("is_match")
        .in("device_id", deviceIds)
        .not("submitted_at", "is", null);

      if (!assignError && assignments && assignments.length > 0) {
        const matchedCount = assignments.filter(
          (a: { is_match: boolean | null }) => a.is_match === true,
        ).length;
        consensusRate = matchedCount / assignments.length;
      }
      // If assignError (e.g. table missing) or no rows, consensusRate stays at 0
    }

    return NextResponse.json({ verifiedTasks, totalPoints, consensusRate });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
