const hre = require("hardhat");

/**
 * Deploy ALL contracts — POHToken, POHCharity, POHVesting, POHRewards, POHNodeRegistry
 *
 * Usage:
 *   npx hardhat run scripts/deploy-all.js --network baseSepolia
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("ERROR: No ETH balance. Fund wallet first.");
    process.exit(1);
  }

  // ── 1. Deploy POHToken ────────────────────────────────────────────
  console.log("\n[1/5] Deploying POHToken...");
  const POHToken = await hre.ethers.getContractFactory("POHToken");
  const token = await POHToken.deploy(deployer.address, deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("       POHToken:", tokenAddress);

  // ── 2. Deploy POHCharity ──────────────────────────────────────────
  await sleep(5000);
  console.log("\n[2/5] Deploying POHCharity...");
  const POHCharity = await hre.ethers.getContractFactory("POHCharity");
  const charity = await POHCharity.deploy();
  await charity.waitForDeployment();
  const charityAddress = await charity.getAddress();
  console.log("       POHCharity:", charityAddress);

  // ── 3. Deploy POHVesting ──────────────────────────────────────────
  await sleep(5000);
  const founderAllocation = hre.ethers.parseEther("2452600000"); // 10%
  console.log("\n[3/5] Deploying POHVesting...");
  const POHVesting = await hre.ethers.getContractFactory("POHVesting");
  const vesting = await POHVesting.deploy(tokenAddress, deployer.address, founderAllocation);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("       POHVesting:", vestingAddress);

  // ── 4. Deploy POHRewards ──────────────────────────────────────────
  await sleep(5000);
  console.log("\n[4/5] Deploying POHRewards...");
  const POHRewards = await hre.ethers.getContractFactory("POHRewards");
  const rewards = await POHRewards.deploy(tokenAddress);
  await rewards.waitForDeployment();
  const rewardsAddress = await rewards.getAddress();
  console.log("       POHRewards:", rewardsAddress);

  // ── 5. Deploy POHNodeRegistry ─────────────────────────────────────
  await sleep(5000);
  console.log("\n[5/5] Deploying POHNodeRegistry...");
  const POHNodeRegistry = await hre.ethers.getContractFactory("POHNodeRegistry");
  const registry = await POHNodeRegistry.deploy(tokenAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("       POHNodeRegistry:", registryAddress);

  // ── Configure ─────────────────────────────────────────────────────
  await sleep(5000);
  console.log("\nConfiguring...");

  // Set real charity wallet on token
  let tx = await token.setCharityWallet(charityAddress);
  await tx.wait();
  console.log("  Charity wallet set");

  // Exempt contracts from fees and max wallet
  for (const [name, addr] of [
    ["POHVesting", vestingAddress],
    ["POHRewards", rewardsAddress],
    ["POHNodeRegistry", registryAddress],
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

  // ── Distribute tokens ─────────────────────────────────────────────
  console.log("\nDistributing tokens...");

  // 10% to vesting
  tx = await token.transfer(vestingAddress, founderAllocation);
  await tx.wait();
  console.log("  2,452,600,000 POH → POHVesting (10%)");

  // 20% to charity
  const charityAlloc = hre.ethers.parseEther("4905200000");
  tx = await token.transfer(charityAddress, charityAlloc);
  await tx.wait();
  console.log("  4,905,200,000 POH → POHCharity (20%)");

  // 50% to rewards
  const communityPool = hre.ethers.parseEther("12263000000");
  tx = await token.transfer(rewardsAddress, communityPool);
  await tx.wait();
  console.log("  12,263,000,000 POH → POHRewards (50%)");

  const remaining = await token.balanceOf(deployer.address);
  console.log("  Remaining:", hre.ethers.formatEther(remaining), "POH (15% liquidity + 5% airdrop)");

  // ── Summary ───────────────────────────────────────────────────────
  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - finalBalance;

  console.log("\n════════════════════════════════════════════════════");
  console.log("  PROOF OF PLANET — ALL CONTRACTS DEPLOYED");
  console.log("════════════════════════════════════════════════════");
  console.log("  POHToken:        ", tokenAddress);
  console.log("  POHCharity:      ", charityAddress);
  console.log("  POHVesting:      ", vestingAddress);
  console.log("  POHRewards:      ", rewardsAddress);
  console.log("  POHNodeRegistry: ", registryAddress);
  console.log("════════════════════════════════════════════════════");
  console.log("  Network:         ", hre.network.name);
  console.log("  Gas used:        ", hre.ethers.formatEther(gasUsed), "ETH");
  console.log("  Remaining ETH:   ", hre.ethers.formatEther(finalBalance));
  console.log("════════════════════════════════════════════════════");

  // ── Verify on Basescan ────────────────────────────────────────────
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerifying contracts on Basescan...");

    const contracts = [
      { name: "POHToken", address: tokenAddress, args: [deployer.address, deployer.address] },
      { name: "POHCharity", address: charityAddress, args: [] },
      { name: "POHVesting", address: vestingAddress, args: [tokenAddress, deployer.address, founderAllocation.toString()] },
      { name: "POHRewards", address: rewardsAddress, args: [tokenAddress] },
      { name: "POHNodeRegistry", address: registryAddress, args: [tokenAddress] },
    ];

    for (const c of contracts) {
      try {
        await hre.run("verify:verify", {
          address: c.address,
          constructorArguments: c.args,
        });
        console.log(`  ${c.name} ✓ verified`);
      } catch (e) {
        console.log(`  ${c.name} — ${e.message.slice(0, 80)}`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
