import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";

/**
 * POST /api/research/submit
 *
 * Allows research partners to submit compute tasks for distributed processing.
 * Authenticated via API key in the x-api-key header.
 *
 * Body: { taskType, datasetId, parameters, callbackUrl? }
 *
 * Partner metadata (datasetId, callbackUrl, partnerId) is stored inside
 * the payload JSONB field as _meta, since compute_tasks uses a generic schema.
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

    // Build payload — partner metadata stored in _meta to avoid schema conflicts.
    // The compute_tasks table uses a single JSONB `payload` column for all task data.
    const payload: Record<string, unknown> = {
      ...(parameters || {}),
      _meta: {
        datasetId,
        partnerId: partner.id,
        callbackUrl: callbackUrl || null,
        source: "partner",
      },
    };

    // Create the compute task using the actual schema columns
    const { data: task, error: taskErr } = await supabase
      .from("compute_tasks")
      .insert({
        task_type: taskType,
        payload,
        source: "partner",
        status: "pending",
        priority: 5,
        seed: crypto.randomUUID(),
        task_version: "2.0.0",
      })
      .select("task_id")
      .single();

    if (taskErr) {
      return NextResponse.json({ error: taskErr.message }, { status: 500 });
    }

    // Increment partner task count (best-effort — table may not exist yet)
    await supabase.rpc("increment_partner_tasks", { p_id: partner.id }).maybeSingle();

    return NextResponse.json({
      taskId: task.task_id,
      status: "pending",
      message: "Task submitted. It will be distributed to miners for processing.",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
