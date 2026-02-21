const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("POHToken", function () {
  let token, owner, charity, liquidity, user1, user2, ammPair;
  const MAX_SUPPLY = ethers.parseEther("24526000000"); // 24.526B

  beforeEach(async function () {
    [owner, charity, liquidity, user1, user2, ammPair] = await ethers.getSigners();
    const POHToken = await ethers.getContractFactory("POHToken");
    token = await POHToken.deploy(charity.address, liquidity.address);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should mint MAX_SUPPLY to deployer", async function () {
      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
      expect(await token.balanceOf(owner.address)).to.equal(MAX_SUPPLY);
    });

    it("should set correct name and symbol", async function () {
      expect(await token.name()).to.equal("Pursuit of Happiness");
      expect(await token.symbol()).to.equal("POH");
    });

    it("should set charity and liquidity wallets", async function () {
      expect(await token.charityWallet()).to.equal(charity.address);
      expect(await token.liquidityWallet()).to.equal(liquidity.address);
    });

    it("should exempt owner, contract, charity, liquidity from fees", async function () {
      expect(await token.isFeeExempt(owner.address)).to.be.true;
      expect(await token.isFeeExempt(await token.getAddress())).to.be.true;
      expect(await token.isFeeExempt(charity.address)).to.be.true;
      expect(await token.isFeeExempt(liquidity.address)).to.be.true;
    });

    it("should set correct anti-whale limits", async function () {
      expect(await token.maxWallet()).to.equal((MAX_SUPPLY * 2n) / 100n);
      expect(await token.maxTx()).to.equal((MAX_SUPPLY * 1n) / 100n);
    });
  });

  describe("Fee-free transfers (exempt addresses)", function () {
    it("should transfer without fees from owner", async function () {
      const amount = ethers.parseEther("1000000");
      await token.transfer(user1.address, amount);
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });
  });

  describe("Transfer fees (non-exempt)", function () {
    const transferAmount = ethers.parseEther("100000");

    beforeEach(async function () {
      // Give user1 some tokens (owner is fee-exempt, so no fee on this)
      await token.transfer(user1.address, ethers.parseEther("10000000"));
    });

    it("should charge 0.5% transfer fee to charity", async function () {
      const charityBefore = await token.balanceOf(charity.address);
      await token.connect(user1).transfer(user2.address, transferAmount);

      const expectedFee = (transferAmount * 50n) / 10000n; // 0.5%
      const expectedReceived = transferAmount - expectedFee;

      expect(await token.balanceOf(user2.address)).to.equal(expectedReceived);
      expect(await token.balanceOf(charity.address) - charityBefore).to.equal(expectedFee);
    });
  });

  describe("Buy fees (from AMM pair)", function () {
    const buyAmount = ethers.parseEther("100000");

    beforeEach(async function () {
      // Set up AMM pair and fund it
      await token.setAutomatedMarketMaker(ammPair.address, true);
      await token.transfer(ammPair.address, ethers.parseEther("1000000000")); // 1B to pair
    });

    it("should charge 1% buy fee (0.5% charity + 0.5% liquidity)", async function () {
      const charityBefore = await token.balanceOf(charity.address);
      const liquidityBefore = await token.balanceOf(liquidity.address);

      // Simulate a buy: pair sends tokens to user1
      await token.connect(ammPair).transfer(user1.address, buyAmount);

      const charityFee = (buyAmount * 50n) / 10000n;   // 0.5%
      const liquidityFee = (buyAmount * 50n) / 10000n;  // 0.5%
      const expectedReceived = buyAmount - charityFee - liquidityFee;

      expect(await token.balanceOf(user1.address)).to.equal(expectedReceived);
      expect(await token.balanceOf(charity.address) - charityBefore).to.equal(charityFee);
      expect(await token.balanceOf(liquidity.address) - liquidityBefore).to.equal(liquidityFee);
    });
  });

  describe("Sell fees (to AMM pair)", function () {
    const sellAmount = ethers.parseEther("100000");

    beforeEach(async function () {
      await token.setAutomatedMarketMaker(ammPair.address, true);
      // Give user1 tokens (from owner, no fee)
      await token.transfer(user1.address, ethers.parseEther("10000000"));
    });

    it("should charge 3% sell fee (1.5% charity + 1% burn + 0.5% liquidity)", async function () {
      const charityBefore = await token.balanceOf(charity.address);
      const liquidityBefore = await token.balanceOf(liquidity.address);
      const supplyBefore = await token.totalSupply();

      // Simulate a sell: user1 sends tokens to pair
      await token.connect(user1).transfer(ammPair.address, sellAmount);

      const charityFee = (sellAmount * 150n) / 10000n;    // 1.5%
      const burnFee = (sellAmount * 100n) / 10000n;        // 1.0%
      const liquidityFee = (sellAmount * 50n) / 10000n;    // 0.5%
      const expectedReceived = sellAmount - charityFee - burnFee - liquidityFee;

      expect(await token.balanceOf(ammPair.address)).to.equal(expectedReceived);
      expect(await token.balanceOf(charity.address) - charityBefore).to.equal(charityFee);
      expect(await token.balanceOf(liquidity.address) - liquidityBefore).to.equal(liquidityFee);
      expect(supplyBefore - await token.totalSupply()).to.equal(burnFee); // burned
    });
  });

  describe("Anti-whale", function () {
    it("should block transfers exceeding maxTx", async function () {
      const overMaxTx = (MAX_SUPPLY * 1n) / 100n + 1n;
      // Give user1 enough tokens
      await token.transfer(user1.address, overMaxTx);

      await expect(
        token.connect(user1).transfer(user2.address, overMaxTx)
      ).to.be.revertedWith("POH: exceeds max transaction");
    });

    it("should block receives exceeding maxWallet", async function () {
      const maxWallet = (MAX_SUPPLY * 2n) / 100n;
      // Transfer just under max wallet to user2
      await token.transfer(user2.address, maxWallet);
      // Send 1 more token (from user1 who has no fee exemption)
      await token.transfer(user1.address, ethers.parseEther("10000000"));

      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("1000000"))
      ).to.be.revertedWith("POH: exceeds max wallet");
    });

    it("should exempt max-wallet addresses", async function () {
      await token.setMaxWalletExempt(user2.address, true);
      const overMaxWallet = (MAX_SUPPLY * 3n) / 100n;
      await token.transfer(user2.address, overMaxWallet);
      expect(await token.balanceOf(user2.address)).to.equal(overMaxWallet);
    });
  });

  describe("Pause", function () {
    it("should block transfers when paused", async function () {
      await token.transfer(user1.address, ethers.parseEther("1000000"));
      await token.pause();

      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("should resume after unpause", async function () {
      await token.transfer(user1.address, ethers.parseEther("1000000"));
      await token.pause();
      await token.unpause();

      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.not.be.reverted;
    });

    it("should only allow owner to pause", async function () {
      await expect(
        token.connect(user1).pause()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Admin functions", function () {
    it("should update charity wallet", async function () {
      await token.setCharityWallet(user1.address);
      expect(await token.charityWallet()).to.equal(user1.address);
      expect(await token.isFeeExempt(user1.address)).to.be.true;
    });

    it("should update liquidity wallet", async function () {
      await token.setLiquidityWallet(user1.address);
      expect(await token.liquidityWallet()).to.equal(user1.address);
      expect(await token.isFeeExempt(user1.address)).to.be.true;
    });

    it("should reject anti-whale limits below 0.5%", async function () {
      const tooLow = MAX_SUPPLY / 201n;
      await expect(
        token.setAntiWhaleLimits(tooLow, tooLow)
      ).to.be.revertedWith("POH: max wallet too low");
    });
  });
});

describe("POHVesting", function () {
  let token, vesting, owner, beneficiary;
  const allocation = ethers.parseEther("2452600000"); // 10% of supply
  const CLIFF = 180 * 24 * 60 * 60; // 180 days in seconds
  const VESTING = 1460 * 24 * 60 * 60; // 1460 days in seconds

  beforeEach(async function () {
    [owner, beneficiary] = await ethers.getSigners();

    const POHToken = await ethers.getContractFactory("POHToken");
    token = await POHToken.deploy(owner.address, owner.address);
    await token.waitForDeployment();

    const POHVesting = await ethers.getContractFactory("POHVesting");
    vesting = await POHVesting.deploy(
      await token.getAddress(),
      beneficiary.address,
      allocation
    );
    await vesting.waitForDeployment();

    // Fund the vesting contract
    const vestingAddr = await vesting.getAddress();
    await token.setFeeExempt(vestingAddr, true);
    await token.setMaxWalletExempt(vestingAddr, true);
    await token.transfer(vestingAddr, allocation);

    // Beneficiary (founder) must be max-wallet exempt to receive vested tokens
    await token.setMaxWalletExempt(beneficiary.address, true);
  });

  it("should start with zero vested during cliff", async function () {
    expect(await vesting.vestedAmount()).to.equal(0);
    expect(await vesting.releasable()).to.equal(0);
  });

  it("should not allow release during cliff", async function () {
    await expect(vesting.release()).to.be.revertedWith("Vesting: nothing to release");
  });

  it("should vest tokens linearly after cliff", async function () {
    // Move past cliff
    await time.increase(CLIFF + 1);
    const vested = await vesting.vestedAmount();
    expect(vested).to.be.gt(0);

    // Move to 50% of vesting period
    await time.increase(VESTING / 2);
    const halfVested = await vesting.vestedAmount();
    // Should be roughly 50% of allocation (within rounding)
    expect(halfVested).to.be.closeTo(allocation / 2n, ethers.parseEther("100"));
  });

  it("should allow release after cliff", async function () {
    await time.increase(CLIFF + VESTING / 4); // 25% through vesting
    const releasableAmount = await vesting.releasable();
    expect(releasableAmount).to.be.gt(0);

    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.be.gt(0);
    expect(await vesting.released()).to.be.gt(0);
  });

  it("should vest 100% after full period", async function () {
    await time.increase(CLIFF + VESTING + 1);
    expect(await vesting.vestedAmount()).to.equal(allocation);
    expect(await vesting.releasable()).to.equal(allocation);

    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(allocation);
  });

  it("should report correct time until cliff", async function () {
    const remaining = await vesting.timeUntilCliff();
    expect(remaining).to.be.closeTo(BigInt(CLIFF), 5n);
  });
});

describe("POHCharity", function () {
  let token, charity, owner, recipient;

  beforeEach(async function () {
    [owner, recipient] = await ethers.getSigners();

    const POHToken = await ethers.getContractFactory("POHToken");
    token = await POHToken.deploy(owner.address, owner.address);
    await token.waitForDeployment();

    const POHCharity = await ethers.getContractFactory("POHCharity");
    charity = await POHCharity.deploy();
    await charity.waitForDeployment();

    // Fund charity with tokens
    const charityAddr = await charity.getAddress();
    await token.setFeeExempt(charityAddr, true);
    await token.setMaxWalletExempt(charityAddr, true);
    await token.transfer(charityAddr, ethers.parseEther("1000000"));
  });

  it("should create a proposal", async function () {
    const tokenAddr = await token.getAddress();
    await charity.propose(
      tokenAddr,
      recipient.address,
      ethers.parseEther("1000"),
      "Donation to water.org"
    );
    expect(await charity.proposalCount()).to.equal(1);
  });

  it("should not execute before timelock expires", async function () {
    const tokenAddr = await token.getAddress();
    await charity.propose(
      tokenAddr,
      recipient.address,
      ethers.parseEther("1000"),
      "Donation to water.org"
    );

    await expect(charity.execute(0)).to.be.revertedWith("Charity: timelock not expired");
  });

  it("should execute after timelock", async function () {
    const tokenAddr = await token.getAddress();
    await charity.propose(
      tokenAddr,
      recipient.address,
      ethers.parseEther("1000"),
      "Donation to water.org"
    );

    // Advance past 24hr timelock
    await time.increase(24 * 60 * 60 + 1);
    await charity.execute(0);

    expect(await token.balanceOf(recipient.address)).to.equal(ethers.parseEther("1000"));
    const proposal = await charity.getProposal(0);
    expect(proposal.executed).to.be.true;
  });

  it("should cancel a proposal", async function () {
    const tokenAddr = await token.getAddress();
    await charity.propose(
      tokenAddr,
      recipient.address,
      ethers.parseEther("1000"),
      "Donation to water.org"
    );
    await charity.cancel(0);

    const proposal = await charity.getProposal(0);
    expect(proposal.cancelled).to.be.true;

    await time.increase(24 * 60 * 60 + 1);
    await expect(charity.execute(0)).to.be.revertedWith("Charity: cancelled");
  });

  it("should distribute ETH", async function () {
    // Fund charity with ETH
    await owner.sendTransaction({
      to: await charity.getAddress(),
      value: ethers.parseEther("1"),
    });

    await charity.propose(
      ethers.ZeroAddress, // ETH
      recipient.address,
      ethers.parseEther("0.5"),
      "ETH donation to charity"
    );

    await time.increase(24 * 60 * 60 + 1);

    const balanceBefore = await ethers.provider.getBalance(recipient.address);
    await charity.execute(0);
    const balanceAfter = await ethers.provider.getBalance(recipient.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("0.5"));
  });

  it("should only allow owner to propose", async function () {
    const tokenAddr = await token.getAddress();
    await expect(
      charity.connect(recipient).propose(
        tokenAddr,
        recipient.address,
        ethers.parseEther("1000"),
        "Unauthorized"
      )
    ).to.be.revertedWithCustomError(charity, "OwnableUnauthorizedAccount");
  });
});
