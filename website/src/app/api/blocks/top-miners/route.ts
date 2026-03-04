import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface TopMiner {
  wallet_address: string;
  blocks_mined: number;
  poh_earned: number;
  rank: number;
}

interface RpcRow {
  wallet_address: string;
  blocks_mined: number;
  poh_earned: string | number;
  rank: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const epochParam = searchParams.get("epoch");

    let epochNum: number;

    if (epochParam !== null) {
      epochNum = parseInt(epochParam, 10);
    } else {
      // Resolve the current active epoch
      const { data: epoch } = await supabase
        .from("epochs")
        .select("epoch_number")
        .eq("status", "active")
        .order("epoch_number", { ascending: false })
        .limit(1)
        .single();

      epochNum = epoch?.epoch_number ?? 1;
    }

    const { data, error } = await supabase.rpc("get_top_miners_by_epoch", {
      epoch_num: epochNum,
      limit_count: 10,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const miners: TopMiner[] = ((data as RpcRow[]) ?? []).map((row) => ({
      wallet_address: row.wallet_address,
      blocks_mined: row.blocks_mined,
      poh_earned: Number(row.poh_earned),
      rank: row.rank,
    }));

    return NextResponse.json({ miners, epoch: epochNum });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
