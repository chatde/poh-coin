# POH Mainnet Deployment Checklist

Step-by-step guide for deploying Project POH to Base mainnet.

---

## Pre-Deployment

### 1. Generate a fresh deployer wallet

Do NOT reuse the testnet deployer. Create a brand new wallet for mainnet.

```bash
npx hardhat console
```

```js
const wallet = ethers.Wallet.createRandom();
console.log("Address:", wallet.address);
console.log("Private key:", wallet.privateKey);
console.log("Mnemonic:", wallet.mnemonic.phrase);
```

- [ ] Write down the mnemonic on paper (offline backup)
- [ ] Save the private key securely (password manager, NOT plaintext)
- [ ] Record the address for funding

### 2. Fund the deployer wallet

- [ ] Buy ~$100 worth of ETH on Coinbase
- [ ] Withdraw to Base network directly (Coinbase supports native Base withdrawals)
- [ ] Send to the deployer address from step 1
- [ ] Verify arrival: https://basescan.org/address/YOUR_DEPLOYER_ADDRESS

Estimated gas costs:
- 7 contract deployments: ~0.005-0.01 ETH
- Configuration transactions: ~0.002-0.005 ETH
- Token transfers: ~0.001-0.003 ETH
- LP creation: ~0.003-0.005 ETH
- Buffer for retries: ~0.005 ETH
- **Total estimate: ~0.02-0.03 ETH**
- Remaining ETH goes into the LP pool

### 3. Set up environment variables

Create or update `.env` in the project root:

```bash
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY
```

- [ ] `DEPLOYER_PRIVATE_KEY` is set (include the `0x` prefix)
- [ ] `BASESCAN_API_KEY` is set (get one at https://basescan.org/myapikey)
- [ ] `.env` is in `.gitignore` (should already be there)

### 4. Compile contracts

```bash
npx hardhat compile
```

- [ ] All 7 contracts compile without errors (POHToken, POHCharity, POHVesting, POHRewards, POHNodeRegistry, TimelockController, POHGovernor)

### 5. Run tests

```bash
npx hardhat test
```

- [ ] All 166 tests pass

---

## Deployment

### 6. Dry run on local Hardhat network

This deploys to an in-memory Hardhat network. No real ETH is used.

```bash
npx hardhat run scripts/deploy-mainnet.js
```

- [ ] All 7 contracts deploy successfully
- [ ] Token distribution is correct (10% vesting, 20% charity, 50% rewards, 20% remaining)
- [ ] Governance roles configured (Governor has PROPOSER + EXECUTOR on TimelockController)
- [ ] POHCharity ownership transferred to TimelockController
- [ ] `deployments/base-mainnet.json` is created with all addresses
- [ ] No errors in output

### 7. Deploy to Base mainnet

This is the real deployment. Double-check everything before running.

```bash
CONFIRM_MAINNET=true npx hardhat run scripts/deploy-mainnet.js --network base
```

- [ ] Warning banner displayed and acknowledged
- [ ] All 7 contracts deployed
- [ ] All exemptions configured
- [ ] Token distribution confirmed
- [ ] POHCharity ownership transferred to TimelockController
- [ ] All contracts verified on Basescan
- [ ] `deployments/base-mainnet.json` updated with mainnet addresses
- [ ] Record gas used for accounting

### 8. Verify deployment on Basescan

Visit each contract on Basescan and confirm:

- [ ] POHToken: source verified, total supply = 24,526,000,000 POH
- [ ] POHCharity: source verified, owner = TimelockController
- [ ] POHVesting: source verified, beneficiary = deployer, allocation = 2,452,600,000 POH
- [ ] POHRewards: source verified, token balance = 12,263,000,000 POH
- [ ] POHNodeRegistry: source verified
- [ ] TimelockController: source verified, 48hr min delay, Governor has proposer + executor roles
- [ ] POHGovernor: source verified, correct token + timelock references

If any verification failed during deployment, run manually:

```bash
npx hardhat verify --network base CONTRACT_ADDRESS CONSTRUCTOR_ARG_1 CONSTRUCTOR_ARG_2
```

---

## Liquidity Pool

### 9. Create Uniswap V3 LP

Review the initial price before running. Default is 0.000000001 ETH per POH.

```bash
# With default price
CONFIRM_MAINNET=true npx hardhat run scripts/create-lp.js --network base

# With custom price
INITIAL_PRICE_ETH=0.00000001 CONFIRM_MAINNET=true npx hardhat run scripts/create-lp.js --network base
```

- [ ] Pool created on Uniswap V3
- [ ] 3,678,900,000 POH deposited (15% of supply)
- [ ] Corresponding ETH deposited
- [ ] LP NFT token ID recorded
- [ ] Pool address recorded
- [ ] `deployments/base-mainnet.json` updated with pool info

### 10. Mark LP pair as AMM on POHToken

This enables buy/sell fee detection. Use the pool address from step 9.

```bash
npx hardhat console --network base
```

```js
const token = await ethers.getContractAt("POHToken", "POHTOKEN_ADDRESS");
await token.setAutomatedMarketMaker("POOL_ADDRESS", true);
```

- [ ] Pool address set as automated market maker
- [ ] Buy/sell fees now active on trades through this pool

### 11. (Optional) Lock LP permanently

To build trust, you can transfer the LP NFT to the burn address so liquidity can never be removed. This is irreversible.

```bash
npx hardhat console --network base
```

```js
const positionManager = await ethers.getContractAt(
  ["function transferFrom(address,address,uint256)"],
  "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1"
);
// Transfer LP NFT to dead address
await positionManager.transferFrom("DEPLOYER_ADDRESS", "0x000000000000000000000000000000000000dEaD", LP_TOKEN_ID);
```

- [ ] LP NFT transferred to burn address (if desired)

---

## Post-Deployment

### 12. Update website environment variables

On Vercel (https://vercel.com), update the following env vars for the website project:

```
NEXT_PUBLIC_POH_TOKEN_ADDRESS=...
NEXT_PUBLIC_POH_CHARITY_ADDRESS=...
NEXT_PUBLIC_POH_VESTING_ADDRESS=...
NEXT_PUBLIC_POH_REWARDS_ADDRESS=...
NEXT_PUBLIC_POH_REGISTRY_ADDRESS=...
NEXT_PUBLIC_POH_GOVERNOR_ADDRESS=...
NEXT_PUBLIC_POH_TIMELOCK_ADDRESS=...
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_NETWORK=base
```

- [ ] All contract addresses updated on Vercel
- [ ] Chain ID set to 8453 (Base mainnet)
- [ ] Trigger a new deployment on Vercel
- [ ] Verify website reads from mainnet contracts

### 13. Update MILESTONES.md

Fill in the mainnet contract addresses section in `MILESTONES.md`.

- [ ] All 7 contract addresses recorded
- [ ] Pool address recorded
- [ ] Deployer address recorded

### 14. Verify on Basescan

Check each contract one more time:

- [ ] https://basescan.org/address/TOKEN_ADDRESS — verified, correct supply
- [ ] Token shows up on Basescan token tracker
- [ ] Pool shows trading activity after first swap test

### 15. Test a small swap

Use Uniswap UI (https://app.uniswap.org) to do a tiny test swap:

- [ ] Buy a small amount of POH with ETH
- [ ] Verify buy fee (1%) was deducted
- [ ] Sell a small amount of POH back
- [ ] Verify sell fee (3%) was deducted
- [ ] Charity wallet received fee portions

### 16. Announce

- [ ] Tweet from project account with contract address + Basescan link
- [ ] Post in Discord/Telegram
- [ ] Update GitHub README with mainnet addresses
- [ ] Submit token info to Basescan (name, logo, website, socials)

---

## Emergency Procedures

### Pause trading

If something goes wrong, the token owner can pause all transfers:

```js
const token = await ethers.getContractAt("POHToken", "TOKEN_ADDRESS");
await token.pause();
```

### Transfer ownership

To transfer token ownership to the TimelockController (for full DAO governance):

```js
const token = await ethers.getContractAt("POHToken", "TOKEN_ADDRESS");
await token.transferOwnership("TIMELOCK_ADDRESS");
```

Note: Only do this after governance is tested and the community has enough voting power.

---

## Addresses Quick Reference

After deployment, fill in these addresses:

| Contract           | Address |
|--------------------|---------|
| POHToken           | `TBD`   |
| POHCharity         | `TBD`   |
| POHVesting         | `TBD`   |
| POHRewards         | `TBD`   |
| POHNodeRegistry    | `TBD`   |
| TimelockController | `TBD`   |
| POHGovernor        | `TBD`   |
| Uniswap V3 Pool   | `TBD`   |
| LP NFT Token ID    | `TBD`   |
| Deployer           | `TBD`   |
