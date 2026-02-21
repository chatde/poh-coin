import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash, timingSafeEqual } from "crypto";

/**
 * POST /api/research/submit
 *
 * Allows research partners to submit compute tasks for distributed processing.
 * Authenticated via API key in the Authorization header.
 *
 * Body: { taskType, datasetId, parameters, callbackUrl? }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate partner
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const keyHash = createHash("sha256").update(apiKey).digest("hex");

    const { data: partner, error: partnerErr } = await supabase
      .from("research_partners")
      .select("id, name, is_active")
      .eq("api_key_hash", keyHash)
      .single();

    if (partnerErr || !partner || !partner.is_active) {
      return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 403 });
    }

    const { taskType, datasetId, parameters, callbackUrl } = await req.json();

    if (!taskType || !datasetId) {
      return NextResponse.json(
        { error: "taskType and datasetId are required" },
        { status: 400 }
      );
    }

    const validTypes = ["protein", "climate", "signal", "drugscreen"];
    if (!validTypes.includes(taskType)) {
      return NextResponse.json(
        { error: `Invalid taskType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Create the compute task
    const { data: task, error: taskErr } = await supabase
      .from("compute_tasks")
      .insert({
        task_type: taskType,
        dataset_id: datasetId,
        parameters: parameters || {},
        callback_url: callbackUrl || null,
        source: "partner",
        partner_id: partner.id,
        status: "pending",
      })
      .select("task_id")
      .single();

    if (taskErr) {
      return NextResponse.json({ error: taskErr.message }, { status: 500 });
    }

    // Increment partner task count
    await supabase.rpc("increment_partner_tasks", { p_id: partner.id });

    return NextResponse.json({
      taskId: task.task_id,
      status: "pending",
      message: "Task submitted. It will be distributed to miners for processing.",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
