import { ethers } from "ethers";

interface RewardLeaf {
  wallet: string;
  claimableNow: bigint;
  vestingAmount: bigint;
  vestingDuration: bigint;
}

interface MerkleResult {
  root: string;
  proofs: Map<string, string[]>;
  leaves: RewardLeaf[];
}

/**
 * Build a merkle tree matching the contract's StandardMerkleTree format.
 * Leaf: keccak256(abi.encode(address, claimableNow, vestingAmount, vestingDuration))
 *
 * Uses OpenZeppelin's double-hash leaf format for security against second preimage attacks.
 */
export function buildMerkleTree(leaves: RewardLeaf[]): MerkleResult {
  // Hash each leaf: keccak256(bytes.concat(keccak256(abi.encode(...))))
  const hashedLeaves = leaves.map((leaf) => {
    const innerHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256"],
        [leaf.wallet, leaf.claimableNow, leaf.vestingAmount, leaf.vestingDuration]
      )
    );
    return ethers.keccak256(ethers.concat([innerHash]));
  });

  // Create pairs of (hash, index) and sort by hash for deterministic tree
  const indexed = hashedLeaves.map((hash, i) => ({ hash, index: i }));
  indexed.sort((a, b) => (a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0));

  // Build tree layers bottom-up
  const sortedHashes = indexed.map((item) => item.hash);
  const layers: string[][] = [sortedHashes];

  while (layers[layers.length - 1].length > 1) {
    const currentLayer = layers[layers.length - 1];
    const nextLayer: string[] = [];

    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        // Sort pair for deterministic hashing
        const pair = [currentLayer[i], currentLayer[i + 1]].sort();
        nextLayer.push(ethers.keccak256(ethers.concat(pair)));
      } else {
        nextLayer.push(currentLayer[i]);
      }
    }

    layers.push(nextLayer);
  }

  const root = layers[layers.length - 1][0];

  // Generate proofs for each leaf
  const proofs = new Map<string, string[]>();

  for (const { index } of indexed) {
    const leaf = leaves[index];
    const proof: string[] = [];
    let pos = indexed.findIndex((item) => item.index === index);

    for (let layerIdx = 0; layerIdx < layers.length - 1; layerIdx++) {
      const layer = layers[layerIdx];
      const siblingIdx = pos % 2 === 0 ? pos + 1 : pos - 1;

      if (siblingIdx < layer.length) {
        proof.push(layer[siblingIdx]);
      }

      pos = Math.floor(pos / 2);
    }

    proofs.set(leaf.wallet.toLowerCase(), proof);
  }

  return { root, proofs, leaves };
}

/**
 * Convert POH amount (as number) to 18-decimal bigint.
 */
export function toWei(amount: number): bigint {
  return ethers.parseEther(amount.toString());
}
