import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface RecentBlock {
  id: number;
  height: number;
  solver_wallet: string;
  reward_poh: number;
  mined_at: string;
}

interface RpcRow {
  id: number;
  height: number;
  solver_wallet: string;
  reward_poh: string | number;
  mined_at: string;
}

export async function GET() {
  try {
    const { data, error } = await supabase.rpc("get_recent_blocks", {
      limit_count: 10,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const blocks: RecentBlock[] = ((data as RpcRow[]) ?? []).map((row) => ({
      id: row.id,
      height: row.height,
      solver_wallet: row.solver_wallet,
      reward_poh: Number(row.reward_poh),
      mined_at: row.mined_at,
    }));

    return NextResponse.json({ blocks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
