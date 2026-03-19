---
report_type: vulnerability-hunting
generated: 2026-03-19T16:00:00Z
version: 2026-03-19
status: warning
agent: security-scanner
files_processed: 87
issues_found: 19
critical_count: 3
high_count: 6
medium_count: 7
low_count: 3
modifications_made: false
---

# Security Scan Report -- POH Coin (Pursuit of Happiness)

**Generated**: 2026-03-19
**Project**: poh-coin (website + smart contracts)
**Files Analyzed**: 87 (6 .sol, 26 API routes, 14 deploy scripts, 13 SQL migrations, 28 lib/component files)
**Total Issues Found**: 19
**Status**: WARNING -- 3 critical issues require immediate attention

---

## Executive Summary

This cryptocurrency project handles real money on Base mainnet. The codebase shows strong security awareness (RLS enabled on all tables, rate limiting, merkle proofs, timelocks, challenge-response heartbeats). However, three critical issues were found: **exposed private keys in plaintext .env files on the local machine**, **mnemonic stored in browser localStorage**, and a **missing POHRewards ownership transfer to governance**. Several high-priority issues around API authentication and mining proof spoofability also require attention before mainnet launch.

### Key Metrics
- **Critical Issues**: 3
- **High Priority Issues**: 6
- **Medium Priority Issues**: 7
- **Low Priority Issues**: 3
- **Files Scanned**: 87
- **Modifications Made**: No

### Highlights
- .env files are correctly gitignored (not tracked in git)
- Smart contracts use OpenZeppelin 5.x -- no reentrancy or overflow risks (Solidity 0.8.24+ with built-in checks)
- RLS enabled on all 18+ Supabase tables
- Rate limiting implemented with fail-closed design
- 24hr timelock on merkle root changes
- Governance with TimelockController properly configured
- No hardcoded private keys in source code (only in .env)
- No XSS vectors in user-rendered content (single dangerouslySetInnerHTML is for static JSON-LD)

---

## Critical Issues (Priority 1)

### CRITICAL-1: Mainnet Deployer Private Key in Plaintext .env

- **File**: `/Volumes/AI-Models/poh-coin/.env:7`
- **Category**: Secret Exposure / Key Management
- **Description**: The mainnet deployer private key (`DEPLOYER_PRIVATE_KEY=0x821b...`) is stored in plaintext in the root `.env` file. This key controls the deployer wallet (`0x2d0BbA61E34015F2e511d96A40980e90882ba768`) which is the owner of POHToken, POHRewards, and POHNodeRegistry contracts. If this machine is compromised, an attacker could:
  - Pause/unpause the token contract
  - Change charity/liquidity wallets to attacker-controlled addresses
  - Stage fraudulent merkle roots to steal the 50% community rewards pool
  - Slash any validator's stake
  - Set arbitrary reputation scores
- **Impact**: TOTAL LOSS OF ALL FUNDS. Attacker gains owner-level control of all contracts.
- **Evidence**:
  ```
  # .env line 7
  DEPLOYER_PRIVATE_KEY=0x821b9b3bdb87717be27585622779ab9e67f7b44ebd81fb986cab0dafa36de58d
  ```
- **Fix**:
  1. **Immediately rotate this key** -- transfer contract ownership to a new address
  2. Use a hardware wallet (Ledger) for all owner operations
  3. Transfer remaining ETH/tokens from this wallet to a hardware wallet
  4. Delete the private key from .env; use `--ledger` flag with Hardhat for deployments
  5. Consider transferring POHToken and POHRewards ownership to the TimelockController (governance)

### CRITICAL-2: Mnemonic Stored in Browser localStorage

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/mine/setup/page.tsx:149`
- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/mine/components/WalletManager.tsx:56`
- **Category**: Client-Side Secret Storage
- **Description**: When users create a wallet through the mining setup flow, the 12/24-word mnemonic phrase is stored in `localStorage.setItem("poh-mnemonic", mnemonic)`. localStorage is:
  - Accessible to any JavaScript running on the same origin (XSS = total wallet theft)
  - Readable by browser extensions
  - Not encrypted
  - Persisted indefinitely
  - Visible in browser DevTools
- **Impact**: Any XSS vulnerability, malicious browser extension, or shared computer usage could lead to theft of all user funds in their mining wallets.
- **Evidence**:
  ```typescript
  // setup/page.tsx:149
  localStorage.setItem("poh-mnemonic", mnemonic);

  // WalletManager.tsx:56
  const stored = localStorage.getItem("poh-mnemonic");
  ```
- **Fix**:
  1. Never store mnemonics in localStorage
  2. Use the Web Crypto API with `crypto.subtle.generateKey()` and store encrypted keys in IndexedDB with user-provided password
  3. Or better: integrate with MetaMask/WalletConnect and never handle private keys
  4. If in-browser wallet is a requirement, use `sessionStorage` at minimum (cleared on tab close) and encrypt with a user password
  5. Show the mnemonic once during setup, require the user to write it down, then discard from memory

### CRITICAL-3: POHRewards and POHNodeRegistry Ownership Not Transferred to Governance

- **File**: `/Volumes/AI-Models/poh-coin/scripts/deploy-mainnet.js`
- **File**: `/Volumes/AI-Models/poh-coin/contracts/POHRewards.sol`
- **Category**: Access Control / Centralization Risk
- **Description**: The mainnet deploy script transfers POHCharity ownership to the TimelockController (line 219), but **POHRewards and POHNodeRegistry ownership remain with the deployer EOA**. The deployer can:
  - Stage fraudulent merkle roots and steal the community rewards pool (~12.26B tokens)
  - Set arbitrary reputation scores to game rewards
  - Slash any validator's stake without governance approval
- **Impact**: Single point of failure. If the deployer key is compromised, the entire reward system is compromised. Even without compromise, this is a centralization risk that undermines trust.
- **Evidence**:
  ```javascript
  // deploy-mainnet.js:219 -- Only Charity is transferred
  tx = await charity.transferOwnership(timelockAddress);

  // Missing:
  // await rewards.transferOwnership(timelockAddress);
  // await registry.transferOwnership(timelockAddress);
  ```
- **Fix**: Transfer ownership of POHRewards and POHNodeRegistry to the TimelockController so all sensitive operations go through governance:
  ```javascript
  tx = await rewards.transferOwnership(timelockAddress);
  await tx.wait();
  tx = await registry.transferOwnership(timelockAddress);
  await tx.wait();
  ```

---

## High Priority Issues (Priority 2)

### HIGH-1: Backend Signer Key Exposed in Website .env

- **File**: `/Volumes/AI-Models/poh-coin/website/.env:18`
- **Category**: Secret Exposure
- **Description**: `BACKEND_SIGNER_KEY` is a private key used for on-chain node registration (pays gas). It is the same as the testnet deployer key. While it is server-side only (not NEXT_PUBLIC), it is stored in plaintext alongside the Supabase service role key. The website .env also contains `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and `STRAVA_CLIENT_SECRET`.
- **Impact**: Compromise of the Vercel deployment or the local machine exposes all backend secrets simultaneously.
- **Fix**:
  1. Use Vercel's encrypted environment variables (not a local .env file for production)
  2. Rotate the BACKEND_SIGNER_KEY to a dedicated low-balance wallet (not the deployer key)
  3. Implement key rotation procedures
  4. Use a dedicated secrets manager (Vault, AWS Secrets Manager)

### HIGH-2: Mining Submit Endpoint Lacks Authentication

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/mine/submit/route.ts`
- **Category**: Authentication Bypass
- **Description**: The `/api/mine/submit` POST endpoint accepts `deviceId`, `taskId`, and `result` without any authentication. Any attacker who knows a valid `deviceId` and `taskId` can submit results. The only protection is:
  - The assignment must exist and be unsubmitted (line 105-118)
  - Rate limiting (60/hour per device)
  - Server-side spot checks (10% of tasks)
  - 2-of-3 consensus verification
- **Impact**: An attacker could:
  1. Register a device via `/api/mine/register` (no wallet signature required)
  2. Request tasks via `/api/mine/task`
  3. Submit precomputed or garbage results at 60/hour
  4. If they control 2 of 3 assigned devices, they win consensus every time
- **Fix**:
  1. Require the EIP-191 wallet signature (already implemented in registration but not enforced)
  2. Add HMAC-signed session tokens after registration
  3. Require the `computation_proof` field with verifiable intermediate hashes
  4. Increase spot-check rate from 10% to 25% for new miners (trust_week < 4)

### HIGH-3: Task Assignment Endpoint Lacks Authentication

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/mine/task/route.ts`
- **Category**: Authentication Bypass
- **Description**: `/api/mine/task?deviceId=X` returns compute tasks to any caller who provides a valid device ID. There is no signature, session token, or proof of device ownership.
- **Impact**: Attackers can harvest task IDs and payloads, then submit precomputed results from sybil devices.
- **Fix**: Require a signed request or session token tied to the registered wallet address.

### HIGH-4: Wallet Signature Verification is Optional at Registration

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/mine/register/route.ts:64`
- **Category**: Authentication Weakness
- **Description**: The registration endpoint checks wallet signatures only if provided (`if (signature && signedMessage && timestamp)`). A device can register with any `walletAddress` without proving ownership.
- **Impact**: An attacker can register devices under any wallet address, potentially claiming rewards that should go to legitimate miners or creating sybil nodes.
- **Evidence**:
  ```typescript
  // Line 66 -- signature verification is conditional
  if (signature && signedMessage && timestamp) {
    // ... verification logic
  }
  // Registration proceeds even without signature
  ```
- **Fix**: Make wallet signature verification mandatory. Reject registrations without a valid EIP-191 signature.

### HIGH-5: Quality-Scores Cron Has Weak Auth Check

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/cron/quality-scores/route.ts:16`
- **Category**: Authentication Bypass
- **Description**: The quality-scores cron endpoint skips authentication if `CRON_SECRET` is not set: `if (cronSecret && ...)`. The other cron endpoints (epoch-close, epoch-activate, heartbeat-check) properly require the secret unconditionally.
- **Impact**: If CRON_SECRET is accidentally unset in production, anyone can trigger quality score recalculation and potentially deactivate miners.
- **Evidence**:
  ```typescript
  // quality-scores/route.ts:16 -- bypasses auth if no secret
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {

  // vs epoch-close/route.ts:56 -- always requires auth
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  ```
- **Fix**: Make the check unconditional like the other cron endpoints:
  ```typescript
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  ```

### HIGH-6: Strava/Fitbit OAuth Tokens Stored in Supabase Without Encryption

- **File**: `/Volumes/AI-Models/poh-coin/website/supabase/schema.sql:199-200`
- **Category**: Sensitive Data Storage
- **Description**: The `fitness_connections` table stores `access_token` and `refresh_token` in plaintext columns. These are OAuth tokens that grant access to users' fitness data on Strava/Fitbit.
- **Impact**: A Supabase breach or admin access leak exposes all users' fitness OAuth tokens, allowing unauthorized access to their Strava/Fitbit accounts.
- **Fix**: Encrypt OAuth tokens at rest using `pgcrypto` with a server-side encryption key, or store them in a dedicated secrets vault.

---

## Medium Priority Issues (Priority 3)

### MEDIUM-1: Benchmark Endpoint Allows Self-Reported Capability Tier

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/mine/benchmark/route.ts`
- **Category**: Input Validation / Gaming
- **Description**: The benchmark endpoint accepts `capabilityTier` directly from the client with only basic bounds checking (`Math.min(3, Math.max(1, ...))`). A user could report tier 3 (desktop) from a phone to receive harder tasks that may earn more points.
- **Impact**: Gaming of the difficulty scaling system. Higher-tier tasks may have higher weight in reward calculations.
- **Fix**: Validate benchmark results server-side. Cross-reference `cpuScoreMs` against expected ranges for each tier.

### MEDIUM-2: Referral Code Redeem Endpoint Lacks Rate Limiting

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/referral/redeem/route.ts`
- **Category**: Missing Rate Limiting
- **Description**: The referral redeem endpoint has no rate limiting. An attacker could brute-force referral codes (format: `POH-XXXXXXXX`, 8 hex characters = ~4.3 billion possibilities, but reduced entropy from SHA256 truncation).
- **Fix**: Add rate limiting per wallet and per IP, similar to the referral create endpoint.

### MEDIUM-3: Heartbeat Challenge-Response Uses Weak HMAC

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/mine/heartbeat/route.ts:63`
- **Category**: Cryptographic Weakness
- **Description**: The heartbeat verification computes `SHA256(challenge + deviceId)`. Since `deviceId` is known to the device, an attacker who intercepts the challenge can compute the response without actually running the mining software. This is not a proper HMAC -- it is a simple hash concatenation.
- **Impact**: Heartbeat spoofing allows inactive devices to appear active and maintain their streak/reputation.
- **Fix**: Use HMAC-SHA256 with a per-device secret established during registration, or require a server-issued nonce that must be included in the response.

### MEDIUM-4: Validate Task Endpoint Allows Validator Self-Voting

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/validate/task/route.ts`
- **Category**: Logic Flaw
- **Description**: The validate endpoint does not check whether the validator is also a submitter of the same task. A user with a tier-2 device could submit a task result AND validate it, earning double points.
- **Fix**: Check that `validatorDeviceId` is not in the existing `task_assignments` for this `taskId`.

### MEDIUM-5: Epoch Close Cron Has No Idempotency Guard

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/cron/epoch-close/route.ts`
- **Category**: Logic Flaw
- **Description**: If the epoch-close cron is triggered twice (e.g., Vercel retry, manual trigger), it could double-distribute rewards. While the epoch status check (line 67) prevents full re-execution, there is a race condition window between reading the epoch status and updating it.
- **Impact**: Potential double reward distribution if concurrent requests hit the endpoint.
- **Fix**: Use a Supabase advisory lock or an `UPDATE ... WHERE status = 'active' RETURNING *` pattern to atomically claim the epoch for closing.

### MEDIUM-6: Newsletter Endpoint Lacks Rate Limiting

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/api/newsletter/route.ts`
- **Category**: Missing Rate Limiting
- **Description**: No rate limiting on the newsletter subscription endpoint. An attacker could flood the database with fake email subscriptions.
- **Fix**: Add IP-based rate limiting (e.g., 5 subscriptions per IP per hour).

### MEDIUM-7: Supabase Service Role Key Used for All API Operations

- **File**: `/Volumes/AI-Models/poh-coin/website/src/lib/supabase.ts`
- **Category**: Principle of Least Privilege
- **Description**: The server-side Supabase client uses the `service_role` key which bypasses ALL Row Level Security. Every API route has unrestricted access to every table. If any API route has a vulnerability, the blast radius is the entire database.
- **Fix**: For read-only endpoints (stats, leaderboard, rewards), use the anon key with RLS. Reserve service_role for write operations that need elevated access.

---

## Low Priority Issues (Priority 4)

### LOW-1: Console Statements in API Routes

- **Category**: Information Leakage
- **Description**: Multiple API routes contain `console.error` and `console.warn` statements that may expose internal state in server logs.
- **Files affected**: `points/route.ts`, `stats/route.ts`, `epoch-close/route.ts`, `epoch-activate/route.ts`, `submit/route.ts`
- **Fix**: Use a structured logger with configurable log levels. Avoid logging wallet addresses or device IDs in production.

### LOW-2: Testnet Private Key Commented but Visible in Root .env

- **File**: `/Volumes/AI-Models/poh-coin/.env:3`
- **Category**: Secret Hygiene
- **Description**: The testnet deployer private key is "commented out" with `#` but still visible in the file. This key is also used as `BACKEND_SIGNER_KEY` in the website .env.
- **Fix**: Remove commented-out secrets entirely. Use `.env.example` for documentation.

### LOW-3: dangerouslySetInnerHTML Usage (Safe)

- **File**: `/Volumes/AI-Models/poh-coin/website/src/app/layout.tsx:87`
- **Category**: XSS Surface (False Positive)
- **Description**: `dangerouslySetInnerHTML` is used to inject a static JSON-LD structured data block for SEO. The content is hardcoded (not user-supplied), so this is not exploitable.
- **Status**: No action needed -- verified safe.

---

## Smart Contract Analysis

### Solidity Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Reentrancy protection | PASS | Using SafeERC20, no external calls before state changes |
| Integer overflow/underflow | PASS | Solidity 0.8.24 has built-in overflow protection |
| Access control | PASS | Ownable from OpenZeppelin on all admin functions |
| Front-running protection | PASS | Merkle proofs with double-hash (OpenZeppelin StandardMerkleTree) |
| Timelock on sensitive ops | PASS | 24hr timelock on merkle root changes, 48hr on governance |
| Token approval issues | PASS | Using SafeERC20.safeTransferFrom |
| Denial of service vectors | PASS | No unbounded loops in user-callable functions |
| Selfdestruct/delegatecall | PASS | Not used |
| ERC20 compliance | PASS | Inherits OpenZeppelin ERC20 |
| Gas optimization | PASS | Optimizer enabled at 200 runs |
| Compiler version | PASS | Pinned to 0.8.24, not floating |

### Contract-Specific Findings

**POHToken.sol**: Well-structured. Fee logic is correct with proper FEE_DENOMINATOR math. Anti-whale limits cannot be set below 0.5% (prevents griefing). Owner can pause but not mint new tokens. No backdoor functions.

**POHRewards.sol**: Merkle proof verification uses double-hash pattern correctly. Timelock prevents instant root changes. VestingInfo properly tracks released state. The `claimBatch` function consolidates transfers for gas efficiency. No reentrancy risk because `hasClaimed` is set before transfer.

**POHNodeRegistry.sol**: Clean access control. The `ownerDevices` array grows unboundedly but is only used in view functions. Slashing correctly reduces both `validatorStake` and `totalStaked`.

**POHCharity.sol**: Low-level `.call` for ETH transfers (line 102) is correct pattern but the return value is checked. Timelock minimum of 24hrs cannot be bypassed.

**POHVesting.sol**: Immutable schedule -- no owner functions. Linear vesting math is correct. All state variables that define the schedule are `immutable`.

**POHGovernor.sol**: Standard OpenZeppelin Governor setup. 4% quorum is reasonable. 0.1% proposal threshold prevents spam while allowing community participation.

---

## Supabase RLS Analysis

| Table | RLS Enabled | Policies | Risk |
|-------|------------|----------|------|
| nodes | Yes | service_role full access | OK |
| compute_tasks | Yes | service_role full access | OK |
| task_assignments | Yes | service_role full access | OK |
| heartbeats | Yes | service_role full access | OK |
| proofs | Yes | service_role full access | OK |
| epochs | Yes | Public read + service_role full | OK |
| rewards | Yes | anon read + service_role full | OK -- merkle proofs are public |
| referrals | Yes | service_role full access | OK |
| achievements | Yes | Public read + service_role full | OK |
| streaks | Yes | service_role full access | OK |
| fitness_connections | Yes | service_role full access | Note: contains OAuth tokens |
| fitness_activities | Yes | service_role full access | OK |
| device_fingerprints | Yes | service_role full access | OK |
| rate_limits | Yes | service_role full access | OK |
| verification_failures | Yes | service_role full access | OK |
| fah_links | Yes | Public read + service_role full | OK |
| newsletter_subscribers | Yes | Insert with check + service_role | Fixed in migration-v10 |
| boinc_links | Yes | Authenticated insert + service_role | Fixed in migration-v10 |

**Overall RLS Assessment**: Good. All tables have RLS enabled. The v10 migration addressed previously overly-permissive INSERT policies. Public read access is limited to non-sensitive tables.

---

## Hardhat Config Analysis

- **File**: `/Volumes/AI-Models/poh-coin/hardhat.config.js`
- **Status**: PASS
- Keys are loaded from environment variables via dotenv
- Fallback key is all-zeros (safe for local testing)
- No hardcoded private keys in config
- Basescan API key loaded from env

---

## Deploy Script Analysis

All deploy scripts (`deploy.js`, `deploy-mainnet.js`, `deploy-all.js`, `deploy-rewards.js`) follow good practices:
- Load keys from environment variables
- Include mainnet confirmation check (`CONFIRM_MAINNET=true`)
- Check deployer balance before proceeding
- Verify contracts on Basescan after deployment
- Save deployment addresses to JSON file

**One concern**: `transfer-to-ledger.js` hardcodes the token address and Ledger address. This is acceptable for a one-time script but should be documented.

---

## Client-Side ABI Analysis

The client-side contract ABIs in `src/lib/contracts.ts` expose only view functions and the `claim`/`claimBatch`/`registerNode` write functions. No admin functions are exposed client-side. This is correct -- admin operations should only be performed via Hardhat scripts or the governance contract.

---

## Task List

### Critical Tasks (Fix Immediately)
- [ ] **[CRITICAL-1]** Rotate deployer private key; transfer ownership to hardware wallet or governance
- [ ] **[CRITICAL-2]** Remove mnemonic from localStorage; use encrypted storage or external wallet
- [ ] **[CRITICAL-3]** Transfer POHRewards and POHNodeRegistry ownership to TimelockController

### High Priority Tasks (Fix Before Mainnet Launch)
- [ ] **[HIGH-1]** Move all secrets to Vercel encrypted env vars; rotate BACKEND_SIGNER_KEY
- [ ] **[HIGH-2]** Add authentication to mine/submit endpoint (signed requests or session tokens)
- [ ] **[HIGH-3]** Add authentication to mine/task endpoint
- [ ] **[HIGH-4]** Make wallet signature verification mandatory at registration
- [ ] **[HIGH-5]** Fix quality-scores cron auth check to be unconditional
- [ ] **[HIGH-6]** Encrypt OAuth tokens in fitness_connections table

### Medium Priority Tasks (Schedule for Sprint)
- [ ] **[MEDIUM-1]** Validate benchmark capability tier server-side
- [ ] **[MEDIUM-2]** Add rate limiting to referral/redeem endpoint
- [ ] **[MEDIUM-3]** Replace SHA256(challenge+deviceId) with HMAC-SHA256 using per-device secret
- [ ] **[MEDIUM-4]** Add self-voting check to validate/task endpoint
- [ ] **[MEDIUM-5]** Add idempotency guard to epoch-close cron
- [ ] **[MEDIUM-6]** Add rate limiting to newsletter endpoint
- [ ] **[MEDIUM-7]** Use anon key for read-only API routes

### Low Priority Tasks (Backlog)
- [ ] **[LOW-1]** Replace console statements with structured logger
- [ ] **[LOW-2]** Remove commented-out testnet private key from root .env

---

## Recommendations

1. **Immediate Actions** (today):
   - Rotate the mainnet deployer private key -- this is the most urgent item
   - Transfer contract ownership to a multisig or the TimelockController
   - Remove the mnemonic from localStorage in the next website deploy

2. **Short-term Improvements** (1-2 weeks):
   - Implement authenticated mining sessions (signed device registration -> session token -> use for all subsequent API calls)
   - Add request signing to all mine/* endpoints
   - Encrypt fitness OAuth tokens at rest
   - Fix the quality-scores cron auth bypass

3. **Long-term Refactoring**:
   - Move to a proper session/authentication system (e.g., SIWE -- Sign In With Ethereum)
   - Implement a dedicated key management service
   - Add monitoring/alerting for unusual mining patterns (sybil detection)
   - Consider formal smart contract audit by a third party (Trail of Bits, OpenZeppelin, etc.)

4. **Testing Gaps**:
   - No integration tests for the full mining flow (register -> task -> submit -> verify -> reward)
   - No fuzz testing on smart contract inputs
   - No load testing on API endpoints
   - Need adversarial testing of consensus mechanism (what if 2 of 3 miners collude?)

---

## Metrics Summary

- **Security Vulnerabilities**: 9 (3 critical, 6 high)
- **Logic Flaws**: 4 (medium)
- **Missing Controls**: 3 (medium)
- **Low Priority**: 3
- **Smart Contract Issues**: 1 (ownership not transferred -- counted in critical)
- **Technical Debt Score**: Medium-High (primarily around authentication)

---

## File-by-File Summary

<details>
<summary>Click to expand detailed file analysis</summary>

### High-Risk Files
1. `/Volumes/AI-Models/poh-coin/.env` -- 1 critical (exposed private key)
2. `/Volumes/AI-Models/poh-coin/website/.env` -- 1 high (exposed backend signer key + secrets)
3. `/Volumes/AI-Models/poh-coin/website/src/app/mine/setup/page.tsx` -- 1 critical (mnemonic in localStorage)
4. `/Volumes/AI-Models/poh-coin/website/src/app/mine/components/WalletManager.tsx` -- 1 critical (mnemonic in localStorage)
5. `/Volumes/AI-Models/poh-coin/website/src/app/api/mine/submit/route.ts` -- 1 high (no auth)
6. `/Volumes/AI-Models/poh-coin/website/src/app/api/mine/task/route.ts` -- 1 high (no auth)
7. `/Volumes/AI-Models/poh-coin/website/src/app/api/mine/register/route.ts` -- 1 high (optional signature)
8. `/Volumes/AI-Models/poh-coin/scripts/deploy-mainnet.js` -- 1 critical (missing ownership transfer)

### Clean Files
- All 6 smart contracts (POHToken, POHRewards, POHNodeRegistry, POHGovernor, POHCharity, POHVesting) -- no vulnerabilities found
- `hardhat.config.js` -- clean
- `src/lib/rate-limiter.ts` -- well-implemented with fail-closed design
- `src/lib/reference-compute.ts` -- clean
- `src/lib/merkle.ts` -- clean
- `src/lib/contracts.ts` -- clean (no admin ABIs exposed)
- `supabase/schema.sql` -- RLS properly configured
- `supabase/migration-v10-security-fixes.sql` -- good security hardening

</details>

---

*Report generated by security-scanner agent*
*No modifications were made to the codebase*
