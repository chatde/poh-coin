import { randomBytes, createHash } from "crypto";

/**
 * Generate a random challenge string for heartbeat verification.
 */
export function generateChallenge(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Verify a heartbeat challenge-response.
 * Expected response = SHA256(challenge + deviceId)
 */
export function verifyChallenge(
  challenge: string,
  deviceId: string,
  response: string
): boolean {
  const expected = createHash("sha256")
    .update(challenge + deviceId)
    .digest("hex");
  return expected === response;
}

/**
 * Generate a referral code from a wallet address.
 */
export function generateReferralCode(wallet: string): string {
  const hash = createHash("sha256").update(wallet + Date.now()).digest("hex");
  return "POH-" + hash.slice(0, 8).toUpperCase();
}
