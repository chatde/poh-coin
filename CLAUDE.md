# Project POH — Pursuit of Happiness Coin

Charity ERC20 on Base (Chain ID 8453) with the **Voyager Block Model** — Voyager 1's distance IS the expanding supply. 7 Solidity contracts (OpenZeppelin v5, Solidity 0.8.24) + Next.js 16 website. Mainnet live since 2026-02-23. GitHub: chatde/poh-coin. Owner: Dad — maximum autonomy, minimal interruptions.

## Commands

```bash
# Contracts (from project root)
npx hardhat compile          # Compile contracts
npx hardhat test             # Run contract tests (Mocha/Chai)
npm run slither              # Slither static security analysis

# Website (from website/)
cd website && npm run build  # Build — catches ALL TS errors
cd website && npm test       # Run Vitest tests
cd website && npm run test:coverage  # Coverage report

# Deploy
git push origin main         # Triggers Vercel auto-deploy for website
```

## Stack & Conventions

- **Contracts**: Hardhat, Mocha/Chai, tests in `test/*.test.js` (JavaScript, not TS)
- **Website**: Next.js 16 App Router, React 19, TypeScript strict
- **Testing**: Vitest + happy-dom, tests in `website/src/lib/__tests__/`
- **Styling**: Tailwind 4, custom CSS vars in globals.css (`voyager-gold`, `charity-green`, etc.)
- **Animations**: Framer Motion (`FadeIn`, `TiltCard`, `CountUp`, `ParallaxSection`, `StaggerChildren`)
- **Formatting**: Biome (tabs, double quotes) — NOT Prettier
- **Charts**: Pure SVG/CSS only — no chart libraries
- **Contract reads**: `website/src/lib/contracts.ts` (ethers v6)
- **Constants**: `website/src/lib/constants.ts` (emission params, block constants, Voyager params)
- **Voyager**: `website/src/lib/voyager.ts` (distance calculator, block height, light delay)
- **Block Rewards**: `website/src/lib/block-rewards.ts` (RTG decay, block rewards, emission schedule)
- **Voyager Bridge**: `website/src/lib/voyager-block.ts` (re-exports for React hooks)
- **BOINC**: `website/src/lib/boinc-data.ts` (CPID verification, XML aggregator APIs)
- **Block Worker**: `website/src/app/mine/workers/block-equation.worker.ts` (SHA-256 PoW via hash-wasm WASM)
- **Components**: Default to Server Components. Only add `"use client"` when hooks/interactivity needed.

## Known Pitfalls

Real bugs from past sessions — do NOT repeat these:

- **useEffect ordering**: Always declare `useCallback` hooks ABOVE `useEffect`s that reference them (avoids TS2448: used before declaration)
- **Vercel deploy**: Project root dir is `website/` in Vercel settings — push to GitHub for auto-deploy, never `vercel deploy` from inside website/
- **BigInt in tests**: tsconfig targets ES2017 — use `BigInt()` constructor, not `100n` literal syntax
- **Custom Tailwind colors**: `voyager-gold`, `charity-green` etc. are CSS custom properties defined in globals.css, not Tailwind config
- **Supabase env**: Website needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in .env
- **CountUp component**: Shows 0 on SSR/initial render, animates on scroll intersection — this is expected behavior, not a bug
- **Sentry**: `@sentry/nextjs` is installed — errors are tracked in production
- **hash-wasm**: Used in block equation worker for WASM SHA-256 — much faster than crypto.subtle for small inputs
- **Block equation worker**: Must use `setTimeout(0)` to yield every 8K hashes — otherwise freezes UI
- **Voyager distance formula**: 99.99%+ accurate. Reference: Jan 1, 2026 = 25,316,070,000 km, velocity = 1,458,648 km/day
- **RTG decay math**: Converges to 10.72B max distributable from 12.26B pool. 1.54B permanently unreachable = intentional.
- **BOINC aggregators**: Spotty uptime. Dual fallback (netsoft-online + free-dc) + per-project fallback. XML responses, not JSON.
- **Tab backgrounding**: Web Workers freeze after ~5 min on Chrome Android. Wake Lock API mitigates screen-off only.

## Key Paths

```
contracts/                      # 7 Solidity contracts (OZ v5)
test/                           # Hardhat tests (Mocha/Chai, JS)
scripts/                        # Deploy & config scripts
website/src/app/                # Next.js App Router pages
website/src/app/blocks/         # Block explorer page
website/src/app/mine/           # Mining dashboard + setup
website/src/app/mine/workers/   # Web Workers (compute + block equation)
website/src/app/mine/hooks/     # useCompute, useHeartbeat, useBattery, useFitness
website/src/app/api/mine/boinc/ # BOINC link + status API routes
website/src/components/         # Shared + motion/ components
website/src/lib/                # Constants, contracts, voyager, block-rewards, boinc-data
website/src/lib/__tests__/      # Vitest tests
website/supabase/               # SQL migrations (v1-v5)
website/TESTING.md              # Detailed test documentation
MILESTONES.md                   # Cross-session progress tracker
BUDGET.md                       # ETH gas budget tracking
```

## Mainnet Contracts (Base, Chain ID 8453)

- Token: `0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07`
- Charity: `0xf9eDc5CF986ea637E724E078DA01AbD7c4957D49`
- Vesting: `0xFfce548EbF097F630A272aA577E750A0Bc1308dd`
- Rewards: `0xa7904Cb5f3D6a937Db06453e3d95db4f0C3236dF`
- Registry: `0x8137a04a50C058b00d9ee44D25b9Ef1ba900D15F`
- Timelock: `0x64981B544a20d6933466c363dD175cA1FaD96Bb6`
- Governor: `0x7C96Ed675033F15a53557f1d0190e00B19522e6e`
