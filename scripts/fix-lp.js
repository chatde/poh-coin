const hre = require("hardhat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TOKEN = "0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07";
const POOL = "0x29A160A9C535F1460146d7DF19d49f9ae1eb2FbD";
const POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
const WETH = "0x4200000000000000000000000000000000000006";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address);

  console.log("Deployer:", deployer.address);
  console.log("Nonce:", nonce);

  const token = await hre.ethers.getContractAt("POHToken", TOKEN);

  // Check current settings
  const maxTx = await token.maxTx();
  const maxWallet = await token.maxWallet();
  const totalSupply = await token.totalSupply();
  console.log("Max Tx:", hre.ethers.formatEther(maxTx), "POH");
  console.log("Max Wallet:", hre.ethers.formatEther(maxWallet), "POH");
  console.log("Total Supply:", hre.ethers.formatEther(totalSupply), "POH");

  // Exempt pool from fees + max wallet
  console.log("\nExempting pool from fees + max wallet...");
  let tx = await token.setFeeExempt(POOL, true, { nonce: nonce++ });
  await tx.wait();
  await sleep(5000);
  tx = await token.setMaxWalletExempt(POOL, true, { nonce: nonce++ });
  await tx.wait();
  await sleep(5000);
  console.log("  Pool exempted");

  // Exempt position manager from fees + max wallet
  console.log("Exempting PositionManager from fees + max wallet...");
  tx = await token.setFeeExempt(POSITION_MANAGER, true, { nonce: nonce++ });
  await tx.wait();
  await sleep(5000);
  tx = await token.setMaxWalletExempt(POSITION_MANAGER, true, { nonce: nonce++ });
  await tx.wait();
  await sleep(5000);
  console.log("  PositionManager exempted");

  // Mark pool as AMM pair (enables buy/sell fee detection)
  console.log("Setting pool as AMM pair...");
  tx = await token.setAutomatedMarketMaker(POOL, true, { nonce: nonce++ });
  await tx.wait();
  await sleep(5000);
  console.log("  Pool set as AMM");

  // Now retry adding liquidity
  console.log("\nRetrying liquidity add...");

  const POSITION_MANAGER_ABI = [
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  ];

  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
  ];

  const positionManager = new hre.ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, deployer);
  const pohToken = new hre.ethers.Contract(TOKEN, ERC20_ABI, deployer);

  const pohAmount = hre.ethers.parseEther("3678900000");
  const ethPerPoh = 0.0000000000012;
  const ethAmount = BigInt(Math.round(3678900000 * ethPerPoh * 1e18));

  // Check allowance
  const allowance = await pohToken.allowance(deployer.address, POSITION_MANAGER);
  if (allowance < pohAmount) {
    console.log("Approving POH...");
    tx = await pohToken.approve(POSITION_MANAGER, pohAmount, { nonce: nonce++ });
    await tx.wait();
    await sleep(5000);
  } else {
    console.log("POH already approved");
  }

  // POH is token0 (lower address)
  const minTick = Math.ceil(-887272 / 60) * 60;
  const maxTick = Math.floor(887272 / 60) * 60;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const mintParams = {
    token0: TOKEN,
    token1: WETH,
    fee: 3000,
    tickLower: minTick,
    tickUpper: maxTick,
    amount0Desired: pohAmount,
    amount1Desired: ethAmount,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: deadline,
  };

  console.log("Adding liquidity...");
  console.log("  POH:", hre.ethers.formatEther(pohAmount));
  console.log("  ETH:", hre.ethers.formatEther(ethAmount));

  tx = await positionManager.mint(mintParams, { value: ethAmount, nonce: nonce++ });
  const receipt = await tx.wait();
  console.log("  Liquidity added! Tx:", receipt.hash);

  // Extract token ID
  let tokenId = "unknown";
  const TRANSFER_TOPIC = hre.ethers.id("Transfer(address,address,uint256)");
  for (const log of receipt.logs) {
    if (log.topics[0] === TRANSFER_TOPIC && log.address.toLowerCase() === POSITION_MANAGER.toLowerCase()) {
      tokenId = BigInt(log.topics[3]).toString();
    }
  }

  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("\n================================================================");
  console.log("  UNISWAP V3 LIQUIDITY POOL LIVE!");
  console.log("================================================================");
  console.log("  Pool:            ", POOL);
  console.log("  LP NFT token ID: ", tokenId);
  console.log("  POH deposited:   ", hre.ethers.formatEther(pohAmount));
  console.log("  ETH deposited:   ", hre.ethers.formatEther(ethAmount));
  console.log("  Remaining ETH:   ", hre.ethers.formatEther(finalBalance));
  console.log("================================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
