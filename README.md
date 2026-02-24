# Project POH — Pursuit of Happiness Coin

A charity ERC20 token on Base with tokenomics tied to Voyager 1's journey through interstellar space. Includes the "Proof of Planet" phone mining system that lets anyone contribute compute to scientific research and earn POH tokens.

## Mission

Change the trajectory of humankind by creating the most trusted charity crypto ecosystem on the planet. Every transaction funds environmental, humanitarian, educational, and health causes.

## Live

- **Website**: [projectpoh.com](https://projectpoh.com)
- **Whitepaper**: [projectpoh.com/whitepaper](https://projectpoh.com/whitepaper)
- **Mine**: [projectpoh.com/mine](https://projectpoh.com/mine)
- **Impact Dashboard**: [projectpoh.com/impact](https://projectpoh.com/impact)
- **Leaderboard**: [projectpoh.com/leaderboard](https://projectpoh.com/leaderboard)

## Tokenomics (Voyager Model)

| Parameter | Value |
|-----------|-------|
| Max Supply | 24,526,000,000 (Voyager 1 distance in km) |
| Buy Fee | 1% (0.5% charity + 0.5% liquidity) |
| Sell Fee | 3% (1.5% charity + 1% burn + 0.5% liquidity) |
| Transfer Fee | 0.5% (charity) |
| Max Wallet | 2% of supply |
| Max Transaction | 1% of supply |

## Supply Allocation

- 50% Community Rewards (Proof of Planet mining, released over 10+ years)
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

Mine POH with your phone by contributing compute power to scientific research:

- **Protein Folding** — Ubiquitin (Parkinson's), Crambin (Drug Design), Ribonuclease (Cancer)
- **Climate Modeling** — Arctic Ice Melt, Pacific Ocean Heat Transport, Urban Heat Islands
- **Seismic Analysis** — Earthquake Early Warning (Noto Japan, Turkey-Syria, Cascadia)
- **Drug Screening** — Virtual docking against cancer-related targets (EGFR, BRAF, HER2)

### How It Works

1. Visit [projectpoh.com/mine/setup](https://projectpoh.com/mine/setup) and create a wallet
2. Your phone runs scientific compute tasks in the background
3. Results are verified by 2-of-3 redundant computation
4. Earn points based on compute contribution
5. Weekly epoch close calculates your POH share
6. Claim tokens via merkle proof on-chain

### Mining Features

- Wake Lock keeps mining active overnight
- Auto-resumes on page refresh
- Battery safety: throttle at 40C, stop at 45C
- 15-minute heartbeat with challenge-response verification
- Real science datasets from PDB, NOAA, and USGS

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
- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Vercel Serverless, Supabase (PostgreSQL)
- **Mining**: Web Workers, PWA with service worker

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
