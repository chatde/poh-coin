const hre = require("hardhat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// POHToken already deployed
const TOKEN_ADDRESS = "0xe75DC31C1D4F1f8b1160e84a6B3228115d1135a2";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("Using POHToken:", TOKEN_ADDRESS);

  const token = await hre.ethers.getContractAt("POHToken", TOKEN_ADDRESS);

  // ── 2. Deploy POHCharity ──────────────────────────────────────────
  console.log("\n[2/5] Deploying POHCharity...");
  const POHCharity = await hre.ethers.getContractFactory("POHCharity");
  const charity = await POHCharity.deploy();
  await charity.waitForDeployment();
  const charityAddress = await charity.getAddress();
  console.log("       POHCharity:", charityAddress);

  await sleep(5000);

  // ── 3. Deploy POHVesting ──────────────────────────────────────────
  const founderAllocation = hre.ethers.parseEther("2452600000");
  console.log("\n[3/5] Deploying POHVesting...");
  const POHVesting = await hre.ethers.getContractFactory("POHVesting");
  const vesting = await POHVesting.deploy(TOKEN_ADDRESS, deployer.address, founderAllocation);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("       POHVesting:", vestingAddress);

  await sleep(5000);

  // ── 4. Deploy POHRewards ──────────────────────────────────────────
  console.log("\n[4/5] Deploying POHRewards...");
  const POHRewards = await hre.ethers.getContractFactory("POHRewards");
  const rewards = await POHRewards.deploy(TOKEN_ADDRESS);
  await rewards.waitForDeployment();
  const rewardsAddress = await rewards.getAddress();
  console.log("       POHRewards:", rewardsAddress);

  await sleep(5000);

  // ── 5. Deploy POHNodeRegistry ─────────────────────────────────────
  console.log("\n[5/5] Deploying POHNodeRegistry...");
  const POHNodeRegistry = await hre.ethers.getContractFactory("POHNodeRegistry");
  const registry = await POHNodeRegistry.deploy(TOKEN_ADDRESS);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("       POHNodeRegistry:", registryAddress);

  await sleep(5000);

  // ── Configure ─────────────────────────────────────────────────────
  console.log("\nConfiguring...");

  let tx = await token.setCharityWallet(charityAddress);
  await tx.wait();
  console.log("  Charity wallet set");

  for (const [name, addr] of [
    ["POHVesting", vestingAddress],
    ["POHRewards", rewardsAddress],
    ["POHNodeRegistry", registryAddress],
  ]) {
    tx = await token.setFeeExempt(addr, true);
    await tx.wait();
    tx = await token.setMaxWalletExempt(addr, true);
    await tx.wait();
    console.log(`  ${name} exempted`);
  }

  tx = await token.setMaxWalletExempt(deployer.address, true);
  await tx.wait();
  console.log("  Deployer max-wallet exempt");

  // ── Distribute ────────────────────────────────────────────────────
  console.log("\nDistributing...");

  tx = await token.transfer(vestingAddress, founderAllocation);
  await tx.wait();
  console.log("  10% → POHVesting");

  tx = await token.transfer(charityAddress, hre.ethers.parseEther("4905200000"));
  await tx.wait();
  console.log("  20% → POHCharity");

  tx = await token.transfer(rewardsAddress, hre.ethers.parseEther("12263000000"));
  await tx.wait();
  console.log("  50% → POHRewards");

  const remaining = await token.balanceOf(deployer.address);
  console.log("  Remaining:", hre.ethers.formatEther(remaining), "POH");

  // ── Summary ───────────────────────────────────────────────────────
  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("\n════════════════════════════════════════════════════");
  console.log("  PROOF OF PLANET — ALL CONTRACTS DEPLOYED");
  console.log("════════════════════════════════════════════════════");
  console.log("  POHToken:        ", TOKEN_ADDRESS);
  console.log("  POHCharity:      ", charityAddress);
  console.log("  POHVesting:      ", vestingAddress);
  console.log("  POHRewards:      ", rewardsAddress);
  console.log("  POHNodeRegistry: ", registryAddress);
  console.log("════════════════════════════════════════════════════");
  console.log("  Remaining ETH:   ", hre.ethers.formatEther(finalBalance));
  console.log("════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
