const hre = require("hardhat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TOKEN = "0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07";
const LEDGER = "0xdB3A72973141BCFCA1A11ABAf7A03E62495FbaD0";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address);

  console.log("Deployer:", deployer.address);
  console.log("Nonce:", nonce);
  console.log("");

  const token = await hre.ethers.getContractAt("POHToken", TOKEN);

  // ── Pre-flight checks ──
  console.log("=== PRE-FLIGHT CHECKS ===");

  const currentLiqWallet = await token.liquidityWallet();
  console.log("Current liquidity wallet:", currentLiqWallet);

  if (currentLiqWallet.toLowerCase() === LEDGER.toLowerCase()) {
    console.log("Liquidity wallet is ALREADY set to Ledger. Nothing to do.");
    return;
  }

  const currentCharityWallet = await token.charityWallet();
  console.log("Current charity wallet:", currentCharityWallet);

  const owner = await token.owner();
  console.log("Token owner:", owner);

  // Check balances
  const deployerBalance = await token.balanceOf(deployer.address);
  const ledgerBalance = await token.balanceOf(LEDGER);
  const liqWalletBalance = await token.balanceOf(currentLiqWallet);
  console.log("Deployer POH balance:", hre.ethers.formatEther(deployerBalance));
  console.log("Ledger POH balance:", hre.ethers.formatEther(ledgerBalance));
  console.log("Current liq wallet POH balance:", hre.ethers.formatEther(liqWalletBalance));

  // Check current exemption status
  const deployerFeeExempt = await token.isFeeExempt(deployer.address);
  const deployerMaxWalletExempt = await token.isMaxWalletExempt(deployer.address);
  const ledgerFeeExempt = await token.isFeeExempt(LEDGER);
  const ledgerMaxWalletExempt = await token.isMaxWalletExempt(LEDGER);
  console.log("");
  console.log("Deployer fee exempt:", deployerFeeExempt);
  console.log("Deployer max wallet exempt:", deployerMaxWalletExempt);
  console.log("Ledger fee exempt:", ledgerFeeExempt);
  console.log("Ledger max wallet exempt:", ledgerMaxWalletExempt);

  const ethBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer ETH balance:", hre.ethers.formatEther(ethBalance), "ETH");
  console.log("");

  // ── Execute: Change liquidity wallet ──
  console.log("=== CHANGING LIQUIDITY WALLET ===");
  console.log(`  From: ${currentLiqWallet}`);
  console.log(`  To:   ${LEDGER}`);
  console.log("");

  console.log("1/3 Calling setLiquidityWallet()...");
  let tx = await token.setLiquidityWallet(LEDGER, { nonce: nonce++ });
  console.log("    tx:", tx.hash);
  await tx.wait();
  await sleep(5000);
  console.log("    Confirmed.");

  // setLiquidityWallet removes fee+maxWallet exemptions from the OLD wallet.
  // The deployer is still the owner and should stay exempt as a safety measure.
  console.log("2/3 Re-exempting deployer from fees (removed by setLiquidityWallet)...");
  tx = await token.setFeeExempt(deployer.address, true, { nonce: nonce++ });
  console.log("    tx:", tx.hash);
  await tx.wait();
  await sleep(5000);
  console.log("    Confirmed.");

  console.log("3/3 Re-exempting deployer from max wallet...");
  tx = await token.setMaxWalletExempt(deployer.address, true, { nonce: nonce++ });
  console.log("    tx:", tx.hash);
  await tx.wait();
  await sleep(5000);
  console.log("    Confirmed.");

  // ── Post-flight verification ──
  console.log("");
  console.log("=== POST-FLIGHT VERIFICATION ===");

  const newLiqWallet = await token.liquidityWallet();
  const deployerFeeExemptAfter = await token.isFeeExempt(deployer.address);
  const deployerMaxWalletExemptAfter = await token.isMaxWalletExempt(deployer.address);
  const ledgerFeeExemptAfter = await token.isFeeExempt(LEDGER);
  const ledgerMaxWalletExemptAfter = await token.isMaxWalletExempt(LEDGER);

  const allGood =
    newLiqWallet.toLowerCase() === LEDGER.toLowerCase() &&
    deployerFeeExemptAfter &&
    deployerMaxWalletExemptAfter &&
    ledgerFeeExemptAfter &&
    ledgerMaxWalletExemptAfter;

  console.log("Liquidity wallet:", newLiqWallet, newLiqWallet.toLowerCase() === LEDGER.toLowerCase() ? "OK" : "FAIL");
  console.log("Deployer fee exempt:", deployerFeeExemptAfter, deployerFeeExemptAfter ? "OK" : "FAIL");
  console.log("Deployer max wallet exempt:", deployerMaxWalletExemptAfter, deployerMaxWalletExemptAfter ? "OK" : "FAIL");
  console.log("Ledger fee exempt:", ledgerFeeExemptAfter, ledgerFeeExemptAfter ? "OK" : "FAIL");
  console.log("Ledger max wallet exempt:", ledgerMaxWalletExemptAfter, ledgerMaxWalletExemptAfter ? "OK" : "FAIL");

  const finalEth = await hre.ethers.provider.getBalance(deployer.address);
  const gasUsed = ethBalance - finalEth;

  console.log("");
  console.log("================================================================");
  if (allGood) {
    console.log("  LIQUIDITY WALLET UPDATED SUCCESSFULLY");
  } else {
    console.log("  WARNING: SOME CHECKS FAILED — REVIEW ABOVE");
  }
  console.log("================================================================");
  console.log("  Old liquidity wallet:", currentLiqWallet);
  console.log("  New liquidity wallet:", LEDGER);
  console.log("  Gas used:", hre.ethers.formatEther(gasUsed), "ETH");
  console.log("  Remaining ETH:", hre.ethers.formatEther(finalEth));
  console.log("================================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
