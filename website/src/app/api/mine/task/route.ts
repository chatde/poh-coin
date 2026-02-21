import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// WASM task payloads — science-style mocks for Phase 1
const TASK_GENERATORS: Record<string, () => Record<string, unknown>> = {
  protein: () => ({
    // Simplified protein energy minimization
    residues: Array.from({ length: 20 + Math.floor(Math.random() * 30) }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
      type: ["ALA", "GLY", "VAL", "LEU", "ILE"][Math.floor(Math.random() * 5)],
    })),
    iterations: 1000 + Math.floor(Math.random() * 4000),
    temperature: 300 + Math.random() * 100,
  }),

  climate: () => ({
    // Finite-difference heat equation on a grid
    gridSize: 32 + Math.floor(Math.random() * 32),
    timeSteps: 500 + Math.floor(Math.random() * 1500),
    diffusionCoeff: 0.01 + Math.random() * 0.05,
    initialConditions: Array.from({ length: 5 }, () => ({
      x: Math.floor(Math.random() * 64),
      y: Math.floor(Math.random() * 64),
      temp: 200 + Math.random() * 200,
    })),
  }),

  signal: () => ({
    // FFT on synthetic seismic waveform
    sampleRate: 1000,
    duration: 5 + Math.random() * 10,
    frequencies: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => ({
      hz: 1 + Math.random() * 100,
      amplitude: 0.1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    })),
    noiseLevel: 0.01 + Math.random() * 0.1,
  }),
};

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // Verify device is active
    const { data: node } = await supabase
      .from("nodes")
      .select("is_active")
      .eq("device_id", deviceId)
      .single();

    if (!node?.is_active) {
      return NextResponse.json({ error: "Device not active" }, { status: 403 });
    }

    // Check if device already has an assigned task
    const { data: existing } = await supabase
      .from("task_assignments")
      .select("task_id, compute_tasks(task_id, task_type, payload, difficulty)")
      .eq("device_id", deviceId)
      .is("submitted_at", null)
      .limit(1)
      .single();

    if (existing) {
      const task = existing.compute_tasks as unknown as Record<string, unknown>;
      return NextResponse.json({ task });
    }

    // Find an unassigned or under-assigned task (need 3 assignments for 2-of-3 verification)
    const { data: pendingTasks } = await supabase
      .rpc("get_available_task", { p_device_id: deviceId });

    const pendingTask = Array.isArray(pendingTasks) ? pendingTasks[0] : pendingTasks;

    if (pendingTask && pendingTask.task_id) {
      // Assign this task to the device
      await supabase.from("task_assignments").insert({
        task_id: pendingTask.task_id,
        device_id: deviceId,
      });

      return NextResponse.json({ task: pendingTask });
    }

    // No existing tasks — generate a new one
    const taskTypes = Object.keys(TASK_GENERATORS);
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const payload = TASK_GENERATORS[taskType]();

    const { data: newTask, error } = await supabase
      .from("compute_tasks")
      .insert({
        task_type: taskType,
        payload,
        difficulty: 1,
        status: "assigned",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Assign to this device
    await supabase.from("task_assignments").insert({
      task_id: newTask.task_id,
      device_id: deviceId,
    });

    return NextResponse.json({ task: newTask });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
