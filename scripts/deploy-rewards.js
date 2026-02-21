const hre = require("hardhat");

/**
 * Deploy POHRewards + POHNodeRegistry — Proof of Planet Phase A
 *
 * Prerequisites:
 *   - POHToken already deployed (address needed)
 *   - Deployer has Community Rewards tokens (50% of supply) to fund POHRewards
 *
 * Usage:
 *   npx hardhat run scripts/deploy-rewards.js --network baseSepolia
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // ── POHToken address (update after initial deployment) ──────────────
  // On testnet/mainnet, replace with actual deployed POHToken address
  const TOKEN_ADDRESS = process.env.POH_TOKEN_ADDRESS || "";

  let tokenAddress;
  let token;

  if (TOKEN_ADDRESS) {
    // Use existing deployed token
    tokenAddress = TOKEN_ADDRESS;
    token = await hre.ethers.getContractAt("POHToken", tokenAddress);
    console.log("\nUsing existing POHToken at:", tokenAddress);
  } else {
    // Deploy fresh token for testing (local network)
    console.log("\nNo POH_TOKEN_ADDRESS set — deploying fresh POHToken for testing...");
    const POHToken = await hre.ethers.getContractFactory("POHToken");
    token = await POHToken.deploy(deployer.address, deployer.address);
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
    console.log("  POHToken deployed to:", tokenAddress);
  }

  // ── 1. Deploy POHRewards ────────────────────────────────────────────
  console.log("\n1. Deploying POHRewards...");
  const POHRewards = await hre.ethers.getContractFactory("POHRewards");
  const rewards = await POHRewards.deploy(tokenAddress);
  await rewards.waitForDeployment();
  const rewardsAddress = await rewards.getAddress();
  console.log("   POHRewards deployed to:", rewardsAddress);

  // ── 2. Deploy POHNodeRegistry ───────────────────────────────────────
  console.log("\n2. Deploying POHNodeRegistry...");
  const POHNodeRegistry = await hre.ethers.getContractFactory("POHNodeRegistry");
  const registry = await POHNodeRegistry.deploy(tokenAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("   POHNodeRegistry deployed to:", registryAddress);

  // ── 3. Configure POHToken exemptions ────────────────────────────────
  console.log("\n3. Configuring exemptions...");

  // POHRewards needs to be fee-exempt and max-wallet-exempt (holds 50% of supply)
  await token.setFeeExempt(rewardsAddress, true);
  await token.setMaxWalletExempt(rewardsAddress, true);
  console.log("   POHRewards exempted from fees and max wallet");

  // POHNodeRegistry needs to be fee-exempt and max-wallet-exempt (holds staked tokens)
  await token.setFeeExempt(registryAddress, true);
  await token.setMaxWalletExempt(registryAddress, true);
  console.log("   POHNodeRegistry exempted from fees and max wallet");

  // ── 4. Fund POHRewards with Community Rewards pool ──────────────────
  const communityPool = hre.ethers.parseEther("12263000000"); // 50% of 24.526B
  const deployerBalance = await token.balanceOf(deployer.address);

  if (deployerBalance >= communityPool) {
    console.log("\n4. Funding POHRewards with Community Rewards pool...");
    await token.transfer(rewardsAddress, communityPool);
    console.log("   Sent 12,263,000,000 POH to POHRewards");
  } else {
    console.log("\n4. SKIPPED: Deployer balance too low to fund full community pool.");
    console.log("   Deployer balance:", hre.ethers.formatEther(deployerBalance), "POH");
    console.log("   Required:        12,263,000,000 POH");
    console.log("   Fund manually:   token.transfer(rewardsAddress, amount)");
  }

  // ── Summary ─────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════");
  console.log("  PROOF OF PLANET — PHASE A DEPLOYED");
  console.log("════════════════════════════════════════════");
  console.log("  POHToken:        ", tokenAddress);
  console.log("  POHRewards:      ", rewardsAddress);
  console.log("  POHNodeRegistry: ", registryAddress);
  console.log("════════════════════════════════════════════");
  console.log("\nRewards balance:", hre.ethers.formatEther(await rewards.rewardsRemaining()), "POH");
  console.log("\nNext steps:");
  console.log("  1. Verify contracts on Basescan");
  console.log("  2. Backend: compute weekly merkle trees → call setMerkleRoot()");
  console.log("  3. Users: register nodes → submit proofs → claim rewards");
  console.log("  4. Schools: register school nodes for higher caps");

  // ── Verify contracts (if on a real network) ─────────────────────────
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerifying contracts on Basescan...");

    try {
      await hre.run("verify:verify", {
        address: rewardsAddress,
        constructorArguments: [tokenAddress],
      });
      console.log("   POHRewards verified");
    } catch (e) {
      console.log("   POHRewards verification:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: registryAddress,
        constructorArguments: [tokenAddress],
      });
      console.log("   POHNodeRegistry verified");
    } catch (e) {
      console.log("   POHNodeRegistry verification:", e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
