import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";

/**
 * GET /api/research/results?taskId=xxx
 * GET /api/research/results?limit=50
 *
 * Retrieve results for completed research tasks submitted by this partner.
 * Authenticated via API key in the x-api-key header.
 *
 * Partner tasks are identified by partnerId stored in payload._meta.partnerId.
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate partner
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const keyHash = createHash("sha256").update(apiKey).digest("hex");

    const { data: partner, error: partnerErr } = await supabase
      .from("research_partners")
      .select("id, name")
      .eq("api_key_hash", keyHash)
      .single();

    if (partnerErr || !partner) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    if (taskId) {
      // Single task result — verify this task belongs to the requesting partner
      const { data: task, error } = await supabase
        .from("compute_tasks")
        .select("task_id, task_type, status, source, created_at, payload")
        .eq("task_id", taskId)
        .eq("source", "partner")
        .single();

      if (error || !task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Verify partner ownership via payload._meta.partnerId
      const meta = (task.payload as Record<string, unknown>)?._meta as Record<string, unknown> | undefined;
      if (meta?.partnerId !== partner.id) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Get consensus results
      const { data: assignments } = await supabase
        .from("task_assignments")
        .select("result, compute_time_ms, is_match, ai_confidence")
        .eq("task_id", taskId)
        .eq("is_match", true);

      return NextResponse.json({
        taskId: task.task_id,
        taskType: task.task_type,
        status: task.status,
        createdAt: task.created_at,
        datasetId: (meta?.datasetId as string) ?? null,
        results: assignments || [],
        consensusReached: (assignments?.length || 0) >= 2,
        deviceCount: assignments?.length || 0,
        avgComputeTime: assignments?.length
          ? Math.round(
              assignments.reduce((s, a) => s + (a.compute_time_ms || 0), 0) /
                assignments.length
            )
          : null,
        avgAiConfidence: assignments?.length
          ? assignments.reduce((s, a) => s + (Number(a.ai_confidence) || 0), 0) /
            assignments.length
          : null,
      });
    }

    // Batch query — recent partner tasks (identified by source=partner and partnerId in payload)
    const { data: tasks } = await supabase
      .from("compute_tasks")
      .select("task_id, task_type, status, source, created_at, payload")
      .eq("source", "partner")
      .order("created_at", { ascending: false })
      .limit(limit * 3); // Over-fetch since we filter by partnerId in JS

    // Filter to only this partner's tasks
    const partnerTasks = (tasks || [])
      .filter((t) => {
        const meta = (t.payload as Record<string, unknown>)?._meta as Record<string, unknown> | undefined;
        return meta?.partnerId === partner.id;
      })
      .slice(0, limit)
      .map((t) => {
        const meta = (t.payload as Record<string, unknown>)?._meta as Record<string, unknown> | undefined;
        return {
          taskId: t.task_id,
          taskType: t.task_type,
          status: t.status,
          datasetId: (meta?.datasetId as string) ?? null,
          createdAt: t.created_at,
        };
      });

    return NextResponse.json({
      partnerId: partner.id,
      partnerName: partner.name,
      tasks: partnerTasks,
      count: partnerTasks.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
