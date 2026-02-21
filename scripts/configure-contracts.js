const hre = require("hardhat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// All deployed contract addresses on Base Sepolia
const ADDRESSES = {
  token:    "0xe75DC31C1D4F1f8b1160e84a6B3228115d1135a2",
  charity:  "0x31a3D6d28fEFfc177F9d099a4491A4E3cE8fA7E6",
  vesting:  "0x5112A61F036fE79C0D15a779269B6558dC70C1a7",
  rewards:  "0x136EB82Ce350a7f391DC02223a878A8FcA4028Fe",
  registry: "0x6413393Ec4c594F0a9ce9c1B5d2056B4B309E0e6",
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  const token = await hre.ethers.getContractAt("POHToken", ADDRESSES.token);

  // Check current state
  const currentCharity = await token.charityWallet();
  console.log("\nCurrent charity wallet:", currentCharity);

  // ── Configure ─────────────────────────────────────────────────────
  console.log("\nConfiguring token exemptions...");

  // Set charity wallet if not already set
  if (currentCharity.toLowerCase() !== ADDRESSES.charity.toLowerCase()) {
    let tx = await token.setCharityWallet(ADDRESSES.charity);
    await tx.wait(1);
    console.log("  Charity wallet set");
    await sleep(3000);
  } else {
    console.log("  Charity wallet already set ✓");
  }

  // Exempt each contract
  for (const [name, addr] of [
    ["POHVesting", ADDRESSES.vesting],
    ["POHRewards", ADDRESSES.rewards],
    ["POHNodeRegistry", ADDRESSES.registry],
  ]) {
    try {
      const isExempt = await token.isFeeExempt(addr);
      if (isExempt) {
        console.log(`  ${name} already exempt ✓`);
        continue;
      }
    } catch { /* view function might not exist, proceed */ }

    let tx = await token.setFeeExempt(addr, true);
    await tx.wait(1);
    await sleep(2000);

    tx = await token.setMaxWalletExempt(addr, true);
    await tx.wait(1);
    await sleep(2000);

    console.log(`  ${name} exempted from fees + max wallet`);
  }

  // Deployer max-wallet exempt
  try {
    let tx = await token.setMaxWalletExempt(deployer.address, true);
    await tx.wait(1);
    console.log("  Deployer max-wallet exempt");
    await sleep(2000);
  } catch (e) {
    console.log("  Deployer exempt:", e.message.slice(0, 60));
  }

  // ── Distribute tokens ─────────────────────────────────────────────
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log("\nDeployer POH balance:", hre.ethers.formatEther(deployerBalance));

  const totalSupply = await token.totalSupply();
  console.log("Total supply:", hre.ethers.formatEther(totalSupply));

  // Only distribute if deployer still holds most supply
  if (deployerBalance > hre.ethers.parseEther("20000000000")) {
    console.log("\nDistributing tokens...");

    const founderAllocation = hre.ethers.parseEther("2452600000");
    let tx = await token.transfer(ADDRESSES.vesting, founderAllocation);
    await tx.wait(1);
    console.log("  10% → POHVesting");
    await sleep(2000);

    tx = await token.transfer(ADDRESSES.charity, hre.ethers.parseEther("4905200000"));
    await tx.wait(1);
    console.log("  20% → POHCharity");
    await sleep(2000);

    tx = await token.transfer(ADDRESSES.rewards, hre.ethers.parseEther("12263000000"));
    await tx.wait(1);
    console.log("  50% → POHRewards");
  } else {
    console.log("  Tokens appear already distributed or deployer balance low");
  }

  // ── Final state ───────────────────────────────────────────────────
  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
  const rewardsBalance = await token.balanceOf(ADDRESSES.rewards);

  console.log("\n════════════════════════════════════════════════════");
  console.log("  CONFIGURATION COMPLETE");
  console.log("════════════════════════════════════════════════════");
  console.log("  POHToken:        ", ADDRESSES.token);
  console.log("  POHCharity:      ", ADDRESSES.charity);
  console.log("  POHVesting:      ", ADDRESSES.vesting);
  console.log("  POHRewards:      ", ADDRESSES.rewards);
  console.log("  POHNodeRegistry: ", ADDRESSES.registry);
  console.log("  Rewards pool:    ", hre.ethers.formatEther(rewardsBalance), "POH");
  console.log("  Remaining ETH:   ", hre.ethers.formatEther(finalBalance));
  console.log("════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
