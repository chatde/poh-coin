const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Create Uniswap V3 POH/WETH liquidity pool on Base mainnet.
 *
 * Usage:
 *   CONFIRM_MAINNET=true npx hardhat run scripts/create-lp.js --network base
 *
 * Optional env vars:
 *   INITIAL_PRICE_ETH  — ETH per POH (default: 0.000000001)
 *
 * Prerequisites:
 *   - deployments/base-mainnet.json must exist (run deploy-mainnet.js first)
 *   - Deployer wallet must hold 15% of POH supply + enough ETH for LP + gas
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Uniswap V3 addresses on Base ──────────────────────────────────────
const UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const UNISWAP_V3_POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
const WETH_BASE = "0x4200000000000000000000000000000000000006";

// ── Fee tier ──────────────────────────────────────────────────────────
const FEE_TIER = 3000; // 0.3%
const TICK_SPACING = 60; // tick spacing for 0.3% fee tier

// ── Minimal ABIs ──────────────────────────────────────────────────────
const FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address)",
];

const POSITION_MANAGER_ABI = [
  "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)",
  "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

const POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
];

/**
 * Calculate sqrtPriceX96 from a human-readable price.
 *
 * sqrtPriceX96 = sqrt(price) * 2^96
 *
 * "price" here is token1/token0 in the Uniswap V3 convention.
 * If token0 = POH and token1 = WETH, then price = ETH per POH.
 * If token0 = WETH and token1 = POH, then price = POH per ETH.
 */
function encodeSqrtPriceX96(price) {
  // price is a float — we need sqrt(price) * 2^96
  const sqrtPrice = Math.sqrt(price);
  // Use BigInt math: multiply by 2^96 = 79228162514264337593543950336n
  // Since sqrtPrice might be very small or very large, we use a scaled approach
  const Q96 = 2n ** 96n;
  // Scale sqrtPrice to avoid floating point issues
  // Multiply sqrtPrice by 1e18, convert to BigInt, then multiply by Q96, divide by 1e18
  const SCALE = 10n ** 18n;
  const sqrtPriceScaled = BigInt(Math.round(sqrtPrice * 1e18));
  return (sqrtPriceScaled * Q96) / SCALE;
}

/**
 * Get the min and max ticks for full-range liquidity, aligned to tick spacing.
 */
function getFullRangeTicks(tickSpacing) {
  // Uniswap V3 min/max ticks
  const MIN_TICK = -887272;
  const MAX_TICK = 887272;
  // Align to tick spacing
  const minTick = Math.ceil(MIN_TICK / tickSpacing) * tickSpacing;
  const maxTick = Math.floor(MAX_TICK / tickSpacing) * tickSpacing;
  return { minTick, maxTick };
}

async function main() {
  // ── Preflight ──────────────────────────────────────────────────────
  const isMainnet = hre.network.name === "base";

  if (isMainnet && process.env.CONFIRM_MAINNET !== "true") {
    console.error("");
    console.error("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("  !!  MAINNET LP CREATION — THIS USES REAL ETH !!");
    console.error("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("");
    console.error("  Set CONFIRM_MAINNET=true to confirm.");
    console.error("  Example:");
    console.error("    CONFIRM_MAINNET=true npx hardhat run scripts/create-lp.js --network base");
    console.error("");
    process.exit(1);
  }

  // ── Load deployment ────────────────────────────────────────────────
  const deploymentsFile = path.join(__dirname, "..", "deployments", "base-mainnet.json");
  if (!fs.existsSync(deploymentsFile)) {
    console.error("FATAL: deployments/base-mainnet.json not found.");
    console.error("       Run deploy-mainnet.js first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentsFile, "utf8"));
  const pohTokenAddress = deployment.contracts.POHToken;
  console.log("POHToken:", pohTokenAddress);

  // ── Signer ─────────────────────────────────────────────────────────
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("ETH balance:", hre.ethers.formatEther(balance));

  // ── Token ordering ─────────────────────────────────────────────────
  // Uniswap V3 requires token0 < token1 (by address, numerically)
  const pohAddr = pohTokenAddress.toLowerCase();
  const wethAddr = WETH_BASE.toLowerCase();
  const pohIsToken0 = pohAddr < wethAddr;

  const token0 = pohIsToken0 ? pohTokenAddress : WETH_BASE;
  const token1 = pohIsToken0 ? WETH_BASE : pohTokenAddress;

  console.log("");
  console.log("token0:", token0, pohIsToken0 ? "(POH)" : "(WETH)");
  console.log("token1:", token1, pohIsToken0 ? "(WETH)" : "(POH)");

  // ── Price calculation ──────────────────────────────────────────────
  // INITIAL_PRICE_ETH = how many ETH one POH is worth
  const ethPerPoh = parseFloat(process.env.INITIAL_PRICE_ETH || "0.000000001");
  console.log("\nInitial price:", ethPerPoh, "ETH per POH");

  // Uniswap V3 price = token1 per token0
  // If POH is token0: price = WETH/POH = ethPerPoh
  // If WETH is token0: price = POH/WETH = 1/ethPerPoh
  const uniswapPrice = pohIsToken0 ? ethPerPoh : 1 / ethPerPoh;
  console.log("Uniswap price (token1/token0):", uniswapPrice);

  const sqrtPriceX96 = encodeSqrtPriceX96(uniswapPrice);
  console.log("sqrtPriceX96:", sqrtPriceX96.toString());

  // ── LP amounts ─────────────────────────────────────────────────────
  // 15% of 24,526,000,000 = 3,678,900,000 POH
  const pohAmount = hre.ethers.parseEther("3678900000");
  // Corresponding ETH based on price
  const ethAmount = BigInt(Math.round(3678900000 * ethPerPoh * 1e18));

  const pohToken = new hre.ethers.Contract(pohTokenAddress, ERC20_ABI, deployer);
  const pohBalance = await pohToken.balanceOf(deployer.address);

  console.log("\nPOH for LP:  ", hre.ethers.formatEther(pohAmount), "POH");
  console.log("ETH for LP:  ", hre.ethers.formatEther(ethAmount), "ETH");
  console.log("POH balance: ", hre.ethers.formatEther(pohBalance), "POH");
  console.log("ETH balance: ", hre.ethers.formatEther(balance), "ETH");

  if (pohBalance < pohAmount) {
    console.error("\nFATAL: Insufficient POH balance for LP.");
    console.error("  Need:", hre.ethers.formatEther(pohAmount));
    console.error("  Have:", hre.ethers.formatEther(pohBalance));
    process.exit(1);
  }
  if (balance < ethAmount) {
    console.error("\nFATAL: Insufficient ETH balance for LP.");
    console.error("  Need:", hre.ethers.formatEther(ethAmount));
    console.error("  Have:", hre.ethers.formatEther(balance));
    process.exit(1);
  }

  // ── Create and initialize pool ─────────────────────────────────────
  console.log("\nCreating and initializing pool...");
  const positionManager = new hre.ethers.Contract(
    UNISWAP_V3_POSITION_MANAGER,
    POSITION_MANAGER_ABI,
    deployer
  );

  let tx = await positionManager.createAndInitializePoolIfNecessary(
    token0,
    token1,
    FEE_TIER,
    sqrtPriceX96
  );
  await tx.wait();
  console.log("  Pool created/initialized");

  // Get pool address
  const factory = new hre.ethers.Contract(UNISWAP_V3_FACTORY, FACTORY_ABI, deployer);
  const poolAddress = await factory.getPool(token0, token1, FEE_TIER);
  console.log("  Pool address:", poolAddress);

  // Read current tick from pool
  const pool = new hre.ethers.Contract(poolAddress, POOL_ABI, deployer);
  const slot0 = await pool.slot0();
  console.log("  Current tick:", slot0.tick.toString());
  console.log("  sqrtPriceX96:", slot0.sqrtPriceX96.toString());

  // ── Approve tokens ─────────────────────────────────────────────────
  await sleep(5000);
  console.log("\nApproving POH spend to PositionManager...");
  tx = await pohToken.approve(UNISWAP_V3_POSITION_MANAGER, pohAmount);
  await tx.wait();
  console.log("  Approved", hre.ethers.formatEther(pohAmount), "POH");

  // ── Add full-range liquidity ───────────────────────────────────────
  await sleep(5000);
  console.log("\nAdding full-range liquidity...");

  const { minTick, maxTick } = getFullRangeTicks(TICK_SPACING);
  console.log("  Tick range:", minTick, "to", maxTick);

  // Set amounts based on token ordering
  const amount0Desired = pohIsToken0 ? pohAmount : ethAmount;
  const amount1Desired = pohIsToken0 ? ethAmount : pohAmount;

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const mintParams = {
    token0: token0,
    token1: token1,
    fee: FEE_TIER,
    tickLower: minTick,
    tickUpper: maxTick,
    amount0Desired: amount0Desired,
    amount1Desired: amount1Desired,
    amount0Min: 0, // Accept any amount (slippage protection not critical at pool creation)
    amount1Min: 0,
    recipient: deployer.address,
    deadline: deadline,
  };

  // Send ETH with the mint call (for WETH wrapping)
  tx = await positionManager.mint(mintParams, { value: ethAmount });
  const receipt = await tx.wait();

  // Parse tokenId from events
  console.log("  Liquidity added!");
  console.log("  Tx hash:", receipt.hash);

  // Try to extract tokenId from logs
  // The IncreaseLiquidity event has tokenId as first topic
  let tokenId = "unknown";
  let liquidity = "unknown";
  for (const log of receipt.logs) {
    try {
      // IncreaseLiquidity(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)
      if (log.topics.length >= 2) {
        // The NonfungiblePositionManager Transfer event contains the tokenId
        // Transfer(address from, address to, uint256 tokenId) for ERC721
        const TRANSFER_TOPIC = hre.ethers.id("Transfer(address,address,uint256)");
        if (log.topics[0] === TRANSFER_TOPIC && log.address.toLowerCase() === UNISWAP_V3_POSITION_MANAGER.toLowerCase()) {
          tokenId = BigInt(log.topics[3]).toString();
        }
      }
    } catch (_) {
      // Skip unparseable logs
    }
  }

  // ── Summary ────────────────────────────────────────────────────────
  console.log("");
  console.log("================================================================");
  console.log("  UNISWAP V3 LIQUIDITY POOL CREATED");
  console.log("================================================================");
  console.log("  Pool address:    ", poolAddress);
  console.log("  Fee tier:        ", "0.3% (3000)");
  console.log("  LP NFT token ID: ", tokenId);
  console.log("  POH deposited:   ", hre.ethers.formatEther(pohAmount), "POH");
  console.log("  ETH deposited:   ", hre.ethers.formatEther(ethAmount), "ETH");
  console.log("  Price:           ", ethPerPoh, "ETH per POH");
  console.log("  Range:           ", "Full range (min tick to max tick)");
  console.log("================================================================");

  // Update deployment file with pool info
  deployment.pool = {
    address: poolAddress,
    feeTier: FEE_TIER,
    lpTokenId: tokenId,
    token0: token0,
    token1: token1,
    pohDeposited: hre.ethers.formatEther(pohAmount),
    ethDeposited: hre.ethers.formatEther(ethAmount),
    initialPriceEth: ethPerPoh,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(deploymentsFile, JSON.stringify(deployment, null, 2) + "\n");
  console.log("\nDeployment file updated:", deploymentsFile);

  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
