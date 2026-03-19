/**
 * Stage a merkle root on the POHRewards contract (starts 24hr timelock).
 * Usage: node scripts/stage-merkle-root.js <merkle-root>
 * Example: node scripts/stage-merkle-root.js 0x9b7fb6b518281254654fe19a37314aa3b7ddbabc94ea97b61214fe9a19c66336
 */
const { ethers } = require("ethers");

const REWARDS_ADDRESS = "0xa7904Cb5f3D6a937Db06453e3d95db4f0C3236dF";
const RPC_URL = "https://mainnet.base.org";

const REWARDS_ABI = [
  "function setMerkleRoot(bytes32 _root) external",
  "function activateMerkleRoot() external",
  "function pendingRoot() view returns (bytes32)",
  "function pendingRootTimestamp() view returns (uint256)",
  "function currentEpoch() view returns (uint256)",
  "function TIMELOCK_DURATION() view returns (uint256)",
];

async function main() {
  const root = process.argv[2];
  if (!root) {
    console.error("Usage: node stage-merkle-root.js <merkle-root>");
    process.exit(1);
  }

  const key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(key, provider);
  const rewards = new ethers.Contract(REWARDS_ADDRESS, REWARDS_ABI, signer);

  console.log(`Signer: ${signer.address}`);
  console.log(`Contract: ${REWARDS_ADDRESS}`);

  // Check current state
  const currentEpoch = await rewards.currentEpoch();
  const pendingRoot = await rewards.pendingRoot();
  const timelockDuration = await rewards.TIMELOCK_DURATION();

  console.log(`Current on-chain epoch: ${currentEpoch}`);
  console.log(`Pending root: ${pendingRoot}`);

  if (pendingRoot !== ethers.ZeroHash) {
    const pendingTs = await rewards.pendingRootTimestamp();
    const activatesAt = new Date((Number(pendingTs) + Number(timelockDuration)) * 1000);
    console.log(`\nA root is already staged. Activates at: ${activatesAt.toISOString()}`);
    console.log("Run with --activate flag to activate if timelock has passed.");
    process.exit(0);
  }

  console.log(`\nStaging root: ${root}`);
  const tx = await rewards.setMerkleRoot(root);
  console.log(`Tx sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Confirmed in block ${receipt.blockNumber}`);

  const activatesAt = new Date((Date.now() / 1000 + Number(timelockDuration)) * 1000);
  console.log(`\nTimelock started. Root activates at: ${activatesAt.toISOString()}`);
  console.log(`Run 'node scripts/stage-merkle-root.js --activate' after that time.`);
}

// Handle --activate flag
if (process.argv[2] === "--activate") {
  (async () => {
    const key = process.env.DEPLOYER_PRIVATE_KEY;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(key, provider);
    const rewards = new ethers.Contract(REWARDS_ADDRESS, REWARDS_ABI, signer);

    const pendingRoot = await rewards.pendingRoot();
    const pendingTs = await rewards.pendingRootTimestamp();
    const timelockDuration = await rewards.TIMELOCK_DURATION();
    const activatesAt = Number(pendingTs) + Number(timelockDuration);

    if (pendingRoot === ethers.ZeroHash) {
      console.log("No pending root to activate.");
      process.exit(0);
    }

    if (Date.now() / 1000 < activatesAt) {
      const remaining = activatesAt - Date.now() / 1000;
      console.log(`Timelock not expired. ${Math.ceil(remaining / 60)} minutes remaining.`);
      process.exit(1);
    }

    console.log(`Activating root: ${pendingRoot}`);
    const tx = await rewards.activateMerkleRoot();
    console.log(`Tx sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Activated in block ${receipt.blockNumber}. Miners can now claim!`);
  })();
} else {
  main();
}
