import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface UserNode {
  is_active: boolean;
  last_heartbeat: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    // Return active nodes aggregated by H3 cell (not exact GPS for privacy)
    const { data: nodes } = await supabase
      .from("nodes")
      .select("h3_cell, tier")
      .eq("is_active", true)
      .not("h3_cell", "is", null);

    // Aggregate by H3 cell
    const cells = new Map<string, { dataNodes: number; validators: number }>();

    nodes?.forEach((n) => {
      const cell = cells.get(n.h3_cell) || { dataNodes: 0, validators: 0 };
      if (n.tier === 1) cell.dataNodes++;
      else cell.validators++;
      cells.set(n.h3_cell, cell);
    });

    const nodeMap = Array.from(cells.entries()).map(([h3Cell, counts]) => ({
      h3Cell,
      ...counts,
      total: counts.dataNodes + counts.validators,
    }));

    // Fetch the user's own node status if deviceId is provided
    let userNode: UserNode | null = null;
    if (deviceId) {
      const { data: userNodeData } = await supabase
        .from("nodes")
        .select("is_active, last_heartbeat")
        .eq("device_id", deviceId)
        .maybeSingle();

      if (userNodeData) {
        userNode = {
          is_active: userNodeData.is_active,
          last_heartbeat: userNodeData.last_heartbeat,
        };
      }
    }

    return NextResponse.json({
      cells: nodeMap,
      totalCells: nodeMap.length,
      userNode,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
