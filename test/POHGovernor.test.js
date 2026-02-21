const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("POHGovernor", function () {
  let token, governor, timelock;
  let owner, voter1, voter2, voter3, recipient;
  const MAX_SUPPLY = ethers.parseEther("24526000000");
  const PROPOSAL_THRESHOLD = ethers.parseEther("24526000"); // 0.1%
  const VOTING_DELAY = 7200n;  // blocks
  const VOTING_PERIOD = 50400n; // blocks
  const TIMELOCK_DELAY = 48 * 60 * 60; // 48 hours in seconds

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, recipient] = await ethers.getSigners();

    // Deploy POHToken
    const POHToken = await ethers.getContractFactory("POHToken");
    token = await POHToken.deploy(owner.address, owner.address);
    await token.waitForDeployment();

    // Deploy TimelockController
    // constructor(uint256 minDelay, address[] proposers, address[] executors, address admin)
    // We'll set governor as proposer/executor after deployment
    const TimelockController = await ethers.getContractFactory("TimelockController");
    timelock = await TimelockController.deploy(
      TIMELOCK_DELAY,
      [], // proposers — will add governor after
      [], // executors — will add governor after
      owner.address // admin — will renounce after setup
    );
    await timelock.waitForDeployment();

    // Deploy Governor
    const POHGovernor = await ethers.getContractFactory("POHGovernor");
    governor = await POHGovernor.deploy(
      await token.getAddress(),
      await timelock.getAddress()
    );
    await governor.waitForDeployment();

    const governorAddr = await governor.getAddress();

    // Grant governor the proposer and executor roles on timelock
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    await timelock.grantRole(PROPOSER_ROLE, governorAddr);
    await timelock.grantRole(EXECUTOR_ROLE, governorAddr);

    // Distribute tokens to voters
    // voter1: 5% of supply (enough for proposals)
    // voter2: 3% of supply
    // voter3: 1% of supply
    await token.setMaxWalletExempt(voter1.address, true);
    await token.setMaxWalletExempt(voter2.address, true);
    await token.transfer(voter1.address, ethers.parseEther("1226300000"));  // 5%
    await token.transfer(voter2.address, ethers.parseEther("735780000"));   // 3%
    await token.transfer(voter3.address, ethers.parseEther("245260000"));   // 1%

    // Voters must delegate to themselves to activate voting power
    await token.connect(voter1).delegate(voter1.address);
    await token.connect(voter2).delegate(voter2.address);
    await token.connect(voter3).delegate(voter3.address);
    await token.delegate(owner.address); // owner self-delegates too
  });

  describe("Deployment", function () {
    it("should set correct voting delay", async function () {
      expect(await governor.votingDelay()).to.equal(VOTING_DELAY);
    });

    it("should set correct voting period", async function () {
      expect(await governor.votingPeriod()).to.equal(VOTING_PERIOD);
    });

    it("should set correct proposal threshold", async function () {
      expect(await governor.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
    });

    it("should set correct quorum numerator (4%)", async function () {
      expect(await governor.quorumNumerator()).to.equal(4);
    });

    it("should set governor name", async function () {
      expect(await governor.name()).to.equal("POHGovernor");
    });

    it("should link to the correct token", async function () {
      expect(await governor.token()).to.equal(await token.getAddress());
    });
  });

  describe("Delegation", function () {
    it("should track voting power after delegation", async function () {
      // Mine a block so checkpoints are registered
      await mine(1);
      const voter1Votes = await token.getVotes(voter1.address);
      expect(voter1Votes).to.equal(ethers.parseEther("1226300000"));
    });

    it("should allow delegating to another address", async function () {
      await token.connect(voter3).delegate(voter1.address);
      await mine(1);
      const voter1Votes = await token.getVotes(voter1.address);
      // voter1's own tokens + voter3's delegated tokens
      expect(voter1Votes).to.equal(
        ethers.parseEther("1226300000") + ethers.parseEther("245260000")
      );
    });
  });

  describe("Proposal Creation", function () {
    it("should allow creating a proposal", async function () {
      const calldata = token.interface.encodeFunctionData("setCharityWallet", [recipient.address]);
      const description = "Change charity wallet";

      await mine(1); // ensure delegation checkpoint

      const tx = await governor.connect(voter1).propose(
        [await token.getAddress()],
        [0],
        [calldata],
        description
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "ProposalCreated"
      );
      expect(event).to.not.be.undefined;
    });

    it("should reject proposals below threshold", async function () {
      const calldata = token.interface.encodeFunctionData("setCharityWallet", [recipient.address]);
      // voter3 has 1% which is above 0.1% threshold — need someone with less
      // Actually all our voters exceed threshold. Let's test with a fresh wallet
      const [, , , , , newUser] = await ethers.getSigners();
      await token.transfer(newUser.address, ethers.parseEther("1000")); // way below threshold
      await token.connect(newUser).delegate(newUser.address);
      await mine(1);

      await expect(
        governor.connect(newUser).propose(
          [await token.getAddress()],
          [0],
          [calldata],
          "Should fail"
        )
      ).to.be.revertedWithCustomError(governor, "GovernorInsufficientProposerVotes");
    });
  });

  describe("Voting", function () {
    let proposalId;

    beforeEach(async function () {
      const calldata = token.interface.encodeFunctionData("setCharityWallet", [recipient.address]);
      await mine(1);

      const tx = await governor.connect(voter1).propose(
        [await token.getAddress()],
        [0],
        [calldata],
        "Change charity wallet to recipient"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "ProposalCreated"
      );
      proposalId = event.args.proposalId;

      // Advance past voting delay
      await mine(Number(VOTING_DELAY) + 1);
    });

    it("should allow casting a vote (For)", async function () {
      // 1 = For
      await governor.connect(voter1).castVote(proposalId, 1);
      expect(await governor.hasVoted(proposalId, voter1.address)).to.be.true;
    });

    it("should allow casting a vote (Against)", async function () {
      // 0 = Against
      await governor.connect(voter2).castVote(proposalId, 0);
      expect(await governor.hasVoted(proposalId, voter2.address)).to.be.true;
    });

    it("should allow casting a vote (Abstain)", async function () {
      // 2 = Abstain
      await governor.connect(voter3).castVote(proposalId, 2);
      expect(await governor.hasVoted(proposalId, voter3.address)).to.be.true;
    });

    it("should reject double voting", async function () {
      await governor.connect(voter1).castVote(proposalId, 1);
      await expect(
        governor.connect(voter1).castVote(proposalId, 1)
      ).to.be.revertedWithCustomError(governor, "GovernorAlreadyCastVote");
    });

    it("should track vote counts correctly", async function () {
      await governor.connect(voter1).castVote(proposalId, 1); // For
      await governor.connect(voter2).castVote(proposalId, 0); // Against
      await governor.connect(voter3).castVote(proposalId, 2); // Abstain

      const [against, forVotes, abstain] = await governor.proposalVotes(proposalId);
      expect(forVotes).to.equal(ethers.parseEther("1226300000"));
      expect(against).to.equal(ethers.parseEther("735780000"));
      expect(abstain).to.equal(ethers.parseEther("245260000"));
    });
  });

  describe("Proposal State Transitions", function () {
    let proposalId;

    beforeEach(async function () {
      const calldata = token.interface.encodeFunctionData("setCharityWallet", [recipient.address]);
      await mine(1);

      const tx = await governor.connect(voter1).propose(
        [await token.getAddress()],
        [0],
        [calldata],
        "Change charity wallet"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "ProposalCreated"
      );
      proposalId = event.args.proposalId;
    });

    it("should be in Pending state initially", async function () {
      expect(await governor.state(proposalId)).to.equal(0); // Pending
    });

    it("should be in Active state after voting delay", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      expect(await governor.state(proposalId)).to.equal(1); // Active
    });

    it("should be in Defeated state if quorum not met", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      // Only voter3 votes (1% < 4% quorum)
      await governor.connect(voter3).castVote(proposalId, 1);
      await mine(Number(VOTING_PERIOD) + 1);
      expect(await governor.state(proposalId)).to.equal(3); // Defeated
    });

    it("should be in Defeated state if more Against votes", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      // voter1 (5%) votes For, voter2 (3%) votes Against — but owner also needs to push quorum
      await governor.connect(voter1).castVote(proposalId, 0); // Against
      await governor.connect(voter2).castVote(proposalId, 1); // For
      await mine(Number(VOTING_PERIOD) + 1);
      expect(await governor.state(proposalId)).to.equal(3); // Defeated (more against)
    });

    it("should be in Succeeded state if quorum met and majority For", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      // voter1 (5%) + voter2 (3%) = 8% > 4% quorum, both vote For
      await governor.connect(voter1).castVote(proposalId, 1);
      await governor.connect(voter2).castVote(proposalId, 1);
      await mine(Number(VOTING_PERIOD) + 1);
      expect(await governor.state(proposalId)).to.equal(4); // Succeeded
    });
  });

  describe("Full Governance Flow (propose → vote → queue → execute)", function () {
    it("should execute a proposal through the full lifecycle", async function () {
      // Transfer token ownership to timelock so governance can control it
      await token.transferOwnership(await timelock.getAddress());

      const calldata = token.interface.encodeFunctionData("setCharityWallet", [recipient.address]);
      const targets = [await token.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Change charity wallet to recipient";

      await mine(1);

      // 1. Propose
      const tx = await governor.connect(voter1).propose(targets, values, calldatas, description);
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated");
      const proposalId = event.args.proposalId;

      // 2. Wait for voting delay
      await mine(Number(VOTING_DELAY) + 1);

      // 3. Vote (voter1 + voter2 = 8% > 4% quorum)
      await governor.connect(voter1).castVote(proposalId, 1);
      await governor.connect(voter2).castVote(proposalId, 1);

      // 4. Wait for voting period to end
      await mine(Number(VOTING_PERIOD) + 1);
      expect(await governor.state(proposalId)).to.equal(4); // Succeeded

      // 5. Queue through timelock
      const descHash = ethers.id(description);
      await governor.queue(targets, values, calldatas, descHash);
      expect(await governor.state(proposalId)).to.equal(5); // Queued

      // 6. Wait for timelock delay
      await time.increase(TIMELOCK_DELAY + 1);

      // 7. Execute
      await governor.execute(targets, values, calldatas, descHash);
      expect(await governor.state(proposalId)).to.equal(7); // Executed

      // 8. Verify the action was performed
      expect(await token.charityWallet()).to.equal(recipient.address);
    });

    it("should reject execution before timelock expires", async function () {
      await token.transferOwnership(await timelock.getAddress());

      const calldata = token.interface.encodeFunctionData("setCharityWallet", [recipient.address]);
      const targets = [await token.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Change charity wallet";

      await mine(1);
      const tx = await governor.connect(voter1).propose(targets, values, calldatas, description);
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated");
      const proposalId = event.args.proposalId;

      await mine(Number(VOTING_DELAY) + 1);
      await governor.connect(voter1).castVote(proposalId, 1);
      await governor.connect(voter2).castVote(proposalId, 1);
      await mine(Number(VOTING_PERIOD) + 1);

      const descHash = ethers.id(description);
      await governor.queue(targets, values, calldatas, descHash);

      // Try to execute immediately (should fail)
      await expect(
        governor.execute(targets, values, calldatas, descHash)
      ).to.be.reverted;
    });
  });

  describe("Charity Treasury Governance", function () {
    it("should control charity distributions through governance", async function () {
      // Deploy charity and transfer ownership to timelock
      const POHCharity = await ethers.getContractFactory("POHCharity");
      const charity = await POHCharity.deploy();
      await charity.waitForDeployment();
      const charityAddr = await charity.getAddress();

      // Fund charity with tokens
      await token.setFeeExempt(charityAddr, true);
      await token.setMaxWalletExempt(charityAddr, true);
      await token.transfer(charityAddr, ethers.parseEther("1000000"));

      // Transfer charity ownership to timelock
      await charity.transferOwnership(await timelock.getAddress());

      // Create a proposal to make a charity distribution
      const tokenAddr = await token.getAddress();
      const proposeCalldata = charity.interface.encodeFunctionData("propose", [
        tokenAddr,
        recipient.address,
        ethers.parseEther("10000"),
        "Donate to cancer research"
      ]);

      const targets = [charityAddr];
      const values = [0];
      const calldatas = [proposeCalldata];
      const description = "Propose charity donation to cancer research";

      await mine(1);

      // Governance flow
      const tx = await governor.connect(voter1).propose(targets, values, calldatas, description);
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated");
      const proposalId = event.args.proposalId;

      await mine(Number(VOTING_DELAY) + 1);
      await governor.connect(voter1).castVote(proposalId, 1);
      await governor.connect(voter2).castVote(proposalId, 1);
      await mine(Number(VOTING_PERIOD) + 1);

      const descHash = ethers.id(description);
      await governor.queue(targets, values, calldatas, descHash);
      await time.increase(TIMELOCK_DELAY + 1);
      await governor.execute(targets, values, calldatas, descHash);

      // Verify the charity proposal was created
      expect(await charity.proposalCount()).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("should reject voting on non-existent proposal", async function () {
      const fakeId = ethers.id("fake");
      await expect(
        governor.connect(voter1).castVote(fakeId, 1)
      ).to.be.revertedWithCustomError(governor, "GovernorNonexistentProposal");
    });

    it("should reject queueing a non-succeeded proposal", async function () {
      const calldata = token.interface.encodeFunctionData("setCharityWallet", [recipient.address]);
      const targets = [await token.getAddress()];
      const values = [0];
      const calldatas = [calldata];
      const description = "Should not be queueable";

      await mine(1);
      await governor.connect(voter1).propose(targets, values, calldatas, description);

      const descHash = ethers.id(description);
      // Try to queue immediately (still in Pending state)
      await expect(
        governor.queue(targets, values, calldatas, descHash)
      ).to.be.reverted;
    });

    it("should count abstain votes toward quorum", async function () {
      const calldata = token.interface.encodeFunctionData("setCharityWallet", [recipient.address]);
      await mine(1);
      const tx = await governor.connect(voter1).propose(
        [await token.getAddress()], [0], [calldata], "Abstain test"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated");
      const proposalId = event.args.proposalId;

      await mine(Number(VOTING_DELAY) + 1);

      // voter1 votes For (5%), voter2 abstains (3%) — total participation 8% > 4% quorum
      await governor.connect(voter1).castVote(proposalId, 1); // For
      await governor.connect(voter2).castVote(proposalId, 2); // Abstain

      await mine(Number(VOTING_PERIOD) + 1);
      // Should succeed because abstains count toward quorum and there are more For than Against
      expect(await governor.state(proposalId)).to.equal(4); // Succeeded
    });
  });
});
