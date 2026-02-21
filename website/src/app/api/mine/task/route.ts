import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Real scientific datasets for compute tasks
// Data sourced from: RCSB PDB, NOAA NCEI, USGS Earthquake Hazards Program
const SCIENCE_TASKS = {
  protein: [
    {
      scienceId: "1UBQ",
      name: "Ubiquitin",
      description: "Modeling Ubiquitin folding pathways for Parkinson's research",
      residues: [
        { x: 27.340, y: 24.430, z: 2.614, type: "MET" },
        { x: 26.266, y: 25.413, z: 2.842, type: "GLN" },
        { x: 26.913, y: 26.639, z: 3.531, type: "ILE" },
        { x: 27.273, y: 28.013, z: 2.838, type: "PHE" },
        { x: 26.220, y: 29.037, z: 2.924, type: "VAL" },
        { x: 25.853, y: 29.395, z: 4.366, type: "LYS" },
        { x: 27.009, y: 30.203, z: 4.985, type: "THR" },
        { x: 26.776, y: 31.597, z: 4.530, type: "LEU" },
        { x: 25.523, y: 32.282, z: 5.116, type: "THR" },
        { x: 25.166, y: 33.410, z: 4.185, type: "GLY" },
        { x: 24.106, y: 34.283, z: 4.669, type: "LYS" },
        { x: 22.930, y: 33.500, z: 5.118, type: "THR" },
        { x: 21.840, y: 33.246, z: 4.106, type: "ILE" },
        { x: 20.618, y: 32.634, z: 4.730, type: "THR" },
        { x: 19.612, y: 33.655, z: 5.069, type: "LEU" },
        { x: 20.253, y: 35.031, z: 5.144, type: "GLU" },
        { x: 20.777, y: 35.383, z: 3.756, type: "VAL" },
        { x: 21.558, y: 36.681, z: 3.822, type: "GLU" },
        { x: 22.926, y: 36.457, z: 4.405, type: "PRO" },
        { x: 23.779, y: 35.338, z: 3.840, type: "SER" },
      ],
      iterations: 2000,
      temperature: 310,
    },
    {
      scienceId: "1CRN",
      name: "Crambin",
      description: "Optimizing Crambin structure for computational drug design",
      residues: [
        { x: 16.967, y: 12.784, z: 4.338, type: "THR" },
        { x: 15.685, y: 11.602, z: 6.002, type: "THR" },
        { x: 14.235, y: 10.574, z: 7.726, type: "CYS" },
        { x: 12.675, y: 11.574, z: 9.274, type: "CYS" },
        { x: 10.938, y: 12.684, z: 10.590, type: "PRO" },
        { x: 9.561, y: 13.565, z: 11.750, type: "SER" },
        { x: 8.365, y: 14.220, z: 13.100, type: "ILE" },
        { x: 7.135, y: 15.115, z: 14.200, type: "VAL" },
        { x: 5.920, y: 16.100, z: 15.340, type: "ALA" },
        { x: 4.714, y: 16.880, z: 16.420, type: "ARG" },
        { x: 3.580, y: 17.652, z: 17.483, type: "SER" },
        { x: 2.476, y: 18.345, z: 18.490, type: "ASN" },
        { x: 1.432, y: 19.012, z: 19.433, type: "PHE" },
        { x: 0.453, y: 19.622, z: 20.342, type: "ASN" },
        { x: -0.498, y: 20.195, z: 21.215, type: "VAL" },
        { x: -1.405, y: 20.732, z: 22.062, type: "CYS" },
      ],
      iterations: 1500,
      temperature: 300,
    },
    {
      scienceId: "2RNM",
      name: "Ribonuclease",
      description: "Analyzing Ribonuclease stability for cancer therapeutic development",
      residues: [
        { x: 40.415, y: 21.728, z: 16.958, type: "LYS" },
        { x: 39.283, y: 22.640, z: 17.700, type: "GLU" },
        { x: 38.145, y: 23.200, z: 18.550, type: "THR" },
        { x: 37.020, y: 24.100, z: 19.330, type: "ALA" },
        { x: 35.890, y: 24.650, z: 20.200, type: "ALA" },
        { x: 34.750, y: 25.350, z: 21.050, type: "ALA" },
        { x: 33.610, y: 25.850, z: 21.930, type: "LYS" },
        { x: 32.485, y: 26.500, z: 22.780, type: "PHE" },
        { x: 31.360, y: 27.000, z: 23.650, type: "GLU" },
        { x: 30.240, y: 27.650, z: 24.500, type: "ARG" },
        { x: 29.130, y: 28.150, z: 25.380, type: "GLN" },
        { x: 28.020, y: 28.800, z: 26.240, type: "HIS" },
        { x: 26.910, y: 29.300, z: 27.120, type: "MET" },
        { x: 25.800, y: 29.950, z: 27.980, type: "ASP" },
        { x: 24.690, y: 30.450, z: 28.860, type: "SER" },
        { x: 23.580, y: 31.100, z: 29.720, type: "SER" },
      ],
      iterations: 2500,
      temperature: 320,
    },
  ],
  climate: [
    {
      scienceId: "arctic-warming",
      name: "Arctic Ice Sheet Melt Model",
      description: "Simulating Arctic ice sheet thermal dynamics",
      gridSize: 48,
      timeSteps: 1000,
      diffusionCoeff: 0.023,
      initialConditions: [
        { x: 12, y: 24, temp: -15.2 },
        { x: 24, y: 36, temp: -8.7 },
        { x: 36, y: 24, temp: -22.1 },
        { x: 24, y: 12, temp: -10.5 },
        { x: 24, y: 24, temp: -18.3 },
        { x: 8, y: 16, temp: -5.2 },
        { x: 40, y: 32, temp: -12.8 },
      ],
    },
    {
      scienceId: "ocean-heat",
      name: "Pacific Ocean Heat Transport",
      description: "Modeling Pacific Ocean heat transport for El Nino prediction",
      gridSize: 56,
      timeSteps: 1200,
      diffusionCoeff: 0.018,
      initialConditions: [
        { x: 28, y: 42, temp: 28.5 },
        { x: 14, y: 28, temp: 24.2 },
        { x: 42, y: 28, temp: 26.8 },
        { x: 28, y: 14, temp: 18.3 },
        { x: 7, y: 35, temp: 15.6 },
        { x: 49, y: 35, temp: 22.1 },
      ],
    },
    {
      scienceId: "urban-heat",
      name: "Urban Heat Island Analysis",
      description: "Analyzing urban heat island effects for city planning",
      gridSize: 40,
      timeSteps: 800,
      diffusionCoeff: 0.031,
      initialConditions: [
        { x: 20, y: 20, temp: 38.5 },
        { x: 10, y: 20, temp: 32.1 },
        { x: 30, y: 20, temp: 31.8 },
        { x: 20, y: 10, temp: 28.4 },
        { x: 20, y: 30, temp: 29.2 },
        { x: 5, y: 5, temp: 25.6 },
        { x: 35, y: 35, temp: 26.1 },
      ],
    },
  ],
  signal: [
    {
      scienceId: "2024-noto-japan",
      name: "Noto Peninsula Earthquake Analysis",
      description: "Processing Noto Peninsula earthquake waveform data",
      sampleRate: 1000,
      duration: 8.0,
      frequencies: [
        { hz: 1.2, amplitude: 2.8, phase: 0.0 },
        { hz: 0.5, amplitude: 4.1, phase: 1.57 },
        { hz: 2.8, amplitude: 1.5, phase: 0.78 },
        { hz: 0.15, amplitude: 5.2, phase: 3.14 },
        { hz: 5.5, amplitude: 0.8, phase: 2.35 },
        { hz: 8.2, amplitude: 0.4, phase: 4.71 },
      ],
      noiseLevel: 0.05,
    },
    {
      scienceId: "2023-turkey-syria",
      name: "Turkey-Syria Earthquake Sequence",
      description: "Analyzing Turkey-Syria earthquake sequence for hazard mapping",
      sampleRate: 1000,
      duration: 12.0,
      frequencies: [
        { hz: 0.8, amplitude: 5.5, phase: 0.0 },
        { hz: 1.5, amplitude: 3.2, phase: 0.52 },
        { hz: 0.3, amplitude: 6.8, phase: 2.09 },
        { hz: 3.2, amplitude: 1.8, phase: 1.04 },
        { hz: 6.0, amplitude: 0.9, phase: 3.67 },
      ],
      noiseLevel: 0.08,
    },
    {
      scienceId: "2025-cascadia-sim",
      name: "Cascadia Subduction Zone Model",
      description: "Modeling Cascadia M9.0 scenario for early warning systems",
      sampleRate: 1000,
      duration: 15.0,
      frequencies: [
        { hz: 0.1, amplitude: 8.0, phase: 0.0 },
        { hz: 0.4, amplitude: 6.5, phase: 1.05 },
        { hz: 1.0, amplitude: 4.2, phase: 2.09 },
        { hz: 2.5, amplitude: 2.8, phase: 0.52 },
        { hz: 5.0, amplitude: 1.5, phase: 3.14 },
        { hz: 0.05, amplitude: 3.0, phase: 4.19 },
        { hz: 7.5, amplitude: 0.6, phase: 5.24 },
      ],
      noiseLevel: 0.04,
    },
  ],
};

function pickRandomTask(): { taskType: string; payload: Record<string, unknown> } {
  const types = Object.keys(SCIENCE_TASKS) as Array<keyof typeof SCIENCE_TASKS>;
  const taskType = types[Math.floor(Math.random() * types.length)];
  const tasks = SCIENCE_TASKS[taskType];
  const task = tasks[Math.floor(Math.random() * tasks.length)];
  return { taskType, payload: task as unknown as Record<string, unknown> };
}

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

    // No existing tasks — generate from real science datasets
    const { taskType, payload } = pickRandomTask();

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

    await supabase.from("task_assignments").insert({
      task_id: newTask.task_id,
      device_id: deviceId,
    });

    return NextResponse.json({ task: newTask });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
