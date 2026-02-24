const hre = require("hardhat");

const TOKEN = "0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07";
const LEDGER = "0xdB3A72973141BCFCA1A11ABAf7A03E62495FbaD0";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const token = await hre.ethers.getContractAt("POHToken", TOKEN);
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address);

  console.log("Deployer:", deployer.address);
  console.log("Ledger:", LEDGER);
  console.log("Starting nonce:", nonce);

  // Check balances
  const deployerBalance = await token.balanceOf(deployer.address);
  const ledgerBefore = await token.balanceOf(LEDGER);
  console.log("\nDeployer POH:", hre.ethers.formatEther(deployerBalance));
  console.log("Ledger POH:", hre.ethers.formatEther(ledgerBefore));

  if (deployerBalance === 0n) {
    console.log("\nNo POH to transfer.");
    return;
  }

  // Re-exempt deployer from fees (was cleared at some point)
  const deployerFeeExempt = await token.isFeeExempt(deployer.address);
  if (!deployerFeeExempt) {
    console.log("\n1. Re-exempting deployer from fees...");
    const tx0 = await token.setFeeExempt(deployer.address, true, { nonce: nonce++ });
    await tx0.wait();
    console.log("   Done");
  }

  // Transfer ALL remaining POH to Ledger
  console.log(`\n2. Transferring ${hre.ethers.formatEther(deployerBalance)} POH to Ledger...`);
  const tx = await token.transfer(LEDGER, deployerBalance, { nonce: nonce++ });
  const receipt = await tx.wait();
  console.log("   Tx hash:", receipt.hash);

  // Verify
  const deployerAfter = await token.balanceOf(deployer.address);
  const ledgerAfter = await token.balanceOf(LEDGER);
  console.log("\nFinal deployer POH:", hre.ethers.formatEther(deployerAfter));
  console.log("Final Ledger POH:", hre.ethers.formatEther(ledgerAfter));
  console.log("\nAll POH secured on Ledger.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
