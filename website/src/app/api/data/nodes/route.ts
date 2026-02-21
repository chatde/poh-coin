import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
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

    return NextResponse.json({
      cells: nodeMap,
      totalCells: nodeMap.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
