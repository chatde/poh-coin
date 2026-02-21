import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";

/**
 * GET /api/research/results?taskId=xxx
 * GET /api/research/results?partnerId=xxx&limit=50
 *
 * Retrieve results for completed research tasks.
 * Authenticated via API key in the Authorization header.
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
      // Single task result
      const { data: task, error } = await supabase
        .from("compute_tasks")
        .select("task_id, task_type, dataset_id, status, parameters, created_at")
        .eq("task_id", taskId)
        .eq("partner_id", partner.id)
        .single();

      if (error || !task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Get consensus results
      const { data: assignments } = await supabase
        .from("task_assignments")
        .select("result, compute_time_ms, is_match, ai_confidence")
        .eq("task_id", taskId)
        .eq("is_match", true);

      return NextResponse.json({
        task,
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
          ? assignments.reduce((s, a) => s + (a.ai_confidence || 0), 0) /
            assignments.length
          : null,
      });
    }

    // Batch query — recent tasks for this partner
    const { data: tasks } = await supabase
      .from("compute_tasks")
      .select("task_id, task_type, dataset_id, status, created_at")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    return NextResponse.json({
      partnerId: partner.id,
      partnerName: partner.name,
      tasks: tasks || [],
      count: tasks?.length || 0,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
