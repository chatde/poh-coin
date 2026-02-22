import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buildMerkleTree, toWei } from "@/lib/merkle";
import { syncFahContributions, calculateFahBonus } from "@/lib/fah-data";
import {
  calculateWeeklyPool,
  DATA_NODE_SHARE,
  VALIDATOR_SHARE,
  QUALITY_BONUS,
  STREAK_7D_BONUS,
  STREAK_30D_BONUS,
  TRUST_RAMP,
  GEO_DECAY,
  DAILY_CAP_PCT,
  REFERRAL_BONUS,
  REFERRAL_DURATION_DAYS,
  NEW_MINER_IMMEDIATE,
  NEW_MINER_VESTING,
  NEW_MINER_VESTING_DAYS,
  VETERAN_IMMEDIATE,
  VETERAN_VESTING,
  VETERAN_VESTING_DAYS,
  VETERAN_THRESHOLD_DAYS,
  VALIDATOR_STAKED_MULTIPLIER,
} from "@/lib/constants";

interface DevicePoints {
  deviceId: string;
  walletAddress: string;
  tier: number;
  h3Cell: string | null;
  reputation: number;
  registeredAt: string;
  trustWeek: number;
  rawPoints: number;
  tasksCompleted: number;
  qualityVerified: number;
  streakDays: number;
  isStaked: boolean;
}

interface WalletReward {
  wallet: string;
  totalPoints: number;
  pohAmount: number;
  claimableNow: number;
  vestingAmount: number;
  vestingDurationDays: number;
}

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get the active epoch
    const { data: epoch } = await supabase
      .from("epochs")
      .select("*")
      .eq("status", "active")
      .single();

    if (!epoch) {
      return NextResponse.json({ error: "No active epoch" }, { status: 400 });
    }

    const weeklyPool = calculateWeeklyPool(new Date(epoch.end_date));
    const dataPool = weeklyPool * DATA_NODE_SHARE;
    const validatorPool = weeklyPool * VALIDATOR_SHARE;

    // 2. Query all proofs for this epoch
    const { data: proofs } = await supabase
      .from("proofs")
      .select("device_id, points_earned, tasks_completed, quality_verified, streak_days")
      .eq("epoch", epoch.epoch_number);

    if (!proofs || proofs.length === 0) {
      // No activity this epoch — close it empty
      await supabase
        .from("epochs")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("epoch_number", epoch.epoch_number);

      return NextResponse.json({ message: "Epoch closed with no activity" });
    }

    // 3. Aggregate proofs by device
    const deviceMap = new Map<string, {
      rawPoints: number;
      tasksCompleted: number;
      qualityVerified: number;
      maxStreak: number;
    }>();

    for (const proof of proofs) {
      const existing = deviceMap.get(proof.device_id) || {
        rawPoints: 0, tasksCompleted: 0, qualityVerified: 0, maxStreak: 0,
      };
      existing.rawPoints += Number(proof.points_earned);
      existing.tasksCompleted += proof.tasks_completed;
      if (proof.quality_verified) existing.qualityVerified++;
      existing.maxStreak = Math.max(existing.maxStreak, proof.streak_days);
      deviceMap.set(proof.device_id, existing);
    }

    // 4. Fetch node details for all active devices
    const deviceIds = Array.from(deviceMap.keys());
    const { data: nodes } = await supabase
      .from("nodes")
      .select("device_id, wallet_address, tier, h3_cell, reputation, registered_at, trust_week")
      .in("device_id", deviceIds);

    if (!nodes) {
      return NextResponse.json({ error: "Failed to fetch nodes" }, { status: 500 });
    }

    // 5. Get active referrals
    const { data: referrals } = await supabase
      .from("referrals")
      .select("referrer_wallet, invitee_wallet")
      .eq("active", true)
      .gt("bonus_expires_at", new Date().toISOString());

    const activeReferrers = new Set<string>();
    const activeInvitees = new Set<string>();
    referrals?.forEach((r) => {
      if (r.invitee_wallet) {
        activeReferrers.add(r.referrer_wallet);
        activeInvitees.add(r.invitee_wallet);
      }
    });

    // 6. Get staked validators
    // (would check on-chain; for now check if tier=2 with any stake recorded)
    const stakedValidators = new Set<string>();
    const { data: validators } = await supabase
      .from("nodes")
      .select("wallet_address")
      .eq("tier", 2)
      .eq("is_active", true);
    // In full implementation, cross-reference on-chain stake

    // 7. Build per-device points with all bonuses
    const devicePoints: DevicePoints[] = [];

    for (const node of nodes) {
      const stats = deviceMap.get(node.device_id);
      if (!stats) continue;

      devicePoints.push({
        deviceId: node.device_id,
        walletAddress: node.wallet_address,
        tier: node.tier,
        h3Cell: node.h3_cell,
        reputation: node.reputation,
        registeredAt: node.registered_at,
        trustWeek: node.trust_week,
        rawPoints: stats.rawPoints,
        tasksCompleted: stats.tasksCompleted,
        qualityVerified: stats.qualityVerified,
        streakDays: stats.maxStreak,
        isStaked: stakedValidators.has(node.wallet_address),
      });
    }

    // 7b. Sync Folding@Home contributions and compute bonuses
    const fahSync = await syncFahContributions();

    // Build a map of F@H bonus points per wallet
    const fahBonusMap = new Map<string, number>();
    if (fahSync.synced > 0) {
      const { data: fahLinks } = await supabase
        .from("fah_links")
        .select("wallet_address, fah_wus")
        .eq("verified", true);

      if (fahLinks) {
        for (const link of fahLinks) {
          // Calculate bonus from WUs completed (tracked via delta in syncFahContributions)
          const bonus = calculateFahBonus(link.fah_wus || 0);
          if (bonus > 0) {
            fahBonusMap.set(link.wallet_address, bonus);
          }
        }
      }
    }

    // 8. Apply bonuses and compute final points per device

    // Group devices by wallet and H3 cell for geographic decay
    const walletDevices = new Map<string, DevicePoints[]>();
    const cellDevices = new Map<string, Map<string, DevicePoints[]>>();

    for (const dp of devicePoints) {
      // Group by wallet
      const wd = walletDevices.get(dp.walletAddress) || [];
      wd.push(dp);
      walletDevices.set(dp.walletAddress, wd);

      // Group by H3 cell per wallet
      if (dp.h3Cell) {
        const walletCells = cellDevices.get(dp.walletAddress) || new Map();
        const cellList = walletCells.get(dp.h3Cell) || [];
        cellList.push(dp);
        walletCells.set(dp.h3Cell, cellList);
        cellDevices.set(dp.walletAddress, walletCells);
      }
    }

    // Calculate daily cap based on weekly pool
    const dailyCap = weeklyPool * DAILY_CAP_PCT;
    const weeklyDeviceCap = dailyCap * 7;

    // Compute adjusted points for each device
    const adjustedPoints = new Map<string, number>();
    let totalDataPoints = 0;
    let totalValidatorPoints = 0;

    for (const dp of devicePoints) {
      let points = dp.rawPoints;

      // A. Quality bonus (+25% for verified correct results)
      if (dp.qualityVerified > 0 && dp.tasksCompleted > 0) {
        const qualityRatio = dp.qualityVerified / dp.tasksCompleted;
        points *= 1 + QUALITY_BONUS * qualityRatio;
      }

      // B. Streak bonus
      if (dp.streakDays >= 30) {
        points *= 1 + STREAK_30D_BONUS;
      } else if (dp.streakDays >= 7) {
        points *= 1 + STREAK_7D_BONUS;
      }

      // C. Trust ramp (weeks 1-4)
      const trustIdx = Math.min(dp.trustWeek - 1, TRUST_RAMP.length - 1);
      points *= TRUST_RAMP[Math.max(0, trustIdx)];

      // D. Geographic decay (devices in same H3 cell)
      if (dp.h3Cell) {
        const walletCells = cellDevices.get(dp.walletAddress);
        if (walletCells) {
          const cellList = walletCells.get(dp.h3Cell) || [];
          const deviceIndex = cellList.indexOf(dp);
          const decayIdx = Math.min(deviceIndex, GEO_DECAY.length - 1);
          points *= GEO_DECAY[decayIdx];
        }
      }

      // E. Quadratic wallet scaling (diminishing returns per device)
      const walletDeviceList = walletDevices.get(dp.walletAddress) || [];
      if (walletDeviceList.length > 1) {
        const deviceIndex = walletDeviceList.indexOf(dp);
        // Quadratic decay: 1st=100%, 2nd=50%, 3rd=33%, 4th=25%
        points *= 1 / (deviceIndex + 1);
      }

      // F. Daily cap (max 0.1% of weekly pool per device per day × 7 days)
      points = Math.min(points, weeklyDeviceCap);

      // G. Referral bonus (+10%)
      if (
        activeReferrers.has(dp.walletAddress) ||
        activeInvitees.has(dp.walletAddress)
      ) {
        points *= 1 + REFERRAL_BONUS;
      }

      // H. Staked validator multiplier
      if (dp.tier === 2 && dp.isStaked) {
        points *= VALIDATOR_STAKED_MULTIPLIER;
      }

      // I. F@H bonus points
      const fahBonus = fahBonusMap.get(dp.walletAddress) || 0;
      if (fahBonus > 0) {
        points += fahBonus;
      }

      adjustedPoints.set(dp.deviceId, points);

      if (dp.tier === 1) totalDataPoints += points;
      else totalValidatorPoints += points;
    }

    // 9. Calculate each wallet's share of the pool
    const walletRewards = new Map<string, WalletReward>();

    for (const dp of devicePoints) {
      const points = adjustedPoints.get(dp.deviceId) || 0;
      const pool = dp.tier === 1 ? dataPool : validatorPool;
      const totalPoolPoints = dp.tier === 1 ? totalDataPoints : totalValidatorPoints;

      if (totalPoolPoints === 0) continue;

      const share = (points / totalPoolPoints) * pool;

      const existing = walletRewards.get(dp.walletAddress) || {
        wallet: dp.walletAddress,
        totalPoints: 0,
        pohAmount: 0,
        claimableNow: 0,
        vestingAmount: 0,
        vestingDurationDays: 0,
      };

      existing.totalPoints += points;
      existing.pohAmount += share;
      walletRewards.set(dp.walletAddress, existing);
    }

    // 10. Apply vesting based on reputation tier
    for (const [wallet, reward] of walletRewards) {
      // Find earliest registration for this wallet
      const devices = walletDevices.get(wallet) || [];
      const earliestReg = devices.reduce((min, d) => {
        const regDate = new Date(d.registeredAt).getTime();
        return regDate < min ? regDate : min;
      }, Date.now());

      const daysActive = (Date.now() - earliestReg) / (1000 * 60 * 60 * 24);

      if (daysActive >= VETERAN_THRESHOLD_DAYS) {
        // Veteran: 75% immediate / 25% vests 30d
        reward.claimableNow = reward.pohAmount * VETERAN_IMMEDIATE;
        reward.vestingAmount = reward.pohAmount * VETERAN_VESTING;
        reward.vestingDurationDays = VETERAN_VESTING_DAYS;
      } else {
        // New miner: 25% immediate / 75% vests 180d
        reward.claimableNow = reward.pohAmount * NEW_MINER_IMMEDIATE;
        reward.vestingAmount = reward.pohAmount * NEW_MINER_VESTING;
        reward.vestingDurationDays = NEW_MINER_VESTING_DAYS;
      }
    }

    // 11. Build merkle tree
    const rewardArray = Array.from(walletRewards.values()).filter(
      (r) => r.pohAmount > 0
    );

    const merkleLeaves = rewardArray.map((r) => ({
      wallet: r.wallet,
      claimableNow: toWei(r.claimableNow),
      vestingAmount: toWei(r.vestingAmount),
      vestingDuration: BigInt(r.vestingDurationDays * 24 * 60 * 60),
    }));

    const { root, proofs: merkleProofs } = buildMerkleTree(merkleLeaves);

    // 12. Store rewards in database
    for (const reward of rewardArray) {
      const proof = merkleProofs.get(reward.wallet.toLowerCase());

      await supabase.from("rewards").upsert({
        wallet_address: reward.wallet,
        epoch: epoch.epoch_number,
        total_points: reward.totalPoints,
        poh_amount: reward.pohAmount,
        claimable_now: reward.claimableNow,
        vesting_amount: reward.vestingAmount,
        vesting_duration_days: reward.vestingDurationDays,
        merkle_proof: proof || [],
      });
    }

    // 13. Close epoch and record merkle root
    await supabase
      .from("epochs")
      .update({
        status: "closed",
        merkle_root: root,
        total_points: rewardArray.reduce((sum, r) => sum + r.totalPoints, 0),
        total_devices: devicePoints.length,
        closed_at: new Date().toISOString(),
      })
      .eq("epoch_number", epoch.epoch_number);

    // 14. Update streaks for all active wallets
    const today = new Date().toISOString().split("T")[0];
    for (const [wallet] of walletRewards) {
      const { data: streak } = await supabase
        .from("streaks")
        .select("*")
        .eq("wallet_address", wallet)
        .single();

      if (streak) {
        const lastActive = streak.last_active_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        let newStreak = streak.current_streak;
        if (lastActive === yesterday) {
          newStreak++;
        } else if (lastActive !== today) {
          newStreak = 1; // Reset streak
        }

        await supabase
          .from("streaks")
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(streak.longest_streak, newStreak),
            last_active_date: today,
          })
          .eq("wallet_address", wallet);
      }
    }

    // 15. Advance trust weeks for all nodes
    await supabase
      .from("nodes")
      .update({ trust_week: Math.min(4, epoch.epoch_number + 1) })
      .in("device_id", deviceIds)
      .lt("trust_week", 4);

    // 16. Create next epoch
    const nextStart = new Date(epoch.end_date);
    nextStart.setDate(nextStart.getDate() + 1);
    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextEnd.getDate() + 6);

    await supabase.from("epochs").insert({
      epoch_number: epoch.epoch_number + 1,
      start_date: nextStart.toISOString().split("T")[0],
      end_date: nextEnd.toISOString().split("T")[0],
      weekly_pool: calculateWeeklyPool(nextStart),
      status: "active",
    });

    return NextResponse.json({
      epoch: epoch.epoch_number,
      merkleRoot: root,
      totalRewards: rewardArray.length,
      weeklyPool,
      totalDistributed: rewardArray.reduce((sum, r) => sum + r.pohAmount, 0),
      message: "Epoch closed. Merkle root ready for 24hr timelock submission.",
    });
  } catch (err) {
    console.error("Epoch close error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
