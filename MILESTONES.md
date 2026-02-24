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
- [ ] Deploy all 7 contracts to Base mainnet (Token, Vesting, Charity, Rewards, Registry, Timelock, Governor)
- [ ] Verify on Basescan
- [ ] Create Uniswap V3 liquidity pool (POH/ETH)
- [ ] Burn LP tokens (permanent liquidity lock)
- [ ] Update website env var: NEXT_PUBLIC_CHAIN_ID=8453
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

## Phase E: Mainnet Launch Preparation
- [x] Add ERC20Votes + ERC20Permit to POHToken for governance support
- [x] All 140 existing tests still pass with ERC20Votes changes
- [x] Create `scripts/deploy-mainnet.js` — deploys all 7 contracts (5 original + TimelockController + POHGovernor)
- [x] Create `scripts/create-lp.js` — Uniswap V3 POH/ETH LP creation with configurable fee tier
- [x] Create `DEPLOYMENT_CHECKLIST.md` — 16-step deployment guide with emergency procedures
- [x] Add mainnet/testnet toggle to `website/src/lib/contracts.ts` — NEXT_PUBLIC_CHAIN_ID env var

## Phase F: DAO Governance — Token-Weighted Voting
- [x] Write `contracts/POHGovernor.sol` — OpenZeppelin Governor v5 with all extensions
- [x] Governor config: 7200 block voting delay (~1 day), 50400 block voting period (~7 days), 0.1% proposal threshold, 4% quorum
- [x] TimelockController: 48hr execution delay, Governor as proposer + executor
- [x] Write `test/POHGovernor.test.js` — 26 tests covering full governance lifecycle
- [x] All 166 tests passing (140 original + 26 governance)
- [x] Governance page (`/governance`) — voting parameters, progressive decentralization roadmap
- [x] Added `evmVersion: "cancun"` to hardhat.config.js for OZ v5.4.0 compatibility

## Phase G: Proof of Impact v1 — Real Research Integration
- [x] Add `drugscreen` compute task type — molecular docking scoring (van der Waals + electrostatic + desolvation)
- [x] Add DRUG_COMPOUNDS dataset — 3 real drug candidates (Erlotinib/EGFR, Vemurafenib/BRAF, HER2 inhibitor)
- [x] Create research partner API — `/api/research/submit` (task submission) + `/api/research/results` (results retrieval)
- [x] API key authentication with SHA-256 hashing against research_partners table
- [x] Research impact page (`/research`) — 4 research areas, partner CTA, network stats
- [x] Added Governance + Research links to Navbar + Footer

## Phase H: Proof of Impact v2 — AI-Verified Results
- [x] Create `ai-verifier/` Python microservice (FastAPI + scikit-learn)
- [x] Three-layer verification: statistical bounds (3σ), Isolation Forest ML, cross-device consistency
- [x] Per-task-type structural validation (protein, climate, signal, drugscreen)
- [x] Training pipeline: fetch from Supabase or generate synthetic data, train Isolation Forest (200 estimators, 5% contamination)
- [x] Dockerfile for containerized deployment on Mac Mini
- [x] Integrated AI verification into mining submit route with graceful fallback
- [x] AI confidence + flags stored on task_assignments, rejected tasks marked as `ai_rejected`

## Phase I: Direct Fitness Integration (Terra → Strava + Fitbit)
- [x] Replace Terra API with direct Strava + Fitbit OAuth 2.0 integration
- [x] FitnessProvider interface with stravaProvider + fitbitProvider implementations
- [x] HMAC-signed OAuth state with 10-minute expiry
- [x] Token refresh — ensureValidToken() auto-refreshes expiring tokens
- [x] OAuth callback route — exchanges code for tokens, stores connection, redirects
- [x] Setup page — Strava/Fitbit provider selection buttons, OAuth redirect-back handling
- [x] DB migration — terra_user_id → provider_user_id, add token columns
- [x] schema.sql updated as source of truth
- [x] npm run build — clean, 166/166 tests passing
- [x] New env vars: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, OAUTH_STATE_SECRET

## Phase J: Mainnet Launch
- [x] **Part 1: Code changes (hardcoded testnet → dynamic)**
  - [x] `website/src/app/security/page.tsx` — replaced hardcoded `BASESCAN` URL + contract addresses with `BLOCK_EXPLORER`, `CONTRACTS`, `IS_MAINNET` imports from `@/lib/contracts`; conditional "Basescan" vs "Base Sepolia Basescan" text
  - [x] `website/src/app/page.tsx` — replaced hardcoded Sepolia Basescan URLs in `trustSignals` (vesting + charity links) with `${BLOCK_EXPLORER}/address/${CONTRACTS.vesting}` etc.
  - [x] `website/src/app/impact/page.tsx` — added `BLOCK_EXPLORER` + `IS_MAINNET` imports; conditional "Base Mainnet" vs "Base Sepolia Testnet" badge; dynamic Basescan link for charity treasury
  - [x] `DEPLOYMENT_CHECKLIST.md` — updated expected test count from 140 → 166
  - [x] `npm run build` — clean compilation, zero errors (39 routes)
  - [x] Grep confirmed zero remaining hardcoded `sepolia.basescan.org` references in website src (only the proper conditional fallback in `contracts.ts`)
- [x] **Part 2: Wallet & funding**
  - [x] Deployer wallet: `0x2D0BbA61E34015F2e511d96A40980e90882ba768`
  - [x] Funded with ETH on Base (~$15) and Ethereum mainnet (~$150)
  - [x] Set `DEPLOYER_PRIVATE_KEY`, `BASESCAN_API_KEY` in `.env`
  - [x] Registered `projectpoh.eth` ENS domain (1 year)
- [x] **Part 3: Deployment (2026-02-23)**
  - [x] Dry run: all 7 contracts deploy + configure on local Hardhat
  - [x] Real deploy: `CONFIRM_MAINNET=true npx hardhat run scripts/deploy-mainnet.js --network base`
  - [x] Configuration completed via `scripts/finish-config.js` (exemptions, token distribution, governance roles)
  - [x] Create Uniswap V3 LP: pool + AMM pair + liquidity added
  - [x] Pool: `0x29A160A9C535F1460146d7DF19d49f9ae1eb2FbD` (LP NFT #4689781)
- [x] **Part 4: Website go-live**
  - [x] Filled `MAINNET_CONTRACTS` in `website/src/lib/contracts.ts`
  - [x] Update Vercel env vars: `NEXT_PUBLIC_CHAIN_ID=8453`
  - [x] Trigger Vercel redeploy — projectpoh.com now reads from Base mainnet
- [x] **Part 5: Post-launch**
  - [ ] Test swap fees on Uniswap (1% buy, 3% sell)
  - [x] Verify all 7 contracts on Basescan — source code verified
  - [x] Update whitepaper, governance, security, research pages for mainnet
  - [x] Update README with mainnet addresses + governance info
  - [ ] Git commit + push

## Phase 6: Proof of Impact — Ongoing
- [ ] Partner with verified charities
- [ ] Deploy AI verifier to Mac Mini
- [ ] Run training pipeline on real mining data
- [ ] Supabase migrations: add `source`/`partner_id` to compute_tasks, create research_partners table, add `ai_confidence`/`ai_flags` to task_assignments

## Phase 7: Legal & Compliance
- [x] Add disclaimers to website — /disclaimers page with 10 legal sections
- [ ] Research California LLC vs. DAO LLC
- [ ] Consult crypto attorney (when budget allows)

---

## Key Technical Decisions
- **Network**: Base (Coinbase L2) — cheapest deployment, best on-ramp
- **Solidity**: 0.8.24, OpenZeppelin v5.4.0, EVM version Cancun
- **Token**: "Pursuit of Happiness" / POH — ERC20 + ERC20Votes + ERC20Permit
- **Supply**: 24,526,000,000 (Voyager 1 distance model)
- **Fees**: 1% buy / 3% sell / 0.5% transfer
- **Anti-whale**: 2% max wallet, 1% max tx
- **Vesting**: 10% founder, 4yr linear, 6mo cliff
- **Founder must be max-wallet exempt** to receive vested tokens
- **Governance**: OpenZeppelin Governor — 4% quorum, 7-day voting, 48hr timelock
- **AI Verification**: Isolation Forest + statistical bounds + cross-device consistency
- **Fitness**: Direct Strava + Fitbit OAuth 2.0 (replaced Terra API)
- **Tests**: 166 passing (30 POHToken + 61 POHRewards + 48 POHNodeRegistry + 1 POHVesting + 26 POHGovernor)
- **Compute tasks**: 4 types (protein folding, climate modeling, seismic analysis, drug screening)
- **Website**: 14 static pages + 18 API routes, builds clean

## Contract Addresses — Base Sepolia Testnet
- POHToken: `0xe75DC31C1D4F1f8b1160e84a6B3228115d1135a2`
- POHCharity: `0x31a3D6d28fEFfc177F9d099a4491A4E3cE8fA7E6`
- POHVesting: `0x5112A61F036fE79C0D15a779269B6558dC70C1a7`
- POHRewards: `0x136EB82Ce350a7f391DC02223a878A8FcA4028Fe`
- POHNodeRegistry: `0x6413393Ec4c594F0a9ce9c1B5d2056B4B309E0e6`
- Deployer: `0x4F5F81bb6B9BadADFb9ab8303530DF5BCdd5368a`

## Contract Addresses — Base Mainnet (deployed 2026-02-23)
- POHToken: `0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07`
- POHVesting: `0xFfce548EbF097F630A272aA577E750A0Bc1308dd`
- POHCharity: `0xf9eDc5CF986ea637E724E078DA01AbD7c4957D49`
- POHRewards: `0xa7904Cb5f3D6a937Db06453e3d95db4f0C3236dF`
- POHNodeRegistry: `0x8137a04a50C058b00d9ee44D25b9Ef1ba900D15F`
- TimelockController: `0x64981B544a20d6933466c363dD175cA1FaD96Bb6`
- POHGovernor: `0x7C96Ed675033F15a53557f1d0190e00B19522e6e`
- Uniswap V3 Pool: `0x29A160A9C535F1460146d7DF19d49f9ae1eb2FbD`
- LP NFT Token ID: `4689781`
- Deployer: `0x2D0BbA61E34015F2e511d96A40980e90882ba768`
- ENS: `projectpoh.eth`
