import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/mine/benchmark
 *
 * Stores device benchmark results in the device_benchmarks table.
 */
export async function POST(req: NextRequest) {
  try {
    const { deviceId, cpuScoreMs, maxMemoryMb, cores, capabilityTier } =
      await req.json();

    if (!deviceId || cpuScoreMs == null || cores == null) {
      return NextResponse.json(
        { error: "deviceId, cpuScoreMs, and cores are required" },
        { status: 400 }
      );
    }

    // Validate device exists
    const { data: node } = await supabase
      .from("nodes")
      .select("device_id")
      .eq("device_id", deviceId)
      .single();

    if (!node) {
      return NextResponse.json(
        { error: "Device not registered" },
        { status: 404 }
      );
    }

    // Validate tier
    const tier = Math.min(3, Math.max(1, Math.round(capabilityTier || 1)));

    // Upsert benchmark
    const { error } = await supabase.from("device_benchmarks").upsert({
      device_id: deviceId,
      cpu_score_ms: Math.round(cpuScoreMs),
      max_memory_mb: Math.round(maxMemoryMb || 2048),
      cores: Math.round(cores),
      capability_tier: tier,
      benchmarked_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stored: true, tier });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
