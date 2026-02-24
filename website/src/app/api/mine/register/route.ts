import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabase";
import { STARTING_REPUTATION } from "@/lib/constants";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { CONTRACTS, REGISTRY_ABI, RPC_URL } from "@/lib/contracts";

export async function POST(req: NextRequest) {
  try {
    const {
      deviceId,
      walletAddress,
      tier,
      h3Cell,
      signature,
      signedMessage,
      timestamp,
      fingerprint,
    } = await req.json();

    if (!deviceId || !walletAddress) {
      return NextResponse.json(
        { error: "deviceId and walletAddress are required" },
        { status: 400 }
      );
    }

    if (tier && ![1, 2].includes(tier)) {
      return NextResponse.json(
        { error: "tier must be 1 (data node) or 2 (validator)" },
        { status: 400 }
      );
    }

    // ── Rate limiting ────────────────────────────────────────────
    const walletKey = `register:wallet:${walletAddress.toLowerCase()}`;
    const walletAllowed = await checkRateLimit(
      walletKey,
      RATE_LIMITS.REGISTER_PER_WALLET.maxCount,
      RATE_LIMITS.REGISTER_PER_WALLET.windowMs,
    );
    if (!walletAllowed) {
      return NextResponse.json(
        { error: "Too many registrations for this wallet. Max 3 per day." },
        { status: 429 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipKey = `register:ip:${ip}`;
    const ipAllowed = await checkRateLimit(
      ipKey,
      RATE_LIMITS.REGISTER_PER_IP.maxCount,
      RATE_LIMITS.REGISTER_PER_IP.windowMs,
    );
    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many registrations from this IP. Max 5 per hour." },
        { status: 429 }
      );
    }

    // ── Wallet signature verification (EIP-191) ──────────────────
    let signatureVerified = false;

    if (signature && signedMessage && timestamp) {
      // Check timestamp freshness (within 5 minutes)
      const msgTimestamp = parseInt(timestamp);
      const now = Date.now();
      if (isNaN(msgTimestamp) || Math.abs(now - msgTimestamp) > 5 * 60 * 1000) {
        return NextResponse.json(
          { error: "Signature timestamp expired. Must be within 5 minutes." },
          { status: 400 }
        );
      }

      try {
        // Recover signer address from EIP-191 signature
        const recoveredAddress = ethers.verifyMessage(signedMessage, signature);
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          return NextResponse.json(
            { error: "Signature does not match wallet address" },
            { status: 401 }
          );
        }
        signatureVerified = true;
      } catch {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // ── Device fingerprint sybil check ───────────────────────────
    if (fingerprint) {
      // Check if this fingerprint is already bound to a different wallet
      const { data: existingFp } = await supabase
        .from("device_fingerprints")
        .select("wallet_address")
        .eq("fingerprint_hash", fingerprint)
        .single();

      if (existingFp && existingFp.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json(
          { error: "This device is already registered to a different wallet (sybil detected)" },
          { status: 409 }
        );
      }
    }

    // ── Check if device already registered ───────────────────────
    const { data: existing } = await supabase
      .from("nodes")
      .select("device_id")
      .eq("device_id", deviceId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Device already registered" },
        { status: 409 }
      );
    }

    // ── Register device ──────────────────────────────────────────
    const { data, error } = await supabase.from("nodes").insert({
      device_id: deviceId,
      wallet_address: walletAddress.toLowerCase(),
      tier: tier || 1,
      h3_cell: h3Cell || null,
      reputation: STARTING_REPUTATION,
      fingerprint_hash: fingerprint || null,
      signature_verified: signatureVerified,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── Store fingerprint binding ────────────────────────────────
    if (fingerprint) {
      await supabase.from("device_fingerprints").upsert({
        fingerprint_hash: fingerprint,
        device_id: deviceId,
        wallet_address: walletAddress.toLowerCase(),
      });
    }

    // ── Initialize streak tracking ───────────────────────────────
    await supabase.from("streaks").upsert({
      wallet_address: walletAddress.toLowerCase(),
      current_streak: 0,
      longest_streak: 0,
    });

    // ── On-chain registration bridge (~$0.001 on Base) ─────────
    let onChainTxHash: string | null = null;
    const signerKey = process.env.BACKEND_SIGNER_KEY;

    if (signerKey) {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(signerKey, provider);
        const registry = new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, signer);

        // Convert deviceId string to bytes32
        const deviceIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(deviceId));

        // Check if already registered on-chain
        const alreadyOnChain = await registry.isActiveNode(deviceIdBytes32);
        if (!alreadyOnChain) {
          const tx = await registry.registerNode(deviceIdBytes32, tier || 1);
          await tx.wait();
          onChainTxHash = tx.hash;
        }
      } catch {
        // On-chain registration is best-effort — off-chain is the source of truth
        // Will be retried by a future cron or manual trigger
      }
    }

    return NextResponse.json({
      node: data,
      signatureVerified,
      onChainTxHash,
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
