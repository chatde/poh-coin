# Project POH — Milestones

> Cross-session tracker. Any Claude window can read this to pick up where we left off.

## Phase 0: Project Setup
- [x] Create project directory `/Volumes/AI-Models/poh-coin/`
- [x] Initialize git repo
- [x] Install Hardhat + OpenZeppelin v5
- [x] Create MILESTONES.md, BUDGET.md, README.md
- [x] Update Claude memory

## Phase 1: Foundation (Smart Contracts)
- [x] Write `contracts/POHToken.sol` — ERC20 with fees, anti-whale, Pausable
- [x] Write `contracts/POHVesting.sol` — 4-year vest, 6-month cliff
- [x] Write `contracts/POHCharity.sol` — Timelocked charity treasury
- [x] Write `hardhat.config.js` — Base Sepolia + Base mainnet
- [x] Write `scripts/deploy.js` — Deploy + configure + distribute
- [x] Write `test/POHToken.test.js` — 30 tests, all passing
- [x] Deploy to Base Sepolia testnet
- [x] Verify contracts on Basescan (Sepolia)
- [x] Run Slither static analysis — no critical findings, fee vars made constant
- [x] Run Mythril formal verification — no critical/medium findings, only expected timestamp usage (Low)

## Phase 2: Website MVP
- [x] Initialize Next.js 15 app in `website/`
- [x] Homepage with Voyager tracker + mission
- [x] Whitepaper page
- [x] Impact dashboard (on-chain treasury reads)
- [x] How to Buy page
- [x] Deploy to Vercel — https://website-theta-five-72.vercel.app
- [x] Point projectpoh.com DNS to Vercel — A record + CNAME configured, SSL provisioning

## Phase 3: Testnet Integration
- [x] Connect website to testnet contracts — ethers.js v6, contract ABIs, on-chain reads
- [x] Impact Dashboard reads live data: charity balance, rewards pool, vesting %, on-chain nodes
- [ ] Test wallet connection (MetaMask)
- [ ] End-to-end: buy/sell/transfer fee simulation
- [ ] Verify charity treasury accumulates fees

## Phase 4: Community & Socials
- [ ] Set up Twitter/X
- [ ] Set up Discord server
- [ ] Set up Telegram
- [x] Public GitHub repo — https://github.com/chatde/poh-coin
- [ ] Pre-launch content + announcement thread

## Phase 5: Mainnet Launch
- [ ] Buy ETH on Coinbase (~$100)
- [ ] Deploy all 3 contracts to Base mainnet
- [ ] Verify on Basescan
- [ ] Create Uniswap V3 liquidity pool (POH/ETH)
- [ ] Burn LP tokens (permanent liquidity lock)
- [ ] Update website to mainnet
- [ ] Announce launch

## Phase A: Proof of Planet — Smart Contracts
- [x] Write `contracts/POHRewards.sol` — Merkle-based token distribution + savings wallet auto-send
- [x] Write `contracts/POHNodeRegistry.sol` — Device registration, reputation, validator staking/slashing
- [x] Write `test/POHRewards.test.js` — 30 tests, all passing
- [x] Write `test/POHNodeRegistry.test.js` — 48 tests, all passing
- [x] Write `scripts/deploy-rewards.js` — Deploy + configure + fund rewards
- [x] Install `@openzeppelin/merkle-tree` for merkle proof generation
- [x] All 108 tests passing (30 original + 30 POHRewards + 48 POHNodeRegistry)
- [x] **Add 24hr timelock to POHRewards.sol** — pendingRoot, activateMerkleRoot, cancelPendingRoot
- [x] **Add reward vesting to POHRewards.sol** — claimableNow + vestingAmount per epoch, releaseVested/Batch
- [x] **Updated tests: 140/140 passing** (30 POHToken + 61 POHRewards + 48 POHNodeRegistry + 1 POHVesting)
- [x] **Deployed all 5 contracts to Base Sepolia** — token distribution verified (50/20/10/20 split)
- [x] Run Slither on all contracts — no critical findings (naming convention, timestamp usage only)
- [x] Run Mythril on POHRewards + POHNodeRegistry — no issues detected
- [x] **Verify all 5 contracts on Basescan (Sepolia)** — source code verified

## Phase B: Proof of Planet — Backend API + Backend
- [x] Supabase schema — 10 tables (nodes, compute_tasks, task_assignments, heartbeats, proofs, epochs, rewards, referrals, achievements, streaks)
- [x] 16 Vercel serverless API routes (register, heartbeat, task, submit, points, rewards, leaderboard, stats, nodes, validate, referral create/redeem, cron epoch-close/heartbeat-check)
- [x] Reward calculation engine with all 10 bonus modifiers (quality, streak, trust, geo, quadratic, daily cap, referral, staked multiplier, pool split, vesting)
- [x] Merkle tree generation for weekly epoch close
- [x] Token logo — 32/64/128/256px PNGs generated from source
- [x] `.env.example` for Supabase + cron secret config
- [x] **Supabase project live** — 10 tables + RLS policies deployed to `dvllflvnhsaxwelmntqi`
- [x] **E2E mining flow tested** — register → heartbeat → task → submit → 2-of-3 verify → points awarded
- [x] **Outlier detection verified** — mismatched results correctly penalize reputation

## Phase C: Proof of Planet — PWA Mining App
- [x] PWA manifest.json + service worker (offline + caching)
- [x] Terminal/retro "mission control" UI — green-on-black CRT aesthetic
- [x] Mining dashboard (`/mine`) with live stats, task display, activity log
- [x] 3-step onboarding (`/mine/setup`) — wallet, permissions, savings wallet
- [x] Built-in wallet creation for beginners + MetaMask connect for existing users
- [x] WASM compute worker — 3 task types (protein, climate, signal) running in Web Worker
- [x] useCompute, useHeartbeat, useBattery hooks
- [x] Battery safety — throttle at 40C, stop at 45C
- [x] Node map component with H3 cell aggregation

## Phase D: Proof of Planet — Website Updates
- [x] Updated Impact Dashboard with live network stats from API
- [x] Schools program page (`/schools`) — registration, benefits, requirements
- [x] Security guide page (`/security`) — savings wallet setup, vesting explanation
- [x] Leaderboard page (`/leaderboard`) — miners, validators, regions tabs
- [x] Updated navbar with Mine + Leaderboard links + logo image
- [x] Favicon + Apple touch icon added to metadata
- [x] Golden Record achievements system (10 achievements named after Golden Record contents)
- [x] Distance milestones (Moon, Mars, Jupiter, Saturn, Heliosphere, Interstellar)
- [x] Mission date bonuses (Sept 5, Aug 20, Aug 25, Feb 14)
- [x] Streak achievements (7d, 30d, 100d, 365d)
- [x] Website builds clean: `next build` — 12 static pages + 16 API routes

## Phase 6: Proof of Impact v1
- [ ] Partner with verified charities
- [ ] Implement partner-verified donation rewards
- [ ] On-chain charity transaction tracking

## Phase 7: Legal & Compliance
- [x] Add disclaimers to website — /disclaimers page with 10 legal sections
- [ ] Research California LLC vs. DAO LLC
- [ ] Consult crypto attorney (when budget allows)

---

## Key Technical Decisions
- **Network**: Base (Coinbase L2) — cheapest deployment, best on-ramp
- **Solidity**: 0.8.24, OpenZeppelin v5
- **Token**: "Pursuit of Happiness" / POH
- **Supply**: 24,526,000,000 (Voyager 1 distance model)
- **Fees**: 1% buy / 3% sell / 0.5% transfer
- **Anti-whale**: 2% max wallet, 1% max tx
- **Vesting**: 10% founder, 4yr linear, 6mo cliff
- **Founder must be max-wallet exempt** to receive vested tokens

## Contract Addresses — Base Sepolia Testnet
- POHToken: `0xe75DC31C1D4F1f8b1160e84a6B3228115d1135a2`
- POHCharity: `0x31a3D6d28fEFfc177F9d099a4491A4E3cE8fA7E6`
- POHVesting: `0x5112A61F036fE79C0D15a779269B6558dC70C1a7`
- POHRewards: `0x136EB82Ce350a7f391DC02223a878A8FcA4028Fe`
- POHNodeRegistry: `0x6413393Ec4c594F0a9ce9c1B5d2056B4B309E0e6`
- Deployer: `0x4F5F81bb6B9BadADFb9ab8303530DF5BCdd5368a`

## Contract Addresses — Base Mainnet (fill after mainnet deploy)
- POHToken: `TBD`
- POHVesting: `TBD`
- POHCharity: `TBD`
