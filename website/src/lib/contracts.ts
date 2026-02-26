import { ethers } from "ethers";

// ── Network Config ──────────────────────────────────────────────────
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "84532");
export const IS_MAINNET = CHAIN_ID === 8453;

const SEPOLIA_CONTRACTS = {
  token: "0xe75DC31C1D4F1f8b1160e84a6B3228115d1135a2",
  charity: "0x31a3D6d28fEFfc177F9d099a4491A4E3cE8fA7E6",
  vesting: "0x5112A61F036fE79C0D15a779269B6558dC70C1a7",
  rewards: "0x136EB82Ce350a7f391DC02223a878A8FcA4028Fe",
  registry: "0x6413393Ec4c594F0a9ce9c1B5d2056B4B309E0e6",
} as const;

// Mainnet addresses (Base, Chain ID 8453) — deployed 2026-02-23
const MAINNET_CONTRACTS = {
  token: "0x280Ddb8b67Ad8cf791D370FE59227d19e989Fb07",
  charity: "0xf9eDc5CF986ea637E724E078DA01AbD7c4957D49",
  vesting: "0xFfce548EbF097F630A272aA577E750A0Bc1308dd",
  rewards: "0xa7904Cb5f3D6a937Db06453e3d95db4f0C3236dF",
  registry: "0x8137a04a50C058b00d9ee44D25b9Ef1ba900D15F",
} as const;

export const CONTRACTS = IS_MAINNET ? MAINNET_CONTRACTS : SEPOLIA_CONTRACTS;

export const RPC_URL = IS_MAINNET
  ? "https://mainnet.base.org"
  : "https://sepolia.base.org";
export const BLOCK_EXPLORER = IS_MAINNET
  ? "https://basescan.org"
  : "https://sepolia.basescan.org";
export const BASE_CHAIN_ID = CHAIN_ID;

// Legacy exports for compatibility
export const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// ── Minimal ABIs (view functions only) ──────────────────────────────

export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function charityWallet() view returns (address)",
  "function maxWallet() view returns (uint256)",
  "function maxTx() view returns (uint256)",
  "function totalBuyFee() view returns (uint256)",
  "function totalSellFee() view returns (uint256)",
  "function paused() view returns (bool)",
  "function owner() view returns (address)",
];

export const CHARITY_ABI = [
  "function proposalCount() view returns (uint256)",
  "function timelockDelay() view returns (uint256)",
  "function getProposal(uint256) view returns (address token, address recipient, uint256 amount, string reason, uint256 executeAfter, bool executed, bool cancelled)",
];

export const VESTING_ABI = [
  "function beneficiary() view returns (address)",
  "function totalAllocation() view returns (uint256)",
  "function released() view returns (uint256)",
  "function releasable() view returns (uint256)",
  "function vestedAmount() view returns (uint256)",
  "function vestedPercentageBps() view returns (uint256)",
  "function cliffEnd() view returns (uint256)",
  "function vestingEnd() view returns (uint256)",
  "function timeUntilCliff() view returns (uint256)",
  "function timeUntilFullyVested() view returns (uint256)",
];

export const REWARDS_ABI = [
  "function currentEpoch() view returns (uint256)",
  "function totalDistributed() view returns (uint256)",
  "function rewardsRemaining() view returns (uint256)",
  "function rewardsAvailable() view returns (uint256)",
  "function totalVesting() view returns (uint256)",
  "function pendingRoot() view returns (bytes32)",
  "function pendingRootTimestamp() view returns (uint256)",
  "function TIMELOCK_DURATION() view returns (uint256)",
  "function hasClaimed(uint256, address) view returns (bool)",
  "function savingsWallet(address) view returns (address)",
  "function claim(uint256 _epoch, uint256 _claimableNow, uint256 _vestingAmount, uint256 _vestingDuration, bytes32[] _proof) external",
  "function claimBatch(uint256[] _epochs, uint256[] _claimableNows, uint256[] _vestingAmounts, uint256[] _vestingDurations, bytes32[][] _proofs) external",
];

export const REGISTRY_ABI = [
  "function totalNodes() view returns (uint256)",
  "function totalValidators() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function totalSchools() view returns (uint256)",
  "function reputation(address) view returns (uint256)",
  "function isActiveNode(bytes32) view returns (bool)",
  "function isStakedValidator(address) view returns (bool)",
  "function getOwnerDeviceCount(address) view returns (uint256)",
  "function registerNode(bytes32 _deviceId, uint8 _tier) external",
];

// ── Provider & Contract Instances ───────────────────────────────────

let _provider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return _provider;
}

export function getTokenContract() {
  return new ethers.Contract(CONTRACTS.token, TOKEN_ABI, getProvider());
}

export function getCharityContract() {
  return new ethers.Contract(CONTRACTS.charity, CHARITY_ABI, getProvider());
}

export function getVestingContract() {
  return new ethers.Contract(CONTRACTS.vesting, VESTING_ABI, getProvider());
}

export function getRewardsContract() {
  return new ethers.Contract(CONTRACTS.rewards, REWARDS_ABI, getProvider());
}

export function getRegistryContract() {
  return new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, getProvider());
}

// ── Helper to format token amounts ──────────────────────────────────

export function formatPOH(wei: bigint, decimals = 0): string {
  const num = Number(ethers.formatEther(wei));
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(decimals) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(decimals) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(decimals) + "K";
  return num.toFixed(decimals);
}

// ── Wallet Connection Helper ────────────────────────────────────────

export async function connectWallet(): Promise<{ address: string; signer: ethers.Signer } | null> {
  const ethereum = (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum;
  if (!ethereum) return null;

  const provider = new ethers.BrowserProvider(ethereum);

  // Request account access
  await provider.send("eth_requestAccounts", []);

  // Switch to correct chain
  try {
    await provider.send("wallet_switchEthereumChain", [
      { chainId: "0x" + BASE_CHAIN_ID.toString(16) },
    ]);
  } catch (switchError: unknown) {
    // Chain not added — add it
    if ((switchError as { code: number }).code === 4902) {
      await provider.send("wallet_addEthereumChain", [{
        chainId: "0x" + BASE_CHAIN_ID.toString(16),
        chainName: IS_MAINNET ? "Base" : "Base Sepolia",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: [RPC_URL],
        blockExplorerUrls: [BLOCK_EXPLORER],
      }]);
    }
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { address, signer };
}
