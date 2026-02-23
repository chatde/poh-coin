/**
 * Folding@Home Integration — F@H API Client + Team Sync
 *
 * Users install the official F@H client, join the POH team, then link
 * their F@H username here to earn bonus mining points.
 * Same model as Banano's F@H integration.
 */

import { supabase } from "@/lib/supabase";

// Set after creating the team at foldingathome.org
export const FAH_TEAM_ID = 1067948;

const FAH_API_BASE = "https://api.foldingathome.org";

// ── Types ────────────────────────────────────────────────────────────

export interface FAHUser {
  name: string;
  id: number;
  score: number;
  wus: number;
  rank: number;
  team: number;
}

export interface FAHTeamMember {
  name: string;
  id: number;
  score: number;
  wus: number;
  rank: number;
}

export interface FAHLink {
  id: string;
  wallet_address: string;
  fah_username: string;
  fah_score: number;
  fah_wus: number;
  last_synced_at: string | null;
  verified: boolean;
  created_at: string;
}

// ── F@H API Functions ────────────────────────────────────────────────

/** Look up a F@H user by username */
export async function lookupFahUser(username: string): Promise<FAHUser | null> {
  try {
    const res = await fetch(`${FAH_API_BASE}/user/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name || username,
      id: data.id || 0,
      score: data.score || 0,
      wus: data.wus || 0,
      rank: data.rank || 0,
      team: data.team || 0,
    };
  } catch {
    return null;
  }
}

/** Get all members of the POH team */
export async function getTeamMembers(): Promise<FAHTeamMember[]> {
  if (!FAH_TEAM_ID) return [];
  try {
    const res = await fetch(`${FAH_API_BASE}/team/${FAH_TEAM_ID}/members`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((m: Record<string, unknown>) => ({
      name: (m.name as string) || "",
      id: (m.id as number) || 0,
      score: (m.score as number) || 0,
      wus: (m.wus as number) || 0,
      rank: (m.rank as number) || 0,
    }));
  } catch {
    return [];
  }
}

/** Check if a user is on the POH team */
export async function isOnPohTeam(username: string): Promise<boolean> {
  const user = await lookupFahUser(username);
  if (!user) return false;
  return user.team === FAH_TEAM_ID;
}

/** Sync F@H contributions for all linked users */
export async function syncFahContributions(): Promise<{
  synced: number;
  errors: number;
  totalDeltaWUs: number;
}> {
  const result = { synced: 0, errors: 0, totalDeltaWUs: 0 };

  // Get all linked F@H accounts
  const { data: links } = await supabase
    .from("fah_links")
    .select("*")
    .eq("verified", true);

  if (!links || links.length === 0) return result;

  // Fetch team members for batch lookup
  const members = await getTeamMembers();
  const memberMap = new Map(members.map((m) => [m.name.toLowerCase(), m]));

  for (const link of links) {
    try {
      const member = memberMap.get(link.fah_username.toLowerCase());

      // If not in team list, try direct lookup
      let score = 0;
      let wus = 0;

      if (member) {
        score = member.score;
        wus = member.wus;
      } else {
        const user = await lookupFahUser(link.fah_username);
        if (user && user.team === FAH_TEAM_ID) {
          score = user.score;
          wus = user.wus;
        } else {
          // User left team — mark as unverified
          await supabase
            .from("fah_links")
            .update({ verified: false })
            .eq("id", link.id);
          continue;
        }
      }

      // Calculate delta WUs since last sync
      const deltaWUs = Math.max(0, wus - (link.fah_wus || 0));
      result.totalDeltaWUs += deltaWUs;

      // Update stored stats
      await supabase
        .from("fah_links")
        .update({
          fah_score: score,
          fah_wus: wus,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", link.id);

      result.synced++;
    } catch {
      result.errors++;
    }
  }

  return result;
}

/** Calculate bonus points from F@H work units */
export function calculateFahBonus(deltaWUs: number): number {
  // 10 points per WU completed
  return deltaWUs * 10;
}

/** Get F@H bonus points for a specific wallet in the current period */
export async function getWalletFahBonus(walletAddress: string): Promise<number> {
  const { data: link } = await supabase
    .from("fah_links")
    .select("fah_wus, last_synced_at")
    .eq("wallet_address", walletAddress.toLowerCase())
    .eq("verified", true)
    .single();

  if (!link) return 0;

  // For epoch calculation, the delta is tracked during syncFahContributions
  // Here we return the current WUs as a reference
  return link.fah_wus || 0;
}
