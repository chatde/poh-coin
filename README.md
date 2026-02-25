# Project POH — Pursuit of Happiness Coin

A charity ERC20 token on Base where **Voyager 1's real-time distance IS the expanding supply**. As the probe flies further from the Sun, more POH becomes available to mine. When Voyager dies, the supply freezes forever. Includes the "Proof of Planet" phone mining system — dual Web Workers running scientific compute + SHA-256 block equations in parallel.

## Mission

Change the trajectory of humankind by creating the most trusted charity crypto ecosystem on the planet. Every transaction funds environmental, humanitarian, educational, and health causes. When Voyager goes silent, remaining POH becomes the **Voyager Chase Fund** — a DAO-governed treasury to fund interstellar research.

## Live

- **Website**: [projectpoh.com](https://projectpoh.com)
- **Whitepaper**: [projectpoh.com/whitepaper](https://projectpoh.com/whitepaper)
- **Mine**: [projectpoh.com/mine](https://projectpoh.com/mine)
- **Block Explorer**: [projectpoh.com/blocks](https://projectpoh.com/blocks)
- **Tokenomics**: [projectpoh.com/tokenomics](https://projectpoh.com/tokenomics)
- **Impact Dashboard**: [projectpoh.com/impact](https://projectpoh.com/impact)
- **Leaderboard**: [projectpoh.com/leaderboard](https://projectpoh.com/leaderboard)

## The Voyager Block Model

| Parameter | Value |
|-----------|-------|
| Launch Supply | 24,526,000,000 (Voyager's distance at launch, in km) |
| Block Size | 1,000 km of Voyager travel |
| Blocks/Day | ~1,459 (Voyager speed: 16.88 km/s) |
| Tasks/Block | 20 (early) → 200 (at scale) |
| Year 1 Block Reward | ~1,009 POH |
| RTG Decay | 5% annual reduction |
| Max Distributable | ~10.72B POH (from 12.26B rewards pool) |
| Permanently Locked | ~1.54B POH (Voyager Chase Fund seed) |
| Buy Fee | 1% (0.5% charity + 0.5% liquidity) |
| Sell Fee | 3% (1.5% charity + 1% burn + 0.5% liquidity) |
| Transfer Fee | 0.5% (charity) |
| Max Wallet | 2% of supply |

## How Mining Works

1. Your phone runs **two parallel Web Workers**:
   - **Science Worker**: Protein folding, climate modeling, seismic analysis, drug screening
   - **Block Equation Worker**: SHA-256 proof-of-work (WASM via hash-wasm)
2. Complete N verified tasks + solve the block equation = **mine a block**
3. Block reward split: 60% equation solver, 30% task contributors, 10% F@H/BOINC bonus
4. Weekly epochs distribute POH via merkle proofs on-chain
5. Rewards decay at 5%/year (matching Voyager's RTG power loss)
6. When Voyager is decommissioned: blocks stop, remaining POH locked forever

## Supply Allocation

- 50% Community Rewards (block mining, RTG decay over 10+ years)
- 20% Charity Treasury (timelocked, governed by founder then DAO)
- 15% Liquidity Pool (Uniswap on Base)
- 10% Founder (4-year vesting, 6-month cliff)
- 5% Airdrop / Marketing

## Smart Contracts (7)

| Contract | Purpose |
|----------|---------|
| `POHToken.sol` | ERC20 + ERC20Votes + ERC20Permit with fees, anti-whale, Pausable |
| `POHVesting.sol` | Founder vesting (4yr linear, 6mo cliff) |
| `POHCharity.sol` | Timelocked charity treasury with proposals |
| `POHRewards.sol` | Merkle-based mining rewards with 24hr timelock + vesting |
| `POHNodeRegistry.sol` | Device registration, reputation, validator staking/slashing |
| `TimelockController` | 48-hour execution delay for governance actions |
| `POHGovernor.sol` | OpenZeppelin Governor — token-weighted DAO voting |

All contracts built on OpenZeppelin v5.4.0, Solidity 0.8.24, EVM version Cancun.

## Proof of Planet — Phone Mining

Mine POH blocks by contributing dual compute power:

- **Science Tasks**: Protein folding, climate modeling, seismic analysis, drug screening
- **Block Equations**: SHA-256 proof-of-work via WASM (adaptive difficulty: 5-10 min solve time)
- **F@H Integration**: Folding@home team bonus (team 1000001)
- **BOINC Integration**: Link your CPID for Rosetta@home, Einstein@Home, Climateprediction.net, World Community Grid

### Mining Features

- Dual Web Workers running in parallel (science + PoW)
- Wake Lock keeps mining active
- Battery safety: throttle at 40C, stop at 45C
- Adaptive tasks/block: 20 (early network) → 200 (at scale)
- Block progress tracking with equation hash rate display
- WASM SHA-256 (hash-wasm) for mobile-optimized hashing

## Mainnet Deployment (Base)

| Contract | Address |
|----------|---------|
| POHToken | [`0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07`](https://basescan.org/address/0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07) |
| POHCharity | [`0xf9eDc5CF986ea637E724E078DA01AbD7c4957D49`](https://basescan.org/address/0xf9eDc5CF986ea637E724E078DA01AbD7c4957D49) |
| POHVesting | [`0xFfce548EbF097F630A272aA577E750A0Bc1308dd`](https://basescan.org/address/0xFfce548EbF097F630A272aA577E750A0Bc1308dd) |
| POHRewards | [`0xa7904Cb5f3D6a937Db06453e3d95db4f0C3236dF`](https://basescan.org/address/0xa7904Cb5f3D6a937Db06453e3d95db4f0C3236dF) |
| POHNodeRegistry | [`0x8137a04a50C058b00d9ee44D25b9Ef1ba900D15F`](https://basescan.org/address/0x8137a04a50C058b00d9ee44D25b9Ef1ba900D15F) |
| TimelockController | [`0x64981B544a20d6933466c363dD175cA1FaD96Bb6`](https://basescan.org/address/0x64981B544a20d6933466c363dD175cA1FaD96Bb6) |
| POHGovernor | [`0x7C96Ed675033F15a53557f1d0190e00B19522e6e`](https://basescan.org/address/0x7C96Ed675033F15a53557f1d0190e00B19522e6e) |
| Uniswap V3 Pool | [`0x29A160A9C535F1460146d7DF19d49f9ae1eb2FbD`](https://basescan.org/address/0x29A160A9C535F1460146d7DF19d49f9ae1eb2FbD) |

All contracts verified on [Basescan](https://basescan.org). ENS: `projectpoh.eth`

<details>
<summary>Testnet Deployment (Base Sepolia)</summary>

| Contract | Address |
|----------|---------|
| POHToken | `0xe75DC31C1D4F1f8b1160e84a6B3228115d1135a2` |
| POHCharity | `0x31a3D6d28fEFfc177F9d099a4491A4E3cE8fA7E6` |
| POHVesting | `0x5112A61F036fE79C0D15a779269B6558dC70C1a7` |
| POHRewards | `0x136EB82Ce350a7f391DC02223a878A8FcA4028Fe` |
| POHNodeRegistry | `0x6413393Ec4c594F0a9ce9c1B5d2056B4B309E0e6` |

</details>

## Security

- **Static Analysis**: Slither — no critical findings across all contracts
- **Formal Verification**: Mythril — no issues detected
- **OpenZeppelin v5.4.0**: Industry-standard contract library
- **Timelock**: 24-hour delay on merkle root changes, 48-hour governance timelock
- **Anti-whale**: 2% max wallet, 1% max transaction
- **Vesting**: Founder tokens locked 4 years with 6-month cliff
- **Governance**: Token-weighted voting with 4% quorum and 7-day voting period
- **All contracts verified on Basescan** — source code publicly readable

## Tech Stack

- **Blockchain**: Base (Coinbase L2)
- **Contracts**: Solidity 0.8.24, Hardhat, OpenZeppelin v5
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Vercel Serverless, Supabase (PostgreSQL)
- **Mining**: Dual Web Workers (science + PoW), PWA, hash-wasm (WASM SHA-256)
- **Block System**: Voyager distance → block height, RTG decay rewards

## Development

```bash
# Contracts
cd /
npm install
npx hardhat compile
npx hardhat test           # 166 tests

# Website
cd website/
npm install
npm run dev                # Local development
npm run build              # Production build (39 routes)
```

## Tests

- **166 total tests passing**
  - 30 POHToken tests
  - 61 POHRewards tests (including timelock + vesting)
  - 48 POHNodeRegistry tests
  - 1 POHVesting test
  - 26 POHGovernor tests

## Legal

- [Disclaimers](https://projectpoh.com/disclaimers) — 10-section legal disclaimer
- POH is not an investment and not financial advice
- Not a registered charity — charity distributions are discretionary
- See disclaimers page for full legal terms

## License

MIT
