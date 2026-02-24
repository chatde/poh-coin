const hre = require("hardhat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CONTRACTS = {
  token: "0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07",
  charity: "0xf9eDc5CF986ea637E724E078DA01AbD7c4957D49",
  vesting: "0xFfce548EbF097F630A272aA577E750A0Bc1308dd",
  rewards: "0xa7904Cb5f3D6a937Db06453e3d95db4f0C3236dF",
  registry: "0x8137a04a50C058b00d9ee44D25b9Ef1ba900D15F",
  timelock: "0x64981B544a20d6933466c363dD175cA1FaD96Bb6",
  governor: "0x7C96Ed675033F15a53557f1d0190e00B19522e6e",
};

// Send transaction with explicit nonce and wait for confirmation
async function sendTx(contract, method, args, nonce) {
  const tx = await contract[method](...args, { nonce });
  console.log(`    tx: ${tx.hash} (nonce ${nonce})`);
  await tx.wait();
  await sleep(5000); // Wait 5s between txs to avoid nonce issues
  return nonce + 1;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("");

  const token = await hre.ethers.getContractAt("POHToken", CONTRACTS.token);
  const charity = await hre.ethers.getContractAt("POHCharity", CONTRACTS.charity);

  // Get current nonce
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address);
  console.log("Starting nonce:", nonce);
  console.log("");

  // ── Fee + max wallet exemptions ──
  const exemptions = [
    ["POHVesting", CONTRACTS.vesting],
    ["POHRewards", CONTRACTS.rewards],
    ["POHNodeRegistry", CONTRACTS.registry],
    ["TimelockController", CONTRACTS.timelock],
    ["POHGovernor", CONTRACTS.governor],
  ];

  for (const [name, addr] of exemptions) {
    console.log(`Exempting ${name}...`);
    nonce = await sendTx(token, "setFeeExempt", [addr, true], nonce);
    nonce = await sendTx(token, "setMaxWalletExempt", [addr, true], nonce);
    console.log(`  ${name} done`);
  }

  // Deployer max wallet exempt
  console.log("Exempting deployer from max wallet...");
  nonce = await sendTx(token, "setMaxWalletExempt", [deployer.address, true], nonce);
  console.log("  Done");

  // ── Token distributions ──
  const vestingBalance = await token.balanceOf(CONTRACTS.vesting);

  if (vestingBalance === 0n) {
    console.log("\nDistributing tokens...");

    const founderAllocation = hre.ethers.parseEther("2452600000");
    nonce = await sendTx(token, "transfer", [CONTRACTS.vesting, founderAllocation], nonce);
    console.log("  2,452,600,000 POH -> POHVesting (10%)");

    const charityAlloc = hre.ethers.parseEther("4905200000");
    nonce = await sendTx(token, "transfer", [CONTRACTS.charity, charityAlloc], nonce);
    console.log("  4,905,200,000 POH -> POHCharity (20%)");

    const communityPool = hre.ethers.parseEther("12263000000");
    nonce = await sendTx(token, "transfer", [CONTRACTS.rewards, communityPool], nonce);
    console.log("  12,263,000,000 POH -> POHRewards (50%)");

    const remaining = await token.balanceOf(deployer.address);
    console.log("  Remaining:", hre.ethers.formatEther(remaining), "POH");
  } else {
    console.log("\nTokens already distributed — skipping");
  }

  // ── Transfer POHCharity ownership to TimelockController ──
  const charityOwner = await charity.owner();
  if (charityOwner.toLowerCase() !== CONTRACTS.timelock.toLowerCase()) {
    console.log("\nTransferring POHCharity ownership to TimelockController...");
    nonce = await sendTx(charity, "transferOwnership", [CONTRACTS.timelock], nonce);
    console.log("  Done");
  } else {
    console.log("\nPOHCharity ownership already transferred — skipping");
  }

  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("\n================================================================");
  console.log("  CONFIGURATION COMPLETE");
  console.log("================================================================");
  console.log("  Remaining ETH:", hre.ethers.formatEther(finalBalance));
  console.log("================================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
