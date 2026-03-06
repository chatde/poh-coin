# CLAUDE.md — Project POH (Pursuit of Happiness Coin)

## What This Is

Charity ERC20 token on Base (Chain ID 8453) with the Voyager Block Model — Voyager 1's real-time distance drives the expanding token supply. Seven Solidity contracts (OpenZeppelin v5, Solidity 0.8.24) plus a Next.js 16 website. Mainnet live since 2026-02-23.

## Tech Stack

- **Contracts**: Hardhat, Mocha/Chai, OpenZeppelin v5, Solidity 0.8.24, ethers v6
- **Website**: Next.js 16 App Router, React 19, TypeScript strict, Biome formatter
- **Styling**: Tailwind 4, Framer Motion animations, pure SVG/CSS charts (no chart libraries)
- **Testing**: Vitest + happy-dom (website), Mocha/Chai (contracts)
- **Hosting**: Vercel (website root dir = `website/` in Vercel settings)
- **Security**: Slither + Mythril for contract analysis
- **GitHub**: chatde/poh-coin (SSH protocol)
- **Node**: /opt/homebrew/bin/node

## Key Paths

```
contracts/                      # 7 Solidity contracts (OZ v5)
test/                           # Hardhat contract tests (Mocha/Chai, JS)
scripts/                        # Deploy & config scripts
website/src/app/                # Next.js App Router pages
website/src/app/blocks/         # Block explorer page
website/src/app/mine/           # Mining dashboard + setup
website/src/app/mine/workers/   # Web Workers (compute + block equation)
website/src/app/mine/hooks/     # useCompute, useHeartbeat, useBattery, useFitness
website/src/app/api/mine/boinc/ # BOINC link + status API routes
website/src/components/         # Shared + motion/ components
website/src/lib/                # constants, contracts, voyager, block-rewards, boinc-data
website/src/lib/__tests__/      # Vitest tests
website/supabase/               # SQL migrations (v1-v5)
MILESTONES.md                   # Cross-session progress tracker
BUDGET.md                       # ETH gas budget tracking
```

### Mainnet Contracts (Base, Chain ID 8453)

- Token: `0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07`
- Charity: `0xf9eDc5CF986ea637E724E078DA01AbD7c4957D49`
- Vesting: `0xFfce548EbF097F630A272aA577E750A0Bc1308dd`
- Rewards: `0xa7904Cb5f3D6a937Db06453e3d95db4f0C3236dF`
- Registry: `0x8137a04a50C058b00d9ee44D25b9Ef1ba900D15F`
- Timelock: `0x64981B544a20d6933466c363dD175cA1FaD96Bb6`
- Governor: `0x7C96Ed675033F15a53557f1d0190e00B19522e6e`

## Development Workflow

```bash
# Contracts (from project root)
npx hardhat compile          # Compile contracts
npx hardhat test             # Run contract tests (Mocha/Chai)
npm run slither              # Slither static security analysis

# Website (from website/)
cd website && npm run dev    # Dev server
cd website && npm run build  # Production build — catches ALL TS errors
cd website && npm test       # Run Vitest tests
cd website && npm run test:coverage  # Coverage report

# Deploy
git push origin main         # Triggers Vercel auto-deploy (website root dir = website/)
# NEVER run `vercel deploy` from inside website/ — always push to GitHub
```

## Project-Specific Rules

- **TypeScript strict**: Never use `any`. Zero errors required before commit.
- **No console.log in production code.**
- **Smart contracts**: NEVER deploy without full test pass + testnet verification. Run Slither + Mythril before any modification. Reentrancy guards on all state-changing functions.
- **Formatting**: Biome (tabs, double quotes) — NOT Prettier.
- **Charts**: Pure SVG/CSS only — no chart libraries.
- **Components**: Default to Server Components. Only add `"use client"` when hooks/interactivity are required.
- **Custom Tailwind colors**: `voyager-gold`, `charity-green` etc. are CSS custom properties defined in `globals.css`, not Tailwind config — do not add them to tailwind config.
- **BigInt in tests**: tsconfig targets ES2017 — use `BigInt()` constructor, NOT `100n` literal syntax.
- **Vercel root dir**: Project root is `website/` in Vercel settings — push to GitHub, never `vercel deploy` from inside website/.
- **useEffect ordering**: Declare `useCallback` hooks ABOVE `useEffect`s that reference them (avoids TS2448).
- **BOINC aggregators**: Spotty uptime. Dual fallback (netsoft-online + free-dc) + per-project fallback. XML responses, not JSON.
- **Block equation worker**: Must use `setTimeout(0)` to yield every 8K hashes — otherwise freezes UI.
- **Voyager distance formula**: 99.99%+ accurate. Reference: Jan 1, 2026 = 25,316,070,000 km, velocity = 1,458,648 km/day.
- **Supabase env**: Website needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in .env.
- **Contract test files**: JavaScript (not TypeScript) — tests live in `test/*.test.js`.
