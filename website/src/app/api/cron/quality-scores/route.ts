import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/cron/quality-scores
 *
 * Weekly cron job to compute rolling 30-day quality scores.
 * Auto-deactivates devices with quality < 25% and 20+ tasks.
 *
 * Trigger via Vercel cron or external scheduler.
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get all active devices
    const { data: devices } = await supabase
      .from("nodes")
      .select("device_id")
      .eq("is_active", true);

    if (!devices || devices.length === 0) {
      return NextResponse.json({ message: "No active devices", processed: 0 });
    }

    let processed = 0;
    let deactivated = 0;

    for (const device of devices) {
      const deviceId = device.device_id;

      // Count total task assignments in last 30 days
      const { count: totalTasks } = await supabase
        .from("task_assignments")
        .select("*", { count: "exact", head: true })
        .eq("device_id", deviceId)
        .gte("assigned_at", thirtyDaysAgo)
        .not("submitted_at", "is", null);

      // Count verified (is_match = true) tasks
      const { count: verifiedTasks } = await supabase
        .from("task_assignments")
        .select("*", { count: "exact", head: true })
        .eq("device_id", deviceId)
        .eq("is_match", true)
        .gte("assigned_at", thirtyDaysAgo);

      // Count fitness verify tasks where this device voted with consensus
      const { count: fitnessVerified } = await supabase
        .from("task_assignments")
        .select("*, compute_tasks!inner(task_type)", { count: "exact", head: true })
        .eq("device_id", deviceId)
        .eq("is_match", true)
        .eq("compute_tasks.task_type", "fitness_verify")
        .gte("assigned_at", thirtyDaysAgo);

      // Compute uptime (heartbeats in last 30 days / expected heartbeats)
      const { count: heartbeatCount } = await supabase
        .from("heartbeats")
        .select("*", { count: "exact", head: true })
        .eq("device_id", deviceId)
        .gte("timestamp", thirtyDaysAgo)
        .not("response", "is", null);

      // Expected heartbeats: 30 days * 24 hours * 4 per hour = 2880
      const expectedHeartbeats = 30 * 24 * 4;
      const uptimePct = Math.min(100, ((heartbeatCount || 0) / expectedHeartbeats) * 100);

      // Quality percentage
      const total = totalTasks || 0;
      const verified = verifiedTasks || 0;
      const qualityPct = total > 0 ? (verified / total) * 100 : 0;

      // Upsert quality score
      await supabase.from("quality_scores").upsert({
        device_id: deviceId,
        total_tasks_30d: total,
        verified_30d: verified,
        fitness_verified: fitnessVerified || 0,
        quality_pct: Math.round(qualityPct * 100) / 100,
        uptime_pct: Math.round(uptimePct * 100) / 100,
        computed_at: new Date().toISOString(),
      });

      // Auto-deactivate if quality < 25% and 20+ tasks
      if (qualityPct < 25 && total >= 20) {
        await supabase
          .from("nodes")
          .update({ is_active: false, reputation: 0 })
          .eq("device_id", deviceId);
        deactivated++;
      }

      processed++;
    }

    return NextResponse.json({
      processed,
      deactivated,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
