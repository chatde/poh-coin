const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // ── Allocation addresses ──────────────────────────────────────────
  // IMPORTANT: Replace these with real addresses before mainnet deployment!
  const charityWallet = deployer.address;    // Placeholder — replace with POHCharity address after deploy
  const liquidityWallet = deployer.address;  // Placeholder — replace with actual LP wallet

  // ── 1. Deploy POHToken ────────────────────────────────────────────
  console.log("\n1. Deploying POHToken...");
  const POHToken = await hre.ethers.getContractFactory("POHToken");
  const token = await POHToken.deploy(charityWallet, liquidityWallet);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("   POHToken deployed to:", tokenAddress);

  // ── 2. Deploy POHCharity ──────────────────────────────────────────
  console.log("\n2. Deploying POHCharity...");
  const POHCharity = await hre.ethers.getContractFactory("POHCharity");
  const charity = await POHCharity.deploy();
  await charity.waitForDeployment();
  const charityAddress = await charity.getAddress();
  console.log("   POHCharity deployed to:", charityAddress);

  // ── 3. Deploy POHVesting (10% = 2,452,600,000 tokens) ────────────
  const founderAllocation = hre.ethers.parseEther("2452600000"); // 10% of 24.526B
  console.log("\n3. Deploying POHVesting...");
  const POHVesting = await hre.ethers.getContractFactory("POHVesting");
  const vesting = await POHVesting.deploy(tokenAddress, deployer.address, founderAllocation);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("   POHVesting deployed to:", vestingAddress);

  // ── 4. Configure POHToken ─────────────────────────────────────────
  console.log("\n4. Configuring POHToken...");

  // Set real charity wallet
  await token.setCharityWallet(charityAddress);
  console.log("   Charity wallet set to:", charityAddress);

  // Exempt vesting contract from fees and max wallet
  await token.setFeeExempt(vestingAddress, true);
  await token.setMaxWalletExempt(vestingAddress, true);
  console.log("   Vesting contract exempted from fees and max wallet");

  // Founder (beneficiary) must be max-wallet exempt to receive vested 10%
  await token.setMaxWalletExempt(deployer.address, true);
  console.log("   Founder wallet exempted from max wallet (for vesting claims)");

  // ── 5. Distribute tokens ──────────────────────────────────────────
  console.log("\n5. Distributing tokens...");
  const totalSupply = hre.ethers.parseEther("24526000000");

  // Founder vesting: 10%
  await token.transfer(vestingAddress, founderAllocation);
  console.log("   Sent 2,452,600,000 POH to vesting contract");

  // Charity treasury: 20%
  const charityAllocation = hre.ethers.parseEther("4905200000");
  await token.transfer(charityAddress, charityAllocation);
  console.log("   Sent 4,905,200,000 POH to charity treasury");

  // Remaining in deployer wallet:
  // - Community Rewards (50%): 12,263,000,000
  // - Liquidity Pool (15%):     3,678,900,000
  // - Airdrop/Marketing (5%):   1,226,300,000
  // These stay with deployer for manual distribution
  const remaining = await token.balanceOf(deployer.address);
  console.log("   Remaining with deployer:", hre.ethers.formatEther(remaining), "POH");
  console.log("   (For: community rewards 50%, liquidity 15%, airdrops 5%)");

  // ── Summary ───────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("════════════════════════════════════════════");
  console.log("  POHToken:   ", tokenAddress);
  console.log("  POHCharity: ", charityAddress);
  console.log("  POHVesting: ", vestingAddress);
  console.log("════════════════════════════════════════════");
  console.log("\nNext steps:");
  console.log("  1. Verify contracts on Basescan");
  console.log("  2. Set AMM pair:  token.setAutomatedMarketMaker(PAIR_ADDRESS, true)");
  console.log("  3. Set liquidity wallet: token.setLiquidityWallet(LP_WALLET)");
  console.log("  4. Create Uniswap V3 pool with 15% allocation");
  console.log("  5. Burn LP tokens for permanent liquidity lock");

  // ── Verify contracts (if on a real network) ───────────────────────
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerifying contracts on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [charityWallet, liquidityWallet],
      });
      console.log("   POHToken verified");
    } catch (e) {
      console.log("   POHToken verification failed:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: charityAddress,
        constructorArguments: [],
      });
      console.log("   POHCharity verified");
    } catch (e) {
      console.log("   POHCharity verification failed:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: vestingAddress,
        constructorArguments: [tokenAddress, deployer.address, founderAllocation.toString()],
      });
      console.log("   POHVesting verified");
    } catch (e) {
      console.log("   POHVesting verification failed:", e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
