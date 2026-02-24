# POH Website Testing Documentation

## Test Infrastructure

The project uses **Vitest** for testing, configured for Next.js 16 with TypeScript.

### Key Files

- `vitest.config.ts` - Test configuration with path aliases
- `vitest.setup.ts` - Global test setup, environment variables, crypto polyfills
- `package.json` - Test scripts

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/lib/__tests__/constants.test.ts

# Watch mode (interactive)
npm test -- --watch
```

## Test Coverage

### 1. **Core Library Functions** (146 tests total)

#### `/src/lib/__tests__/constants.test.ts` (9 tests)
- **calculateWeeklyPool** function
  - ✅ Returns 0 for dates before launch
  - ✅ Calculates correct pool at launch date
  - ✅ Applies 5% annual decay correctly
  - ✅ Applies compound decay over multiple years
  - ✅ Handles partial years (fractional decay)
  - ✅ Uses current date when no argument provided
- **RATE_LIMITS configuration**
  - ✅ All limits have valid maxCount values (positive integers)
  - ✅ All limits have valid windowMs values (positive integers)
  - ✅ All expected rate limit keys are defined

#### `/src/lib/__tests__/fitness-data.test.ts` (20 tests)
- **computeEffortScore** function
  - ✅ Computes base score from active minutes
  - ✅ Applies HR zone factor correctly (zones 1-5)
  - ✅ Applies consistency bonus (5% per consecutive day)
  - ✅ Caps consistency bonus at 1.5x (10 days)
  - ✅ Combines all factors correctly
  - ✅ Returns 1.0 HR zone factor when no zones provided
  - ✅ Handles empty HR zones object
  - ✅ Rounds final score to 2 decimal places
- **computeActivityHash** function
  - ✅ Generates deterministic hash for same inputs
  - ✅ Generates different hashes for different users
  - ✅ Generates different hashes for different times
  - ✅ Generates different hashes for different activity types
  - ✅ Generates different hashes for different durations
  - ✅ Returns valid SHA-256 hex string (64 chars)
- **OAuth state management**
  - ✅ Creates and verifies valid state tokens
  - ✅ Normalizes wallet address to lowercase
  - ✅ Rejects tampered payload
  - ✅ Rejects tampered signature
  - ✅ Rejects malformed state strings
  - ✅ Rejects expired state (>10 minutes old)

#### `/src/lib/__tests__/reference-compute.test.ts` (24 tests)
- **shouldSpotCheck** function
  - ✅ Returns boolean
  - ✅ Returns true ~10% of the time (statistical test)
- **spotCheckResult** - Protein folding
  - ✅ Passes when submitted result matches reference
  - ✅ Fails when submitted result deviates significantly
  - ✅ Returns reference and submitted values
- **spotCheckResult** - Climate simulation
  - ✅ Validates climate computation
  - ✅ Fails with incorrect grid size
- **spotCheckResult** - Signal processing
  - ✅ Validates signal computation with deterministic seed
  - ✅ Enforces exact match for numSamples
  - ✅ Enforces exact match for fftSize
- **spotCheckResult** - Drug screening
  - ✅ Validates drug screening computation
  - ✅ Enforces exact match for bindingSiteResidues
- **Unknown task types**
  - ✅ Passes unknown task types without validation

#### `/src/lib/__tests__/merkle.test.ts` (12 tests)
- **toWei** function
  - ✅ Converts whole numbers correctly
  - ✅ Converts decimal numbers correctly
  - ✅ Handles zero
  - ✅ Handles very small numbers (1 wei)
- **buildMerkleTree** function
  - ✅ Builds tree for single leaf
  - ✅ Builds tree for multiple leaves
  - ✅ Produces deterministic roots for same input
  - ✅ Produces different roots for different amounts
  - ✅ Normalizes wallet addresses to lowercase in proofs
  - ✅ Handles empty leaves array
  - ✅ Creates valid proofs for verification
  - ✅ Handles power-of-2 and non-power-of-2 leaf counts

#### `/src/lib/__tests__/fah-data.test.ts` (8 tests)
- **calculateFahBonus** function
  - ✅ Calculates 10 points per WU
  - ✅ Handles zero WUs
  - ✅ Handles fractional WUs
  - ✅ Handles negative WUs (edge case)
  - ✅ Handles very large WU counts
- **FAH_TEAM_ID constant**
  - ✅ Is defined
  - ✅ Is a positive integer
  - ✅ Matches expected POH team ID (1067948)

#### `/src/lib/__tests__/rate-limiter.test.ts` (9 tests)
- **RATE_LIMITS configuration**
  - ✅ REGISTER_PER_WALLET limit (3 per day)
  - ✅ REGISTER_PER_IP limit (5 per hour)
  - ✅ TASK_REQUEST limit (60 per hour)
  - ✅ SUBMIT limit (60 per hour)
  - ✅ FITNESS_ACTIVITY limit (20 per day)
  - ✅ FITNESS_SYNC limit (10 per hour)
  - ✅ All limits have positive integer values
  - ✅ Window durations are reasonable
  - ✅ Max counts are reasonable for each use case

#### `/src/lib/__tests__/contracts.test.ts` (14 tests)
- **Contract addresses**
  - ✅ All required contract addresses defined
  - ✅ Valid Ethereum addresses (0x + 40 hex chars)
  - ✅ Uses Sepolia addresses in test environment
- **formatPOH** function
  - ✅ Formats small amounts without suffix
  - ✅ Formats thousands with K suffix
  - ✅ Formats millions with M suffix
  - ✅ Formats billions with B suffix
  - ✅ Respects decimals parameter
  - ✅ Handles zero
  - ✅ Handles very small wei amounts
- **Network configuration**
  - ✅ Valid chain ID (84532 for Base Sepolia)
  - ✅ Valid RPC URL
  - ✅ Valid block explorer URL
  - ✅ Uses Sepolia endpoints in test environment

### 2. **API Security Patterns** (15 tests)

#### `/src/app/api/__tests__/api-security.test.ts`
- **CRON_SECRET verification**
  - ✅ CRON_SECRET is defined in environment
  - ✅ CRON_SECRET is not empty or default value
- **OAuth secrets**
  - ✅ OAuth state secret defined
  - ✅ Provider client IDs defined
  - ✅ Provider client secrets defined
- **Input sanitization**
  - ✅ Wallet addresses normalized to lowercase
  - ✅ Wallet address format validation (regex)
  - ✅ Device ID format validation
- **Error handling**
  - ✅ Returns 400 for missing required parameters
  - ✅ Returns 401 for unauthorized requests
  - ✅ Returns 500 for internal errors
  - ✅ Does not expose internal error details
- **Rate limiting**
  - ✅ Constructs proper rate limit keys
- **Authorization headers**
  - ✅ Parses Bearer token correctly
  - ✅ Rejects invalid authorization formats
  - ✅ Validates cron secret correctly

### 3. **Epoch Close Business Logic** (35 tests)

#### `/src/__tests__/epoch-close-logic.test.ts`
- **Pool distribution**
  - ✅ Splits weekly pool 80/20 (data nodes / validators)
  - ✅ Data node share is 80%
  - ✅ Validator share is 20%
- **Quality bonus calculation**
  - ✅ Applies 25% bonus for 100% quality
  - ✅ Applies proportional bonus for partial quality
  - ✅ No bonus for zero quality
- **Streak bonuses**
  - ✅ Applies 10% bonus for 7-day streak
  - ✅ Applies 25% bonus for 30-day streak
  - ✅ Prefers 30-day bonus over 7-day
  - ✅ No bonus for streak under 7 days
- **Trust ramp**
  - ✅ Has 4 weeks of trust ramp
  - ✅ Starts at 25% in week 1
  - ✅ Reaches 100% by week 4
  - ✅ Increases linearly (0.25, 0.50, 0.75, 1.00)
  - ✅ Applies trust multiplier correctly
- **Geographic decay**
  - ✅ Has decay factors for 4+ devices
  - ✅ No decay for first device (1.00)
  - ✅ Decreases for subsequent devices
  - ✅ Correct decay sequence (1.00, 0.80, 0.65, 0.50)
- **Quadratic wallet scaling**
  - ✅ Applies diminishing returns (1/1, 1/2, 1/3, 1/4...)
- **Daily cap**
  - ✅ Is 0.1% of weekly pool per day
  - ✅ Calculates weekly device cap correctly
  - ✅ Prevents single device from earning too much
- **Referral bonus**
  - ✅ Is 10% bonus
  - ✅ Applies to both referrer and invitee
- **Vesting tiers**
  - ✅ New miner: 25% immediate, 75% vesting
  - ✅ Veteran: 75% immediate, 25% vesting
  - ✅ Requires 180 days for veteran status
  - ✅ Calculates new miner vesting correctly
  - ✅ Calculates veteran vesting correctly
- **Validator staking multiplier**
  - ✅ Is 2x for staked validators
  - ✅ Doubles validator points when staked
- **Combined bonus calculations**
  - ✅ Stacks all bonuses correctly
  - ✅ Applies geo decay after bonuses
  - ✅ Respects daily cap after all bonuses
- **Pool share calculations**
  - ✅ Distributes pool proportionally by points
  - ✅ Handles zero total points gracefully

## Test Organization

Tests are organized by pillar:

1. **Frontend** - Component rendering, imports, routes (not yet implemented - requires React testing setup)
2. **Backend** - API route handlers, validation, error handling (security pattern tests)
3. **Security** - Auth checks, rate limiting, input sanitization (API security tests)
4. **Data Aggregation** - Epoch-close calculation logic, effort scores, consensus (epoch-close logic tests)
5. **Core Libraries** - Pure function tests (constants, fitness-data, reference-compute, merkle, fah-data, contracts, rate-limiter)

## Coverage Gaps

Areas not yet covered by tests (would require mocking Supabase):

- **API Route Handlers** - Full request/response cycle tests
  - `/api/cron/epoch-close` - Full epoch close integration
  - `/api/mine/register` - Device registration flow
  - `/api/mine/task` - Task assignment logic
  - `/api/mine/submit` - Submission validation
  - `/api/mine/fitness/*` - Fitness OAuth flow
- **Database Operations** - Supabase client interactions
- **Frontend Components** - React component rendering
- **Integration Tests** - End-to-end workflows

These would require:
- Supabase mocking/test database setup
- React Testing Library for component tests
- Mock fetch for external API calls (Strava, Fitbit, F@H)

## Environment Variables for Testing

Required in `vitest.setup.ts`:

```typescript
process.env.NEXT_PUBLIC_CHAIN_ID = '84532';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';
process.env.OAUTH_STATE_SECRET = 'test-oauth-secret';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.STRAVA_CLIENT_ID = 'test-strava-client-id';
process.env.STRAVA_CLIENT_SECRET = 'test-strava-secret';
process.env.FITBIT_CLIENT_ID = 'test-fitbit-client-id';
process.env.FITBIT_CLIENT_SECRET = 'test-fitbit-secret';
```

## Best Practices

1. **Pure Functions First** - Test business logic in isolation before integration
2. **Deterministic Tests** - Use fixed seeds for randomness, fixed dates for time-based tests
3. **Edge Cases** - Test boundary conditions, empty inputs, null values
4. **Precision** - Use `toBeCloseTo` for floating-point comparisons
5. **Security** - Validate all input sanitization and authorization patterns
6. **Documentation** - Each test clearly describes what it verifies

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Future Enhancements

1. **Component Tests** - Add React Testing Library for UI components
2. **E2E Tests** - Add Playwright for full user flows
3. **API Integration Tests** - Mock Supabase for full API testing
4. **Performance Tests** - Benchmark compute worker performance
5. **Security Scans** - Add SAST tooling (Snyk, CodeQL)
