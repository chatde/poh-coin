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
- [ ] Deploy to Base Sepolia testnet
- [ ] Verify contracts on Basescan (Sepolia)
- [x] Run Slither static analysis — no critical findings, fee vars made constant
- [ ] Run Mythril formal verification

## Phase 2: Website MVP
- [x] Initialize Next.js 15 app in `website/`
- [x] Homepage with Voyager tracker + mission
- [x] Whitepaper page
- [x] Impact dashboard (on-chain treasury reads)
- [x] How to Buy page
- [ ] Deploy to Vercel
- [ ] Point projectpoh.com DNS to Vercel

## Phase 3: Testnet Integration
- [ ] Connect website to testnet contracts
- [ ] Test wallet connection (MetaMask)
- [ ] End-to-end: buy/sell/transfer fee simulation
- [ ] Verify charity treasury accumulates fees

## Phase 4: Community & Socials
- [ ] Set up Twitter/X
- [ ] Set up Discord server
- [ ] Set up Telegram
- [ ] Public GitHub repo
- [ ] Pre-launch content + announcement thread

## Phase 5: Mainnet Launch
- [ ] Buy ETH on Coinbase (~$100)
- [ ] Deploy all 3 contracts to Base mainnet
- [ ] Verify on Basescan
- [ ] Create Uniswap V3 liquidity pool (POH/ETH)
- [ ] Burn LP tokens (permanent liquidity lock)
- [ ] Update website to mainnet
- [ ] Announce launch

## Phase 6: Proof of Impact v1
- [ ] Partner with verified charities
- [ ] Implement partner-verified donation rewards
- [ ] On-chain charity transaction tracking

## Phase 7: Legal & Compliance
- [ ] Add disclaimers to website
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

## Contract Addresses (fill after deployment)
- POHToken: `TBD`
- POHVesting: `TBD`
- POHCharity: `TBD`
