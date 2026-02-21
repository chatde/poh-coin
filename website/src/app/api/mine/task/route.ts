import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchLiveTask } from "@/lib/live-data";
import { buildFitnessVerifyPayload } from "@/lib/fitness-data";
import { checkRateLimit } from "@/lib/rate-limiter";

// ── Fallback tasks (used when all external APIs are down) ────────────
import { PROTEINS, CLIMATE_SCENARIOS, SEISMIC_EVENTS, DRUG_COMPOUNDS } from "@/lib/science-data";

function pickFallbackTask(): { taskType: string; payload: Record<string, unknown> } {
  const types = ["protein", "climate", "signal", "drugscreen"];
  const taskType = types[Math.floor(Math.random() * types.length)];

  let task: unknown;
  switch (taskType) {
    case "protein": {
      const p = PROTEINS[Math.floor(Math.random() * PROTEINS.length)];
      task = {
        scienceId: p.id, name: p.name, description: p.description,
        residues: p.residues, iterations: 2000, temperature: 310, source: "fallback",
      };
      break;
    }
    case "climate": {
      const c = CLIMATE_SCENARIOS[Math.floor(Math.random() * CLIMATE_SCENARIOS.length)];
      task = { ...c, scienceId: c.id, source: "fallback" };
      break;
    }
    case "signal": {
      const s = SEISMIC_EVENTS[Math.floor(Math.random() * SEISMIC_EVENTS.length)];
      task = { ...s, scienceId: s.id, source: "fallback" };
      break;
    }
    case "drugscreen": {
      const d = DRUG_COMPOUNDS[Math.floor(Math.random() * DRUG_COMPOUNDS.length)];
      task = { ...d, scienceId: d.id, source: "fallback" };
      break;
    }
  }

  return { taskType, payload: task as Record<string, unknown> };
}

// ── Difficulty scaling by device tier ────────────────────────────────

interface TierParams {
  proteinResidues: [number, number];
  climateGrid: number;
  signalSamples: number;
  fitnessVerifyBatch: number;
}

const TIER_PARAMS: Record<number, TierParams> = {
  1: { proteinResidues: [20, 50], climateGrid: 64, signalSamples: 4096, fitnessVerifyBatch: 1 },
  2: { proteinResidues: [50, 150], climateGrid: 128, signalSamples: 16384, fitnessVerifyBatch: 3 },
  3: { proteinResidues: [150, 300], climateGrid: 256, signalSamples: 65536, fitnessVerifyBatch: 5 },
};

function scaleTaskForTier(
  taskType: string,
  payload: Record<string, unknown>,
  tier: number,
): Record<string, unknown> {
  const params = TIER_PARAMS[tier] || TIER_PARAMS[1];

  switch (taskType) {
    case "protein": {
      const residues = payload.residues as unknown[];
      if (residues) {
        const [min, max] = params.proteinResidues;
        const targetCount = Math.min(residues.length, Math.floor(min + Math.random() * (max - min)));
        payload.residues = residues.slice(0, targetCount);
      }
      break;
    }
    case "climate": {
      payload.gridSize = params.climateGrid;
      break;
    }
    case "signal": {
      // Adjust duration to match target sample count
      const sampleRate = (payload.sampleRate as number) || 1000;
      payload.duration = params.signalSamples / sampleRate;
      break;
    }
  }

  return payload;
}

// ── Check for pending fitness verify tasks ───────────────────────────

async function getOrCreateFitnessVerifyTask(): Promise<{
  taskType: string;
  payload: Record<string, unknown>;
  priority: number;
} | null> {
  // Find unverified fitness activities
  const { data: unverified } = await supabase
    .from("fitness_activities")
    .select("id")
    .eq("verified", false)
    .order("submitted_at", { ascending: true })
    .limit(1);

  if (!unverified || unverified.length === 0) return null;

  const verifyPayload = await buildFitnessVerifyPayload(unverified[0].id);
  if (!verifyPayload) return null;

  return {
    taskType: "fitness_verify",
    payload: verifyPayload as unknown as Record<string, unknown>,
    priority: 3, // Higher priority than compute tasks (5)
  };
}

// ── Main handler ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // Rate limit: max 60 tasks/hour per device
    const rateLimitOk = await checkRateLimit(`task:${deviceId}`, 60, 60 * 60 * 1000);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Verify device is active and get capability tier
    const { data: node } = await supabase
      .from("nodes")
      .select("is_active, tier")
      .eq("device_id", deviceId)
      .single();

    if (!node?.is_active) {
      return NextResponse.json({ error: "Device not active" }, { status: 403 });
    }

    // Get device benchmark tier (defaults to node tier if no benchmark)
    const { data: benchmark } = await supabase
      .from("device_benchmarks")
      .select("capability_tier")
      .eq("device_id", deviceId)
      .single();
    const capabilityTier = benchmark?.capability_tier || node.tier || 1;

    // Check if device already has an assigned task
    const { data: existing } = await supabase
      .from("task_assignments")
      .select("task_id, compute_tasks(task_id, task_type, payload, difficulty, seed, task_version, source, priority)")
      .eq("device_id", deviceId)
      .is("submitted_at", null)
      .limit(1)
      .single();

    if (existing) {
      const task = existing.compute_tasks as unknown as Record<string, unknown>;
      return NextResponse.json({ task });
    }

    // Find an under-assigned task (need 3 for 2-of-3 verification)
    const { data: pendingTasks } = await supabase
      .rpc("get_available_task", { p_device_id: deviceId });

    const pendingTask = Array.isArray(pendingTasks) ? pendingTasks[0] : pendingTasks;

    if (pendingTask && pendingTask.task_id) {
      await supabase.from("task_assignments").insert({
        task_id: pendingTask.task_id,
        device_id: deviceId,
      });
      return NextResponse.json({ task: pendingTask });
    }

    // No existing tasks — generate new one
    // Priority: fitness verify > live data > fallback
    const seed = crypto.randomUUID();
    let taskType: string;
    let payload: Record<string, unknown>;
    let source: string = "live";
    let priority = 5;

    // 20% chance to check for fitness verify tasks (if any pending)
    if (Math.random() < 0.2) {
      const fitnessTask = await getOrCreateFitnessVerifyTask();
      if (fitnessTask) {
        taskType = fitnessTask.taskType;
        payload = fitnessTask.payload;
        priority = fitnessTask.priority;
        source = "terra";
      } else {
        // Fall through to compute task
        const liveTask = await fetchLiveTask();
        if (liveTask) {
          taskType = liveTask.taskType;
          payload = liveTask.payload;
          source = (payload.source as string) || "live";
        } else {
          const fallback = pickFallbackTask();
          taskType = fallback.taskType;
          payload = fallback.payload;
          source = "fallback";
        }
      }
    } else {
      // Try live data first, fall back to static
      const liveTask = await fetchLiveTask();
      if (liveTask) {
        taskType = liveTask.taskType;
        payload = liveTask.payload;
        source = (payload.source as string) || "live";
      } else {
        const fallback = pickFallbackTask();
        taskType = fallback.taskType;
        payload = fallback.payload;
        source = "fallback";
      }
    }

    // Scale task difficulty based on device capability tier
    if (taskType !== "fitness_verify") {
      payload = scaleTaskForTier(taskType, payload, capabilityTier);
    }

    const { data: newTask, error } = await supabase
      .from("compute_tasks")
      .insert({
        task_type: taskType,
        payload,
        difficulty: capabilityTier,
        status: "assigned",
        source,
        priority,
        seed,
        task_version: "2.0.0",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("task_assignments").insert({
      task_id: newTask.task_id,
      device_id: deviceId,
    });

    return NextResponse.json({ task: newTask });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
