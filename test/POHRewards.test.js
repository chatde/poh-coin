const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("POHRewards", function () {
  let token, rewards, owner, user1, user2, user3, coldWallet;
  const COMMUNITY_POOL = ethers.parseEther("12263000000"); // 50% of supply
  const DAY = 24 * 60 * 60; // 24 hours in seconds
  const VESTING_180D = 180 * DAY;
  const VESTING_30D = 30 * DAY;

  // Helper: build a merkle tree from [address, claimableNow, vestingAmount, vestingDuration] entries
  function buildTree(entries) {
    return StandardMerkleTree.of(entries, ["address", "uint256", "uint256", "uint256"]);
  }

  // Helper: stage and activate a merkle root (advance time past timelock)
  async function stageAndActivate(root) {
    await rewards.setMerkleRoot(root);
    await time.increase(DAY);
    await rewards.activateMerkleRoot();
  }

  beforeEach(async function () {
    [owner, user1, user2, user3, coldWallet] = await ethers.getSigners();

    // Deploy POHToken
    const POHToken = await ethers.getContractFactory("POHToken");
    token = await POHToken.deploy(owner.address, owner.address);
    await token.waitForDeployment();

    // Deploy POHRewards
    const POHRewards = await ethers.getContractFactory("POHRewards");
    rewards = await POHRewards.deploy(await token.getAddress());
    await rewards.waitForDeployment();

    // Exempt rewards contract from fees and max wallet
    const rewardsAddr = await rewards.getAddress();
    await token.setFeeExempt(rewardsAddr, true);
    await token.setMaxWalletExempt(rewardsAddr, true);

    // Fund rewards contract with community pool
    await token.transfer(rewardsAddr, COMMUNITY_POOL);
  });

  describe("Deployment", function () {
    it("should set the correct token address", async function () {
      expect(await rewards.token()).to.equal(await token.getAddress());
    });

    it("should start at epoch 0", async function () {
      expect(await rewards.currentEpoch()).to.equal(0);
    });

    it("should have zero total distributed", async function () {
      expect(await rewards.totalDistributed()).to.equal(0);
    });

    it("should hold the community pool balance", async function () {
      expect(await rewards.rewardsRemaining()).to.equal(COMMUNITY_POOL);
    });

    it("should have zero total vesting", async function () {
      expect(await rewards.totalVesting()).to.equal(0);
    });

    it("should have no pending root", async function () {
      expect(await rewards.pendingRoot()).to.equal(ethers.ZeroHash);
    });

    it("should revert with zero token address", async function () {
      const POHRewards = await ethers.getContractFactory("POHRewards");
      await expect(
        POHRewards.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Rewards: token is zero");
    });

    it("should report correct TIMELOCK_DURATION", async function () {
      expect(await rewards.TIMELOCK_DURATION()).to.equal(DAY);
    });
  });

  describe("Savings Wallet", function () {
    it("should allow setting a savings wallet", async function () {
      await rewards.connect(user1).setSavingsWallet(coldWallet.address);
      expect(await rewards.savingsWallet(user1.address)).to.equal(coldWallet.address);
    });

    it("should emit SavingsWalletSet event", async function () {
      await expect(rewards.connect(user1).setSavingsWallet(coldWallet.address))
        .to.emit(rewards, "SavingsWalletSet")
        .withArgs(user1.address, coldWallet.address);
    });

    it("should allow clearing savings wallet", async function () {
      await rewards.connect(user1).setSavingsWallet(coldWallet.address);
      await rewards.connect(user1).setSavingsWallet(ethers.ZeroAddress);
      expect(await rewards.savingsWallet(user1.address)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Merkle Root Timelock", function () {
    const root = ethers.keccak256(ethers.toUtf8Bytes("test"));

    it("should stage a merkle root with pending status", async function () {
      await rewards.setMerkleRoot(root);

      expect(await rewards.pendingRoot()).to.equal(root);
      expect(await rewards.pendingRootTimestamp()).to.be.gt(0);
      // Epoch should NOT increment yet
      expect(await rewards.currentEpoch()).to.equal(0);
    });

    it("should emit MerkleRootStaged event", async function () {
      const tx = await rewards.setMerkleRoot(root);
      const block = await ethers.provider.getBlock(tx.blockNumber);
      await expect(tx)
        .to.emit(rewards, "MerkleRootStaged")
        .withArgs(root, block.timestamp + DAY);
    });

    it("should reject staging while another root is pending", async function () {
      await rewards.setMerkleRoot(root);
      const root2 = ethers.keccak256(ethers.toUtf8Bytes("test2"));
      await expect(
        rewards.setMerkleRoot(root2)
      ).to.be.revertedWith("Rewards: root already pending");
    });

    it("should reject empty root", async function () {
      await expect(
        rewards.setMerkleRoot(ethers.ZeroHash)
      ).to.be.revertedWith("Rewards: empty root");
    });

    it("should only allow owner to stage root", async function () {
      await expect(
        rewards.connect(user1).setMerkleRoot(root)
      ).to.be.revertedWithCustomError(rewards, "OwnableUnauthorizedAccount");
    });

    it("should activate after timelock expires", async function () {
      await rewards.setMerkleRoot(root);
      await time.increase(DAY);
      await rewards.activateMerkleRoot();

      expect(await rewards.currentEpoch()).to.equal(1);
      expect(await rewards.merkleRoots(1)).to.equal(root);
      expect(await rewards.pendingRoot()).to.equal(ethers.ZeroHash);
      expect(await rewards.pendingRootTimestamp()).to.equal(0);
    });

    it("should emit MerkleRootActivated event", async function () {
      await rewards.setMerkleRoot(root);
      await time.increase(DAY);
      await expect(rewards.activateMerkleRoot())
        .to.emit(rewards, "MerkleRootActivated")
        .withArgs(1, root);
    });

    it("should reject activation before timelock expires", async function () {
      await rewards.setMerkleRoot(root);
      await time.increase(DAY - 10); // 10 seconds short
      await expect(
        rewards.activateMerkleRoot()
      ).to.be.revertedWith("Rewards: timelock not expired");
    });

    it("should reject activation with no pending root", async function () {
      await expect(
        rewards.activateMerkleRoot()
      ).to.be.revertedWith("Rewards: no pending root");
    });

    it("should only allow owner to activate", async function () {
      await rewards.setMerkleRoot(root);
      await time.increase(DAY);
      await expect(
        rewards.connect(user1).activateMerkleRoot()
      ).to.be.revertedWithCustomError(rewards, "OwnableUnauthorizedAccount");
    });

    it("should cancel a pending root", async function () {
      await rewards.setMerkleRoot(root);
      await rewards.cancelPendingRoot();

      expect(await rewards.pendingRoot()).to.equal(ethers.ZeroHash);
      expect(await rewards.pendingRootTimestamp()).to.equal(0);
      expect(await rewards.currentEpoch()).to.equal(0);
    });

    it("should emit MerkleRootCancelled event", async function () {
      await rewards.setMerkleRoot(root);
      await expect(rewards.cancelPendingRoot())
        .to.emit(rewards, "MerkleRootCancelled")
        .withArgs(root);
    });

    it("should reject cancel with no pending root", async function () {
      await expect(
        rewards.cancelPendingRoot()
      ).to.be.revertedWith("Rewards: no pending root");
    });

    it("should only allow owner to cancel", async function () {
      await rewards.setMerkleRoot(root);
      await expect(
        rewards.connect(user1).cancelPendingRoot()
      ).to.be.revertedWithCustomError(rewards, "OwnableUnauthorizedAccount");
    });

    it("should allow staging a new root after cancel", async function () {
      await rewards.setMerkleRoot(root);
      await rewards.cancelPendingRoot();

      const root2 = ethers.keccak256(ethers.toUtf8Bytes("root2"));
      await rewards.setMerkleRoot(root2);
      expect(await rewards.pendingRoot()).to.equal(root2);
    });

    it("should allow staging a new root after activation", async function () {
      await rewards.setMerkleRoot(root);
      await time.increase(DAY);
      await rewards.activateMerkleRoot();

      const root2 = ethers.keccak256(ethers.toUtf8Bytes("root2"));
      await rewards.setMerkleRoot(root2);
      expect(await rewards.pendingRoot()).to.equal(root2);
    });

    it("should handle multiple stage-activate cycles", async function () {
      const root1 = ethers.keccak256(ethers.toUtf8Bytes("epoch1"));
      const root2 = ethers.keccak256(ethers.toUtf8Bytes("epoch2"));

      await stageAndActivate(root1);
      await stageAndActivate(root2);

      expect(await rewards.currentEpoch()).to.equal(2);
      expect(await rewards.merkleRoots(1)).to.equal(root1);
      expect(await rewards.merkleRoots(2)).to.equal(root2);
    });
  });

  describe("Claiming Rewards (Immediate Only)", function () {
    let tree, imm1, imm2;

    beforeEach(async function () {
      imm1 = ethers.parseEther("10000"); // user1 immediate
      imm2 = ethers.parseEther("5000");  // user2 immediate

      // No vesting (vestingAmount=0, vestingDuration=0)
      tree = buildTree([
        [user1.address, imm1, 0n, 0n],
        [user2.address, imm2, 0n, 0n],
      ]);

      await stageAndActivate(tree.root);
    });

    it("should allow valid claim to msg.sender (no savings wallet)", async function () {
      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);
      await rewards.connect(user1).claim(1, imm1, 0, 0, proof);

      expect(await token.balanceOf(user1.address)).to.equal(imm1);
      expect(await rewards.hasClaimed(1, user1.address)).to.be.true;
      expect(await rewards.totalDistributed()).to.equal(imm1);
    });

    it("should send tokens to savings wallet when set", async function () {
      await rewards.connect(user1).setSavingsWallet(coldWallet.address);

      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);
      await rewards.connect(user1).claim(1, imm1, 0, 0, proof);

      expect(await token.balanceOf(coldWallet.address)).to.equal(imm1);
      expect(await token.balanceOf(user1.address)).to.equal(0);
    });

    it("should emit RewardsClaimed with correct args", async function () {
      await rewards.connect(user1).setSavingsWallet(coldWallet.address);
      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);

      await expect(rewards.connect(user1).claim(1, imm1, 0, 0, proof))
        .to.emit(rewards, "RewardsClaimed")
        .withArgs(1, user1.address, coldWallet.address, imm1, 0, 0);
    });

    it("should allow multiple users to claim same epoch", async function () {
      const proof1 = tree.getProof([user1.address, imm1, 0n, 0n]);
      const proof2 = tree.getProof([user2.address, imm2, 0n, 0n]);

      await rewards.connect(user1).claim(1, imm1, 0, 0, proof1);
      await rewards.connect(user2).claim(1, imm2, 0, 0, proof2);

      expect(await token.balanceOf(user1.address)).to.equal(imm1);
      expect(await token.balanceOf(user2.address)).to.equal(imm2);
      expect(await rewards.totalDistributed()).to.equal(imm1 + imm2);
    });

    it("should reject double claim", async function () {
      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);
      await rewards.connect(user1).claim(1, imm1, 0, 0, proof);

      await expect(
        rewards.connect(user1).claim(1, imm1, 0, 0, proof)
      ).to.be.revertedWith("Rewards: already claimed");
    });

    it("should reject invalid proof", async function () {
      const fakeProof = tree.getProof([user1.address, imm1, 0n, 0n]);
      await expect(
        rewards.connect(user3).claim(1, imm1, 0, 0, fakeProof)
      ).to.be.revertedWith("Rewards: invalid proof");
    });

    it("should reject wrong amount", async function () {
      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);
      const wrongAmount = ethers.parseEther("99999");
      await expect(
        rewards.connect(user1).claim(1, wrongAmount, 0, 0, proof)
      ).to.be.revertedWith("Rewards: invalid proof");
    });

    it("should reject invalid epoch (0)", async function () {
      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);
      await expect(
        rewards.connect(user1).claim(0, imm1, 0, 0, proof)
      ).to.be.revertedWith("Rewards: invalid epoch");
    });

    it("should reject future epoch", async function () {
      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);
      await expect(
        rewards.connect(user1).claim(99, imm1, 0, 0, proof)
      ).to.be.revertedWith("Rewards: invalid epoch");
    });

    it("should reject zero amount", async function () {
      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);
      await expect(
        rewards.connect(user1).claim(1, 0, 0, 0, proof)
      ).to.be.revertedWith("Rewards: zero amount");
    });

    it("should reduce rewardsRemaining after claims", async function () {
      const proof = tree.getProof([user1.address, imm1, 0n, 0n]);
      const before = await rewards.rewardsRemaining();

      await rewards.connect(user1).claim(1, imm1, 0, 0, proof);

      expect(await rewards.rewardsRemaining()).to.equal(before - imm1);
    });
  });

  describe("Claiming Rewards (With Vesting)", function () {
    let tree, imm1, vest1, vestDur1;

    beforeEach(async function () {
      // New miner: 25% immediate / 75% vests 180 days
      imm1 = ethers.parseEther("2500");   // 25% of 10k
      vest1 = ethers.parseEther("7500");   // 75% of 10k
      vestDur1 = BigInt(VESTING_180D);

      tree = buildTree([
        [user1.address, imm1, vest1, vestDur1],
      ]);

      await stageAndActivate(tree.root);
    });

    it("should send immediate and lock vesting", async function () {
      const proof = tree.getProof([user1.address, imm1, vest1, vestDur1]);
      await rewards.connect(user1).claim(1, imm1, vest1, vestDur1, proof);

      // Immediate portion sent
      expect(await token.balanceOf(user1.address)).to.equal(imm1);
      // Vesting recorded
      const v = await rewards.vesting(user1.address, 1);
      expect(v.amount).to.equal(vest1);
      expect(v.released).to.be.false;
      // Total vesting tracked
      expect(await rewards.totalVesting()).to.equal(vest1);
      // Only immediate counted as distributed
      expect(await rewards.totalDistributed()).to.equal(imm1);
    });

    it("should send immediate to savings wallet and lock vesting", async function () {
      await rewards.connect(user1).setSavingsWallet(coldWallet.address);
      const proof = tree.getProof([user1.address, imm1, vest1, vestDur1]);
      await rewards.connect(user1).claim(1, imm1, vest1, vestDur1, proof);

      expect(await token.balanceOf(coldWallet.address)).to.equal(imm1);
      expect(await token.balanceOf(user1.address)).to.equal(0);
    });

    it("should emit RewardsClaimed with vesting info", async function () {
      const proof = tree.getProof([user1.address, imm1, vest1, vestDur1]);
      const tx = await rewards.connect(user1).claim(1, imm1, vest1, vestDur1, proof);
      const block = await ethers.provider.getBlock(tx.blockNumber);

      await expect(tx)
        .to.emit(rewards, "RewardsClaimed")
        .withArgs(1, user1.address, user1.address, imm1, vest1, block.timestamp + VESTING_180D);
    });

    it("should track rewardsAvailable excluding vesting", async function () {
      const proof = tree.getProof([user1.address, imm1, vest1, vestDur1]);
      const beforeRemaining = await rewards.rewardsRemaining();

      await rewards.connect(user1).claim(1, imm1, vest1, vestDur1, proof);

      // rewardsRemaining = total balance (includes locked vesting tokens)
      expect(await rewards.rewardsRemaining()).to.equal(beforeRemaining - imm1);
      // rewardsAvailable = balance - locked vesting
      expect(await rewards.rewardsAvailable()).to.equal(beforeRemaining - imm1 - vest1);
    });
  });

  describe("Vesting Release", function () {
    let tree, imm1, vest1, vestDur1;

    beforeEach(async function () {
      imm1 = ethers.parseEther("2500");
      vest1 = ethers.parseEther("7500");
      vestDur1 = BigInt(VESTING_180D);

      tree = buildTree([
        [user1.address, imm1, vest1, vestDur1],
      ]);

      await stageAndActivate(tree.root);

      // Claim with vesting
      const proof = tree.getProof([user1.address, imm1, vest1, vestDur1]);
      await rewards.connect(user1).claim(1, imm1, vest1, vestDur1, proof);
    });

    it("should release vested tokens after duration", async function () {
      await time.increase(VESTING_180D);
      await rewards.connect(user1).releaseVested(1);

      expect(await token.balanceOf(user1.address)).to.equal(imm1 + vest1);
      expect(await rewards.totalVesting()).to.equal(0);
      expect(await rewards.totalDistributed()).to.equal(imm1 + vest1);
    });

    it("should release vested tokens to savings wallet", async function () {
      await rewards.connect(user1).setSavingsWallet(coldWallet.address);
      await time.increase(VESTING_180D);
      await rewards.connect(user1).releaseVested(1);

      expect(await token.balanceOf(coldWallet.address)).to.equal(vest1);
    });

    it("should emit VestingReleased event", async function () {
      await time.increase(VESTING_180D);
      await expect(rewards.connect(user1).releaseVested(1))
        .to.emit(rewards, "VestingReleased")
        .withArgs(1, user1.address, user1.address, vest1);
    });

    it("should reject release before vesting period ends", async function () {
      await time.increase(VESTING_180D - 100);
      await expect(
        rewards.connect(user1).releaseVested(1)
      ).to.be.revertedWith("Rewards: still vesting");
    });

    it("should reject double release", async function () {
      await time.increase(VESTING_180D);
      await rewards.connect(user1).releaseVested(1);

      await expect(
        rewards.connect(user1).releaseVested(1)
      ).to.be.revertedWith("Rewards: already released");
    });

    it("should reject release for non-existent vesting", async function () {
      await expect(
        rewards.connect(user2).releaseVested(1)
      ).to.be.revertedWith("Rewards: no vesting");
    });

    it("should mark vesting as released", async function () {
      await time.increase(VESTING_180D);
      await rewards.connect(user1).releaseVested(1);

      const v = await rewards.vesting(user1.address, 1);
      expect(v.released).to.be.true;
    });
  });

  describe("Batch Claiming", function () {
    let tree1, tree2, imm1, vest1, dur1, imm2, vest2, dur2;

    beforeEach(async function () {
      // Epoch 1: new miner (25/75 split, 180d vest)
      imm1 = ethers.parseEther("2500");
      vest1 = ethers.parseEther("7500");
      dur1 = BigInt(VESTING_180D);

      // Epoch 2: veteran (75/25 split, 30d vest)
      imm2 = ethers.parseEther("6000");
      vest2 = ethers.parseEther("2000");
      dur2 = BigInt(VESTING_30D);

      tree1 = buildTree([
        [user1.address, imm1, vest1, dur1],
        [user2.address, ethers.parseEther("5000"), 0n, 0n],
      ]);

      tree2 = buildTree([
        [user1.address, imm2, vest2, dur2],
        [user2.address, ethers.parseEther("3000"), 0n, 0n],
      ]);

      await stageAndActivate(tree1.root);
      await stageAndActivate(tree2.root);
    });

    it("should claim multiple epochs in one transaction", async function () {
      const proof1 = tree1.getProof([user1.address, imm1, vest1, dur1]);
      const proof2 = tree2.getProof([user1.address, imm2, vest2, dur2]);

      await rewards.connect(user1).claimBatch(
        [1, 2],
        [imm1, imm2],
        [vest1, vest2],
        [dur1, dur2],
        [proof1, proof2]
      );

      // Immediate portions sent
      expect(await token.balanceOf(user1.address)).to.equal(imm1 + imm2);
      // Both epochs claimed
      expect(await rewards.hasClaimed(1, user1.address)).to.be.true;
      expect(await rewards.hasClaimed(2, user1.address)).to.be.true;
      // Both vesting entries recorded
      expect(await rewards.totalVesting()).to.equal(vest1 + vest2);
      expect(await rewards.totalDistributed()).to.equal(imm1 + imm2);
    });

    it("should send batch claim to savings wallet", async function () {
      await rewards.connect(user1).setSavingsWallet(coldWallet.address);

      const proof1 = tree1.getProof([user1.address, imm1, vest1, dur1]);
      const proof2 = tree2.getProof([user1.address, imm2, vest2, dur2]);

      await rewards.connect(user1).claimBatch(
        [1, 2],
        [imm1, imm2],
        [vest1, vest2],
        [dur1, dur2],
        [proof1, proof2]
      );

      expect(await token.balanceOf(coldWallet.address)).to.equal(imm1 + imm2);
      expect(await token.balanceOf(user1.address)).to.equal(0);
    });

    it("should reject batch with length mismatch", async function () {
      await expect(
        rewards.connect(user1).claimBatch([1], [imm1, imm2], [vest1], [dur1], [[]])
      ).to.be.revertedWith("Rewards: length mismatch");
    });

    it("should reject batch if any epoch already claimed", async function () {
      const proof1 = tree1.getProof([user1.address, imm1, vest1, dur1]);
      const proof2 = tree2.getProof([user1.address, imm2, vest2, dur2]);

      // Claim epoch 1 individually first
      await rewards.connect(user1).claim(1, imm1, vest1, dur1, proof1);

      // Batch should fail
      await expect(
        rewards.connect(user1).claimBatch(
          [1, 2],
          [imm1, imm2],
          [vest1, vest2],
          [dur1, dur2],
          [proof1, proof2]
        )
      ).to.be.revertedWith("Rewards: already claimed");
    });
  });

  describe("Batch Vesting Release", function () {
    let tree1, tree2;
    const imm = ethers.parseEther("2500");
    const vest = ethers.parseEther("7500");
    const dur = BigInt(VESTING_180D);

    beforeEach(async function () {
      tree1 = buildTree([[user1.address, imm, vest, dur]]);
      tree2 = buildTree([[user1.address, imm, vest, dur]]);

      await stageAndActivate(tree1.root);
      await stageAndActivate(tree2.root);

      // Claim both epochs
      const proof1 = tree1.getProof([user1.address, imm, vest, dur]);
      const proof2 = tree2.getProof([user1.address, imm, vest, dur]);

      await rewards.connect(user1).claim(1, imm, vest, dur, proof1);
      await rewards.connect(user1).claim(2, imm, vest, dur, proof2);
    });

    it("should release multiple vesting entries in one tx", async function () {
      await time.increase(VESTING_180D);
      await rewards.connect(user1).releaseVestedBatch([1, 2]);

      expect(await token.balanceOf(user1.address)).to.equal((imm + vest) * 2n);
      expect(await rewards.totalVesting()).to.equal(0);
    });

    it("should send batch release to savings wallet", async function () {
      await rewards.connect(user1).setSavingsWallet(coldWallet.address);
      await time.increase(VESTING_180D);
      await rewards.connect(user1).releaseVestedBatch([1, 2]);

      expect(await token.balanceOf(coldWallet.address)).to.equal(vest * 2n);
    });

    it("should reject batch if any entry is still vesting", async function () {
      // Only advance 30 days (not enough for 180d vesting)
      await time.increase(VESTING_30D);
      await expect(
        rewards.connect(user1).releaseVestedBatch([1, 2])
      ).to.be.revertedWith("Rewards: still vesting");
    });

    it("should reject batch if any entry already released", async function () {
      await time.increase(VESTING_180D);
      await rewards.connect(user1).releaseVested(1);

      await expect(
        rewards.connect(user1).releaseVestedBatch([1, 2])
      ).to.be.revertedWith("Rewards: already released");
    });
  });

  describe("Multi-Epoch Scenarios", function () {
    it("should allow claiming from different epochs independently", async function () {
      const amount = ethers.parseEther("1000");

      const tree1 = buildTree([[user1.address, amount, 0n, 0n]]);
      const tree2 = buildTree([[user1.address, amount, 0n, 0n]]);

      await stageAndActivate(tree1.root);
      await stageAndActivate(tree2.root);

      // Claim epoch 2 first (out of order)
      const proof2 = tree2.getProof([user1.address, amount, 0n, 0n]);
      await rewards.connect(user1).claim(2, amount, 0, 0, proof2);

      // Then claim epoch 1
      const proof1 = tree1.getProof([user1.address, amount, 0n, 0n]);
      await rewards.connect(user1).claim(1, amount, 0, 0, proof1);

      expect(await token.balanceOf(user1.address)).to.equal(amount * 2n);
    });

    it("should handle mixed vesting durations across epochs", async function () {
      // Epoch 1: 180d vest (new miner)
      const imm1 = ethers.parseEther("2500");
      const vest1 = ethers.parseEther("7500");
      const dur1 = BigInt(VESTING_180D);

      // Epoch 2: 30d vest (now a veteran)
      const imm2 = ethers.parseEther("7500");
      const vest2 = ethers.parseEther("2500");
      const dur2 = BigInt(VESTING_30D);

      const tree1 = buildTree([[user1.address, imm1, vest1, dur1]]);
      const tree2 = buildTree([[user1.address, imm2, vest2, dur2]]);

      await stageAndActivate(tree1.root);
      await stageAndActivate(tree2.root);

      const proof1 = tree1.getProof([user1.address, imm1, vest1, dur1]);
      const proof2 = tree2.getProof([user1.address, imm2, vest2, dur2]);

      await rewards.connect(user1).claim(1, imm1, vest1, dur1, proof1);
      await rewards.connect(user1).claim(2, imm2, vest2, dur2, proof2);

      // After 30 days: epoch 2 vesting unlocks, epoch 1 still locked
      await time.increase(VESTING_30D);
      await rewards.connect(user1).releaseVested(2);
      expect(await token.balanceOf(user1.address)).to.equal(imm1 + imm2 + vest2);

      // Epoch 1 still locked
      await expect(
        rewards.connect(user1).releaseVested(1)
      ).to.be.revertedWith("Rewards: still vesting");

      // After remaining 150 days: epoch 1 unlocks too
      await time.increase(VESTING_180D - VESTING_30D);
      await rewards.connect(user1).releaseVested(1);
      expect(await token.balanceOf(user1.address)).to.equal(imm1 + vest1 + imm2 + vest2);
      expect(await rewards.totalVesting()).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("should report rewardsAvailable correctly", async function () {
      const imm = ethers.parseEther("2500");
      const vest = ethers.parseEther("7500");
      const dur = BigInt(VESTING_180D);

      const tree = buildTree([[user1.address, imm, vest, dur]]);
      await stageAndActivate(tree.root);

      const proof = tree.getProof([user1.address, imm, vest, dur]);
      await rewards.connect(user1).claim(1, imm, vest, dur, proof);

      const remaining = await rewards.rewardsRemaining();
      const available = await rewards.rewardsAvailable();

      // Available = remaining - locked vesting
      expect(available).to.equal(remaining - vest);
    });
  });
});
