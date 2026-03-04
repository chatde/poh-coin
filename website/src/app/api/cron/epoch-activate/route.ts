import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACTS, REWARDS_ABI, RPC_URL } from "@/lib/contracts";

/**
 * Activates the pending merkle root after the 24hr timelock expires.
 * Runs every Monday at 5AM UTC (25hrs after epoch-close at Sunday 4AM).
 */
async function runEpochActivate(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signerKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.BACKEND_SIGNER_KEY;
  if (!signerKey) {
    return NextResponse.json({ error: "No signer key configured" }, { status: 500 });
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(signerKey, provider);
  const rewards = new ethers.Contract(CONTRACTS.rewards, REWARDS_ABI, signer);

  const pendingRoot = await rewards.pendingRoot();

  if (pendingRoot === ethers.ZeroHash) {
    return NextResponse.json({ message: "No pending root to activate" });
  }

  const pendingTs = await rewards.pendingRootTimestamp();
  const timelockDuration = await rewards.TIMELOCK_DURATION();
  const activatesAt = Number(pendingTs) + Number(timelockDuration);

  if (Math.floor(Date.now() / 1000) < activatesAt) {
    const remainingMins = Math.ceil((activatesAt - Date.now() / 1000) / 60);
    return NextResponse.json({
      message: `Timelock not expired. ${remainingMins} minutes remaining.`,
      activatesAt: new Date(activatesAt * 1000).toISOString(),
    });
  }

  const tx = await rewards.activateMerkleRoot();
  const receipt = await tx.wait();
  const currentEpoch = await rewards.currentEpoch();

  return NextResponse.json({
    activated: true,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    onChainEpoch: Number(currentEpoch),
    message: "Merkle root activated. Miners can now claim their rewards.",
  });
}

// GET — invoked by Vercel Cron (crons always use GET)
export async function GET(req: NextRequest) {
  try {
    return await runEpochActivate(req);
  } catch (err) {
    console.error("Epoch activate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — available for manual/external triggers
export async function POST(req: NextRequest) {
  try {
    return await runEpochActivate(req);
  } catch (err) {
    console.error("Epoch activate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
