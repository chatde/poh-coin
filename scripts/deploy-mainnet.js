const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy ALL contracts to Base mainnet:
 *   POHToken, POHCharity, POHVesting, POHRewards, POHNodeRegistry,
 *   TimelockController, POHGovernor
 *
 * Usage:
 *   CONFIRM_MAINNET=true npx hardhat run scripts/deploy-mainnet.js --network base
 *
 * Dry run (local Hardhat fork):
 *   npx hardhat run scripts/deploy-mainnet.js
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // ── Preflight checks ──────────────────────────────────────────────
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error("FATAL: DEPLOYER_PRIVATE_KEY env var is not set.");
    console.error("       Export it or add it to .env before deploying.");
    process.exit(1);
  }
  if (!process.env.BASESCAN_API_KEY) {
    console.error("FATAL: BASESCAN_API_KEY env var is not set.");
    console.error("       Required for contract verification on Basescan.");
    process.exit(1);
  }

  const isMainnet = hre.network.name === "base";

  if (isMainnet && process.env.CONFIRM_MAINNET !== "true") {
    console.error("");
    console.error("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("  !!  MAINNET DEPLOYMENT — THIS USES REAL ETH  !!");
    console.error("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("");
    console.error("  Set CONFIRM_MAINNET=true to confirm you understand.");
    console.error("  Example:");
    console.error("    CONFIRM_MAINNET=true npx hardhat run scripts/deploy-mainnet.js --network base");
    console.error("");
    process.exit(1);
  }

  if (isMainnet) {
    console.log("");
    console.log("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("  !!  MAINNET DEPLOYMENT — THIS USES REAL ETH  !!");
    console.log("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("");
  }

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deployer:  ", deployer.address);
  console.log("Balance:   ", hre.ethers.formatEther(balance), "ETH");
  console.log("Network:   ", hre.network.name);
  console.log("");

  if (balance === 0n) {
    console.error("FATAL: No ETH balance. Fund the deployer wallet first.");
    process.exit(1);
  }

  // ── 1. Deploy POHToken ──────────────────────────────────────────────
  console.log("[1/7] Deploying POHToken...");
  const POHToken = await hre.ethers.getContractFactory("POHToken");
  const token = await POHToken.deploy(deployer.address, deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("      POHToken:", tokenAddress);

  // ── 2. Deploy POHCharity ────────────────────────────────────────────
  await sleep(5000);
  console.log("\n[2/7] Deploying POHCharity...");
  const POHCharity = await hre.ethers.getContractFactory("POHCharity");
  const charity = await POHCharity.deploy();
  await charity.waitForDeployment();
  const charityAddress = await charity.getAddress();
  console.log("      POHCharity:", charityAddress);

  // ── 3. Deploy POHVesting ────────────────────────────────────────────
  await sleep(5000);
  const founderAllocation = hre.ethers.parseEther("2452600000"); // 10%
  console.log("\n[3/7] Deploying POHVesting...");
  const POHVesting = await hre.ethers.getContractFactory("POHVesting");
  const vesting = await POHVesting.deploy(tokenAddress, deployer.address, founderAllocation);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("      POHVesting:", vestingAddress);

  // ── 4. Deploy POHRewards ────────────────────────────────────────────
  await sleep(5000);
  console.log("\n[4/7] Deploying POHRewards...");
  const POHRewards = await hre.ethers.getContractFactory("POHRewards");
  const rewards = await POHRewards.deploy(tokenAddress);
  await rewards.waitForDeployment();
  const rewardsAddress = await rewards.getAddress();
  console.log("      POHRewards:", rewardsAddress);

  // ── 5. Deploy POHNodeRegistry ───────────────────────────────────────
  await sleep(5000);
  console.log("\n[5/7] Deploying POHNodeRegistry...");
  const POHNodeRegistry = await hre.ethers.getContractFactory("POHNodeRegistry");
  const registry = await POHNodeRegistry.deploy(tokenAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("      POHNodeRegistry:", registryAddress);

  // ── 6. Deploy TimelockController ────────────────────────────────────
  //   48hr minimum delay. Governor will be added as proposer+executor
  //   after it is deployed. Deployer is admin initially (to grant roles),
  //   then renounces admin.
  await sleep(5000);
  console.log("\n[6/7] Deploying TimelockController...");
  const minDelay = 48 * 60 * 60; // 48 hours in seconds
  const TimelockController = await hre.ethers.getContractFactory("TimelockController");
  // proposers and executors are empty for now — governor added after deploy
  // deployer is admin so we can grant roles to the governor
  const timelock = await TimelockController.deploy(
    minDelay,
    [],            // proposers — added below
    [],            // executors — added below
    deployer.address // admin — will renounce after setup
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("      TimelockController:", timelockAddress);

  // ── 7. Deploy POHGovernor ───────────────────────────────────────────
  await sleep(5000);
  console.log("\n[7/7] Deploying POHGovernor...");
  const POHGovernor = await hre.ethers.getContractFactory("POHGovernor");
  const governor = await POHGovernor.deploy(tokenAddress, timelockAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("      POHGovernor:", governorAddress);

  // ── Configure governance roles ──────────────────────────────────────
  await sleep(5000);
  console.log("\nConfiguring governance roles...");

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

  // Governor is proposer + executor
  let tx = await timelock.grantRole(PROPOSER_ROLE, governorAddress);
  await tx.wait();
  console.log("  Governor granted PROPOSER_ROLE");

  tx = await timelock.grantRole(EXECUTOR_ROLE, governorAddress);
  await tx.wait();
  console.log("  Governor granted EXECUTOR_ROLE");

  // Renounce deployer's admin role — timelock is now self-governing
  tx = await timelock.renounceRole(ADMIN_ROLE, deployer.address);
  await tx.wait();
  console.log("  Deployer renounced ADMIN_ROLE on TimelockController");

  // ── Configure token ─────────────────────────────────────────────────
  await sleep(5000);
  console.log("\nConfiguring POHToken...");

  // Set real charity wallet on token
  tx = await token.setCharityWallet(charityAddress);
  await tx.wait();
  console.log("  Charity wallet set");

  // Exempt contracts from fees and max wallet
  for (const [name, addr] of [
    ["POHVesting", vestingAddress],
    ["POHRewards", rewardsAddress],
    ["POHNodeRegistry", registryAddress],
    ["TimelockController", timelockAddress],
    ["POHGovernor", governorAddress],
  ]) {
    tx = await token.setFeeExempt(addr, true);
    await tx.wait();
    tx = await token.setMaxWalletExempt(addr, true);
    await tx.wait();
    console.log(`  ${name} exempted from fees + max wallet`);
  }

  // Founder needs max-wallet exempt for vesting claims
  tx = await token.setMaxWalletExempt(deployer.address, true);
  await tx.wait();
  console.log("  Deployer exempted from max wallet");

  // ── Distribute tokens ───────────────────────────────────────────────
  console.log("\nDistributing tokens...");

  // 10% to vesting
  tx = await token.transfer(vestingAddress, founderAllocation);
  await tx.wait();
  console.log("  2,452,600,000 POH -> POHVesting (10%)");

  // 20% to charity
  const charityAlloc = hre.ethers.parseEther("4905200000");
  tx = await token.transfer(charityAddress, charityAlloc);
  await tx.wait();
  console.log("  4,905,200,000 POH -> POHCharity (20%)");

  // 50% to rewards
  const communityPool = hre.ethers.parseEther("12263000000");
  tx = await token.transfer(rewardsAddress, communityPool);
  await tx.wait();
  console.log("  12,263,000,000 POH -> POHRewards (50%)");

  // Remaining 20% stays with deployer (15% LP + 5% airdrop)
  const remaining = await token.balanceOf(deployer.address);
  console.log("  Remaining:", hre.ethers.formatEther(remaining), "POH (15% liquidity + 5% airdrop)");

  // ── Transfer POHCharity ownership to TimelockController ─────────────
  await sleep(5000);
  console.log("\nTransferring POHCharity ownership to TimelockController...");
  tx = await charity.transferOwnership(timelockAddress);
  await tx.wait();
  console.log("  POHCharity owner:", timelockAddress);

  // ── Summary ─────────────────────────────────────────────────────────
  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - finalBalance;

  console.log("");
  console.log("================================================================");
  console.log("  PROOF OF PLANET — ALL 7 CONTRACTS DEPLOYED");
  console.log("================================================================");
  console.log("  POHToken:            ", tokenAddress);
  console.log("  POHCharity:          ", charityAddress);
  console.log("  POHVesting:          ", vestingAddress);
  console.log("  POHRewards:          ", rewardsAddress);
  console.log("  POHNodeRegistry:     ", registryAddress);
  console.log("  TimelockController:  ", timelockAddress);
  console.log("  POHGovernor:         ", governorAddress);
  console.log("================================================================");
  console.log("  Network:             ", hre.network.name);
  console.log("  Gas used:            ", hre.ethers.formatEther(gasUsed), "ETH");
  console.log("  Remaining ETH:       ", hre.ethers.formatEther(finalBalance));
  console.log("================================================================");

  // ── Save addresses to deployments/base-mainnet.json ─────────────────
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deployment = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      POHToken: tokenAddress,
      POHCharity: charityAddress,
      POHVesting: vestingAddress,
      POHRewards: rewardsAddress,
      POHNodeRegistry: registryAddress,
      TimelockController: timelockAddress,
      POHGovernor: governorAddress,
    },
    constructorArgs: {
      POHToken: [deployer.address, deployer.address],
      POHCharity: [],
      POHVesting: [tokenAddress, deployer.address, founderAllocation.toString()],
      POHRewards: [tokenAddress],
      POHNodeRegistry: [tokenAddress],
      TimelockController: [minDelay, [], [], deployer.address],
      POHGovernor: [tokenAddress, timelockAddress],
    },
  };

  const deploymentsFile = path.join(deploymentsDir, "base-mainnet.json");
  fs.writeFileSync(deploymentsFile, JSON.stringify(deployment, null, 2) + "\n");
  console.log("\nDeployment saved to:", deploymentsFile);

  // ── Verify on Basescan ──────────────────────────────────────────────
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerifying contracts on Basescan (waiting 30s for indexing)...");
    await sleep(30000);

    const contracts = [
      { name: "POHToken", address: tokenAddress, args: [deployer.address, deployer.address] },
      { name: "POHCharity", address: charityAddress, args: [] },
      { name: "POHVesting", address: vestingAddress, args: [tokenAddress, deployer.address, founderAllocation.toString()] },
      { name: "POHRewards", address: rewardsAddress, args: [tokenAddress] },
      { name: "POHNodeRegistry", address: registryAddress, args: [tokenAddress] },
      { name: "TimelockController", address: timelockAddress, args: [minDelay, [], [], deployer.address] },
      { name: "POHGovernor", address: governorAddress, args: [tokenAddress, timelockAddress] },
    ];

    for (const c of contracts) {
      try {
        await hre.run("verify:verify", {
          address: c.address,
          constructorArguments: c.args,
        });
        console.log(`  ${c.name} verified`);
      } catch (e) {
        console.log(`  ${c.name} — ${e.message.slice(0, 100)}`);
      }
      await sleep(5000); // Rate limit between verification calls
    }
  }

  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
