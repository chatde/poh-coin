const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("POHNodeRegistry", function () {
  let token, registry, owner, user1, user2, validator1, validator2;
  const MIN_STAKE = ethers.parseEther("1000");

  // Helper: generate a fake device ID
  function deviceId(label) {
    return ethers.keccak256(ethers.toUtf8Bytes(label));
  }

  beforeEach(async function () {
    [owner, user1, user2, validator1, validator2] = await ethers.getSigners();

    // Deploy POHToken
    const POHToken = await ethers.getContractFactory("POHToken");
    token = await POHToken.deploy(owner.address, owner.address);
    await token.waitForDeployment();

    // Deploy POHNodeRegistry
    const POHNodeRegistry = await ethers.getContractFactory("POHNodeRegistry");
    registry = await POHNodeRegistry.deploy(await token.getAddress());
    await registry.waitForDeployment();

    // Exempt registry from fees and max wallet
    const registryAddr = await registry.getAddress();
    await token.setFeeExempt(registryAddr, true);
    await token.setMaxWalletExempt(registryAddr, true);

    // Give validators some tokens for staking
    await token.transfer(validator1.address, ethers.parseEther("100000"));
    await token.transfer(validator2.address, ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("should set the correct token address", async function () {
      expect(await registry.token()).to.equal(await token.getAddress());
    });

    it("should start with zero counters", async function () {
      expect(await registry.totalNodes()).to.equal(0);
      expect(await registry.totalValidators()).to.equal(0);
      expect(await registry.totalSchools()).to.equal(0);
      expect(await registry.totalStaked()).to.equal(0);
    });

    it("should revert with zero token address", async function () {
      const POHNodeRegistry = await ethers.getContractFactory("POHNodeRegistry");
      await expect(
        POHNodeRegistry.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Registry: token is zero");
    });
  });

  describe("Node Registration", function () {
    it("should register a data node (tier 1)", async function () {
      const id = deviceId("phone-1");
      await registry.connect(user1).registerNode(id, 1);

      const node = await registry.nodes(id);
      expect(node.owner).to.equal(user1.address);
      expect(node.tier).to.equal(1);
      expect(node.active).to.be.true;
      expect(await registry.totalNodes()).to.equal(1);
    });

    it("should register a validation node (tier 2)", async function () {
      const id = deviceId("desktop-1");
      await registry.connect(validator1).registerNode(id, 2);

      const node = await registry.nodes(id);
      expect(node.tier).to.equal(2);
      expect(await registry.totalValidators()).to.equal(1);
      expect(await registry.totalNodes()).to.equal(1);
    });

    it("should emit NodeRegistered event", async function () {
      const id = deviceId("phone-2");
      await expect(registry.connect(user1).registerNode(id, 1))
        .to.emit(registry, "NodeRegistered")
        .withArgs(id, user1.address, 1);
    });

    it("should track owner devices", async function () {
      const id1 = deviceId("phone-1");
      const id2 = deviceId("phone-2");

      await registry.connect(user1).registerNode(id1, 1);
      await registry.connect(user1).registerNode(id2, 1);

      const devices = await registry.getOwnerDevices(user1.address);
      expect(devices.length).to.equal(2);
      expect(devices[0]).to.equal(id1);
      expect(devices[1]).to.equal(id2);
      expect(await registry.getOwnerDeviceCount(user1.address)).to.equal(2);
    });

    it("should reject duplicate device ID", async function () {
      const id = deviceId("phone-1");
      await registry.connect(user1).registerNode(id, 1);

      await expect(
        registry.connect(user2).registerNode(id, 1)
      ).to.be.revertedWith("Registry: device already registered");
    });

    it("should reject empty device ID", async function () {
      await expect(
        registry.connect(user1).registerNode(ethers.ZeroHash, 1)
      ).to.be.revertedWith("Registry: empty device ID");
    });

    it("should reject invalid tier", async function () {
      const id = deviceId("phone-1");
      await expect(
        registry.connect(user1).registerNode(id, 0)
      ).to.be.revertedWith("Registry: invalid tier");

      await expect(
        registry.connect(user1).registerNode(id, 3)
      ).to.be.revertedWith("Registry: invalid tier");
    });
  });

  describe("Node Deactivation", function () {
    it("should deactivate a node", async function () {
      const id = deviceId("phone-1");
      await registry.connect(user1).registerNode(id, 1);
      await registry.connect(user1).deactivateNode(id);

      const node = await registry.nodes(id);
      expect(node.active).to.be.false;
      expect(await registry.totalNodes()).to.equal(0);
      expect(await registry.isActiveNode(id)).to.be.false;
    });

    it("should decrement validator count when deactivating tier 2", async function () {
      const id = deviceId("desktop-1");
      await registry.connect(validator1).registerNode(id, 2);
      expect(await registry.totalValidators()).to.equal(1);

      await registry.connect(validator1).deactivateNode(id);
      expect(await registry.totalValidators()).to.equal(0);
    });

    it("should emit NodeDeactivated event", async function () {
      const id = deviceId("phone-1");
      await registry.connect(user1).registerNode(id, 1);

      await expect(registry.connect(user1).deactivateNode(id))
        .to.emit(registry, "NodeDeactivated")
        .withArgs(id, user1.address);
    });

    it("should reject deactivation by non-owner", async function () {
      const id = deviceId("phone-1");
      await registry.connect(user1).registerNode(id, 1);

      await expect(
        registry.connect(user2).deactivateNode(id)
      ).to.be.revertedWith("Registry: not your device");
    });

    it("should reject deactivating already inactive node", async function () {
      const id = deviceId("phone-1");
      await registry.connect(user1).registerNode(id, 1);
      await registry.connect(user1).deactivateNode(id);

      await expect(
        registry.connect(user1).deactivateNode(id)
      ).to.be.revertedWith("Registry: already inactive");
    });
  });

  describe("School Registration", function () {
    it("should register a school with multiple devices", async function () {
      const devices = [deviceId("school-phone-1"), deviceId("school-phone-2"), deviceId("school-phone-3")];
      await registry.connect(user1).registerSchool("Lincoln High", devices);

      expect(await registry.totalSchools()).to.equal(1);
      expect(await registry.totalNodes()).to.equal(3);
      expect(await registry.getOwnerDeviceCount(user1.address)).to.equal(3);
    });

    it("should emit SchoolRegistered event", async function () {
      const devices = [deviceId("school-1"), deviceId("school-2")];
      const schoolId = ethers.keccak256(
        ethers.solidityPacked(["string", "address"], ["Lincoln High", user1.address])
      );

      await expect(registry.connect(user1).registerSchool("Lincoln High", devices))
        .to.emit(registry, "SchoolRegistered")
        .withArgs(schoolId, "Lincoln High", user1.address, 2);
    });

    it("should link devices to school ID", async function () {
      const devices = [deviceId("school-1"), deviceId("school-2")];
      const schoolId = ethers.keccak256(
        ethers.solidityPacked(["string", "address"], ["Lincoln High", user1.address])
      );

      await registry.connect(user1).registerSchool("Lincoln High", devices);

      expect(await registry.deviceSchool(devices[0])).to.equal(schoolId);
      expect(await registry.deviceSchool(devices[1])).to.equal(schoolId);
    });

    it("should store school data", async function () {
      const devices = [deviceId("school-1")];
      const schoolId = ethers.keccak256(
        ethers.solidityPacked(["string", "address"], ["Lincoln High", user1.address])
      );

      await registry.connect(user1).registerSchool("Lincoln High", devices);

      const school = await registry.schools(schoolId);
      expect(school.name).to.equal("Lincoln High");
      expect(school.admin).to.equal(user1.address);
      expect(school.nodeCount).to.equal(1);
    });

    it("should reject empty school name", async function () {
      await expect(
        registry.connect(user1).registerSchool("", [deviceId("phone-1")])
      ).to.be.revertedWith("Registry: empty name");
    });

    it("should reject empty device array", async function () {
      await expect(
        registry.connect(user1).registerSchool("Lincoln High", [])
      ).to.be.revertedWith("Registry: no devices");
    });

    it("should reject duplicate school by same admin", async function () {
      const devices1 = [deviceId("school-1")];
      const devices2 = [deviceId("school-2")];

      await registry.connect(user1).registerSchool("Lincoln High", devices1);

      await expect(
        registry.connect(user1).registerSchool("Lincoln High", devices2)
      ).to.be.revertedWith("Registry: school exists");
    });

    it("should allow same school name from different admins", async function () {
      await registry.connect(user1).registerSchool("Lincoln High", [deviceId("s1")]);
      await registry.connect(user2).registerSchool("Lincoln High", [deviceId("s2")]);

      expect(await registry.totalSchools()).to.equal(2);
    });

    it("should reject if any device already registered", async function () {
      const existingId = deviceId("existing-phone");
      await registry.connect(user2).registerNode(existingId, 1);

      await expect(
        registry.connect(user1).registerSchool("Lincoln High", [existingId])
      ).to.be.revertedWith("Registry: device already registered");
    });
  });

  describe("Validator Staking", function () {
    beforeEach(async function () {
      // Approve registry to spend validator tokens
      const registryAddr = await registry.getAddress();
      await token.connect(validator1).approve(registryAddr, ethers.parseEther("100000"));
      await token.connect(validator2).approve(registryAddr, ethers.parseEther("100000"));
    });

    it("should accept a valid stake", async function () {
      await registry.connect(validator1).stakeForValidation(MIN_STAKE);

      expect(await registry.validatorStake(validator1.address)).to.equal(MIN_STAKE);
      expect(await registry.totalStaked()).to.equal(MIN_STAKE);
      expect(await registry.isStakedValidator(validator1.address)).to.be.true;
    });

    it("should emit StakeDeposited event", async function () {
      await expect(registry.connect(validator1).stakeForValidation(MIN_STAKE))
        .to.emit(registry, "StakeDeposited")
        .withArgs(validator1.address, MIN_STAKE);
    });

    it("should allow staking more than minimum", async function () {
      const amount = ethers.parseEther("50000");
      await registry.connect(validator1).stakeForValidation(amount);
      expect(await registry.validatorStake(validator1.address)).to.equal(amount);
    });

    it("should allow adding to existing stake", async function () {
      await registry.connect(validator1).stakeForValidation(MIN_STAKE);
      await registry.connect(validator1).stakeForValidation(MIN_STAKE);

      expect(await registry.validatorStake(validator1.address)).to.equal(MIN_STAKE * 2n);
      expect(await registry.totalStaked()).to.equal(MIN_STAKE * 2n);
    });

    it("should reject stake below minimum", async function () {
      const tooLow = ethers.parseEther("999");
      await expect(
        registry.connect(validator1).stakeForValidation(tooLow)
      ).to.be.revertedWith("Registry: below minimum stake");
    });

    it("should allow unstaking", async function () {
      await registry.connect(validator1).stakeForValidation(MIN_STAKE);

      const balanceBefore = await token.balanceOf(validator1.address);
      await registry.connect(validator1).unstake(MIN_STAKE);

      expect(await registry.validatorStake(validator1.address)).to.equal(0);
      expect(await token.balanceOf(validator1.address)).to.equal(balanceBefore + MIN_STAKE);
      expect(await registry.isStakedValidator(validator1.address)).to.be.false;
    });

    it("should emit StakeWithdrawn event", async function () {
      await registry.connect(validator1).stakeForValidation(MIN_STAKE);
      await expect(registry.connect(validator1).unstake(MIN_STAKE))
        .to.emit(registry, "StakeWithdrawn")
        .withArgs(validator1.address, MIN_STAKE);
    });

    it("should reject unstaking more than staked", async function () {
      await registry.connect(validator1).stakeForValidation(MIN_STAKE);

      await expect(
        registry.connect(validator1).unstake(MIN_STAKE + 1n)
      ).to.be.revertedWith("Registry: insufficient stake");
    });

    it("should reject unstaking zero", async function () {
      await expect(
        registry.connect(validator1).unstake(0)
      ).to.be.revertedWith("Registry: zero amount");
    });
  });

  describe("Slashing", function () {
    beforeEach(async function () {
      const registryAddr = await registry.getAddress();
      await token.connect(validator1).approve(registryAddr, ethers.parseEther("100000"));
      await registry.connect(validator1).stakeForValidation(ethers.parseEther("10000"));
    });

    it("should slash a validator's stake", async function () {
      const slashAmount = ethers.parseEther("5000");
      await registry.slashValidator(validator1.address, slashAmount, "Approved fake earthquake data");

      expect(await registry.validatorStake(validator1.address)).to.equal(
        ethers.parseEther("5000")
      );
    });

    it("should reduce reputation on slash", async function () {
      // Set initial reputation
      await registry.setReputation(validator1.address, 50);

      await registry.slashValidator(validator1.address, ethers.parseEther("1000"), "Bad data");
      expect(await registry.reputation(validator1.address)).to.equal(40); // 50 - 10
    });

    it("should floor reputation at zero when slashing", async function () {
      await registry.setReputation(validator1.address, 5);
      await registry.slashValidator(validator1.address, ethers.parseEther("1000"), "Bad data");
      expect(await registry.reputation(validator1.address)).to.equal(0);
    });

    it("should emit ValidatorSlashed and ReputationUpdated events", async function () {
      const amount = ethers.parseEther("1000");
      await expect(registry.slashValidator(validator1.address, amount, "Fake data"))
        .to.emit(registry, "ValidatorSlashed")
        .withArgs(validator1.address, amount, "Fake data")
        .and.to.emit(registry, "ReputationUpdated");
    });

    it("should reject slash exceeding stake", async function () {
      await expect(
        registry.slashValidator(
          validator1.address,
          ethers.parseEther("99999"),
          "Too much"
        )
      ).to.be.revertedWith("Registry: slash exceeds stake");
    });

    it("should reject slash with zero amount", async function () {
      await expect(
        registry.slashValidator(validator1.address, 0, "Zero")
      ).to.be.revertedWith("Registry: zero amount");
    });

    it("should reject slash without reason", async function () {
      await expect(
        registry.slashValidator(validator1.address, ethers.parseEther("1000"), "")
      ).to.be.revertedWith("Registry: reason required");
    });

    it("should only allow owner to slash", async function () {
      await expect(
        registry.connect(user1).slashValidator(
          validator1.address,
          ethers.parseEther("1000"),
          "Unauthorized"
        )
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should reduce totalStaked on slash", async function () {
      const stakedBefore = await registry.totalStaked();
      const slashAmount = ethers.parseEther("3000");

      await registry.slashValidator(validator1.address, slashAmount, "Penalty");
      expect(await registry.totalStaked()).to.equal(stakedBefore - slashAmount);
    });
  });

  describe("Reputation", function () {
    it("should set reputation for a node", async function () {
      await registry.setReputation(user1.address, 100);
      expect(await registry.reputation(user1.address)).to.equal(100);
    });

    it("should emit ReputationUpdated event", async function () {
      await expect(registry.setReputation(user1.address, 42))
        .to.emit(registry, "ReputationUpdated")
        .withArgs(user1.address, 42);
    });

    it("should batch update reputation", async function () {
      await registry.setReputationBatch(
        [user1.address, user2.address, validator1.address],
        [100, 200, 300]
      );

      expect(await registry.reputation(user1.address)).to.equal(100);
      expect(await registry.reputation(user2.address)).to.equal(200);
      expect(await registry.reputation(validator1.address)).to.equal(300);
    });

    it("should reject batch with length mismatch", async function () {
      await expect(
        registry.setReputationBatch([user1.address], [100, 200])
      ).to.be.revertedWith("Registry: length mismatch");
    });

    it("should only allow owner to set reputation", async function () {
      await expect(
        registry.connect(user1).setReputation(user1.address, 999)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("should report isActiveNode correctly", async function () {
      const id = deviceId("phone-1");
      expect(await registry.isActiveNode(id)).to.be.false;

      await registry.connect(user1).registerNode(id, 1);
      expect(await registry.isActiveNode(id)).to.be.true;

      await registry.connect(user1).deactivateNode(id);
      expect(await registry.isActiveNode(id)).to.be.false;
    });

    it("should report isStakedValidator correctly", async function () {
      expect(await registry.isStakedValidator(validator1.address)).to.be.false;

      const registryAddr = await registry.getAddress();
      await token.connect(validator1).approve(registryAddr, MIN_STAKE);
      await registry.connect(validator1).stakeForValidation(MIN_STAKE);

      expect(await registry.isStakedValidator(validator1.address)).to.be.true;
    });
  });
});
