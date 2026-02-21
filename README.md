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

## Smart Contracts (5)

| Contract | Purpose |
|----------|---------|
| `POHToken.sol` | ERC20 with fees, anti-whale, Pausable |
| `POHVesting.sol` | Founder vesting (4yr linear, 6mo cliff) |
| `POHCharity.sol` | Timelocked charity treasury with proposals |
| `POHRewards.sol` | Merkle-based mining rewards with 24hr timelock + vesting |
| `POHNodeRegistry.sol` | Device registration, reputation, validator staking/slashing |

All contracts built on OpenZeppelin v5, Solidity 0.8.24.

## Proof of Planet — Phone Mining

Mine POH with your phone by contributing compute power to scientific research:

- **Protein Folding** — Ubiquitin (Parkinson's), Crambin (Drug Design), Ribonuclease (Cancer)
- **Climate Modeling** — Arctic Ice Melt, Pacific Ocean Heat Transport, Urban Heat Islands
- **Seismic Analysis** — Earthquake Early Warning (Noto Japan, Turkey-Syria, Cascadia)

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

## Testnet Deployment (Base Sepolia)

| Contract | Address |
|----------|---------|
| POHToken | `0xe75DC31C1D4F1f8b1160e84a6B3228115d1135a2` |
| POHCharity | `0x31a3D6d28fEFfc177F9d099a4491A4E3cE8fA7E6` |
| POHVesting | `0x5112A61F036fE79C0D15a779269B6558dC70C1a7` |
| POHRewards | `0x136EB82Ce350a7f391DC02223a878A8FcA4028Fe` |
| POHNodeRegistry | `0x6413393Ec4c594F0a9ce9c1B5d2056B4B309E0e6` |

All contracts verified on [Basescan](https://sepolia.basescan.org).

## Security

- **Static Analysis**: Slither — no critical findings
- **Formal Verification**: Mythril — no issues detected
- **OpenZeppelin v5**: Industry-standard contract library
- **Timelock**: 24-hour delay on merkle root changes
- **Anti-whale**: 2% max wallet, 1% max transaction
- **Vesting**: Founder tokens locked 4 years with 6-month cliff
- **Third-party audit**: Not yet completed (planned pre-mainnet)

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
npx hardhat test           # 140 tests

# Website
cd website/
npm install
npm run dev                # Local development
npm run build              # Production build (27 routes)
```

## Tests

- **140 total tests passing**
  - 30 POHToken tests
  - 61 POHRewards tests (including timelock + vesting)
  - 48 POHNodeRegistry tests
  - 1 POHVesting test

## Legal

- [Disclaimers](https://projectpoh.com/disclaimers) — 10-section legal disclaimer
- POH is not an investment and not financial advice
- Not a registered charity — charity distributions are discretionary
- Smart contracts not yet audited by third-party firm
- See disclaimers page for full legal terms

## License

MIT
