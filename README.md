# Project POH — Pursuit of Happiness Coin

A charity ERC20 token on Base with tokenomics tied to Voyager 1's journey through interstellar space.

## Mission

Change the trajectory of humankind by creating the most trusted charity crypto ecosystem on the planet. Every transaction funds environmental, humanitarian, educational, and health causes.

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

- 50% Community Rewards (released over 10+ years)
- 20% Charity Treasury (governed by founder, then DAO)
- 15% Liquidity Pool (Uniswap on Base)
- 10% Founder (4-year vesting, 6-month cliff)
- 5% Airdrop / Marketing

## Contracts

- `contracts/POHToken.sol` — Main ERC20 with fees, anti-whale, Pausable
- `contracts/POHVesting.sol` — Founder vesting (immutable schedule)
- `contracts/POHCharity.sol` — Timelocked charity treasury

## Development

```bash
npm install          # Install dependencies
npx hardhat compile  # Compile contracts
npx hardhat test     # Run tests (30 tests)
```

## Network

Deploying on **Base** (Coinbase L2) for lowest gas costs and best fiat on-ramp.

## License

MIT
