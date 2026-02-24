const hre = require("hardhat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TOKEN = "0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07";
const LEDGER = "0xdB3A72973141BCFCA1A11ABAf7A03E62495FbaD0";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address);

  console.log("Deployer:", deployer.address);
  console.log("Ledger:", LEDGER);
  console.log("Nonce:", nonce);

  const token = await hre.ethers.getContractAt("POHToken", TOKEN);

  // Check deployer POH balance
  const balance = await token.balanceOf(deployer.address);
  console.log("\nDeployer POH balance:", hre.ethers.formatEther(balance));

  // Step 1: Exempt Ledger from max wallet
  console.log("\n1. Exempting Ledger from max wallet limit...");
  let tx = await token.setMaxWalletExempt(LEDGER, true, { nonce: nonce++ });
  await tx.wait();
  await sleep(5000);
  console.log("   Done — Ledger can hold unlimited POH");

  // Step 2: Test send — 1000 POH
  const testAmount = hre.ethers.parseEther("1000");
  console.log("\n2. Sending 1,000 POH to Ledger (test)...");
  tx = await token.transfer(LEDGER, testAmount, { nonce: nonce++ });
  const receipt = await tx.wait();
  console.log("   Tx hash:", receipt.hash);

  // Check balances
  const ledgerBalance = await token.balanceOf(LEDGER);
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log("\n   Ledger POH balance:", hre.ethers.formatEther(ledgerBalance));
  console.log("   Deployer POH balance:", hre.ethers.formatEther(deployerBalance));
  console.log("   (0.5% transfer fee = 5 POH went to charity)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
