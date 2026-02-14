const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Raffle Contract (USDC)", function () {
  // Constants — USDC 6 decimals
  const ENTRY_FEE = 1000000; // $1 USDC
  const MAX_PARTICIPANTS = 100;
  const TITLE = "Test Raffle";
  const DESCRIPTION = "Test Description";
  const PRIZE_DESCRIPTION = "Test Prize";

  // Deploy fixture: MockUSDC + MockRaffleFactory + Raffle
  async function deployRaffleFixture() {
    const [owner, creator, user1, user2, user3] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy MockRaffleFactory (needs platformOwner and usdc for IRaffleFactory)
    const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
    const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

    const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

    // Deploy Raffle directly (10 params now)
    const Raffle = await ethers.getContractFactory("Raffle");
    const raffle = await Raffle.deploy(
      TITLE,
      DESCRIPTION,
      PRIZE_DESCRIPTION,
      ENTRY_FEE,
      deadline,
      MAX_PARTICIPANTS,
      creator.address,
      await factory.getAddress(),
      0, // creatorCommissionBps
      await usdc.getAddress()
    );

    // Mint USDC and approve factory for users
    const factoryAddr = await factory.getAddress();
    const mintAmount = ethers.parseUnits("100000", 6);
    for (const account of [owner, creator, user1, user2, user3]) {
      await usdc.mint(account.address, mintAmount);
      await usdc.connect(account).approve(factoryAddr, ethers.MaxUint256);
    }

    return { raffle, factory, usdc, owner, creator, user1, user2, user3, deadline };
  }

  async function deployUnlimitedRaffleFixture() {
    const [owner, creator, user1, user2] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
    const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

    const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

    const Raffle = await ethers.getContractFactory("Raffle");
    const raffle = await Raffle.deploy(
      TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
      ENTRY_FEE, deadline,
      0, // Unlimited
      creator.address,
      await factory.getAddress(),
      0,
      await usdc.getAddress()
    );

    const factoryAddr = await factory.getAddress();
    const mintAmount = ethers.parseUnits("100000", 6);
    for (const account of [owner, creator, user1, user2]) {
      await usdc.mint(account.address, mintAmount);
      await usdc.connect(account).approve(factoryAddr, ethers.MaxUint256);
    }

    return { raffle, factory, usdc, owner, creator, user1, user2, deadline };
  }

  // Helper: join via MockRaffleFactory
  async function joinViaFactory(factory, raffle, user, ticketCount) {
    return factory.joinRaffle(await raffle.getAddress(), user.address, ticketCount);
  }

  describe("Deployment & Validation", function () {
    it("Should deploy with correct parameters", async function () {
      const { raffle, usdc, creator, deadline } = await loadFixture(deployRaffleFixture);

      expect(await raffle.title()).to.equal(TITLE);
      expect(await raffle.description()).to.equal(DESCRIPTION);
      expect(await raffle.entryFee()).to.equal(ENTRY_FEE);
      expect(await raffle.deadline()).to.equal(deadline);
      expect(await raffle.maxParticipants()).to.equal(MAX_PARTICIPANTS);
      expect(await raffle.creator()).to.equal(creator.address);
      expect(await raffle.status()).to.equal(1); // ACTIVE
      expect(await raffle.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should reject deadline in the past", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const pastDeadline = (await time.latest()) - 1;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, ENTRY_FEE,
          pastDeadline, MAX_PARTICIPANTS, creator.address,
          await factory.getAddress(), 0, await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "DeadlineMustBeInFuture");
    });

    it("Should reject deadline > 365 days", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const farDeadline = (await time.latest()) + 366 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, ENTRY_FEE,
          farDeadline, MAX_PARTICIPANTS, creator.address,
          await factory.getAddress(), 0, await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "DeadlineTooFar");
    });

    it("Should reject entry fee < $0.01 (< 10000 raw)", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, 9999, // < $0.01
          deadline, MAX_PARTICIPANTS, creator.address,
          await factory.getAddress(), 0, await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "EntryFeeTooLow");
    });

    it("Should reject entry fee > $10,000 (> 10_000_000_000 raw)", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, 10000000001, // > $10k
          deadline, MAX_PARTICIPANTS, creator.address,
          await factory.getAddress(), 0, await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "EntryFeeTooHigh");
    });

    it("Should reject maxParticipants = 1", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, ENTRY_FEE,
          deadline, 1, creator.address,
          await factory.getAddress(), 0, await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "MinParticipantsTooLow");
    });

    it("Should reject maxParticipants > 10000", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, ENTRY_FEE,
          deadline, 10001, creator.address,
          await factory.getAddress(), 0, await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "MaxParticipantsTooHigh");
    });

    it("Should accept maxParticipants = 0 (unlimited)", async function () {
      const { raffle } = await loadFixture(deployUnlimitedRaffleFixture);
      expect(await raffle.maxParticipants()).to.equal(0);
    });

    it("Should reject zero factory address", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, ENTRY_FEE,
          deadline, MAX_PARTICIPANTS, creator.address,
          ethers.ZeroAddress, 0, await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "InvalidFactoryAddress");
    });

    it("Should reject zero USDC address", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, ENTRY_FEE,
          deadline, MAX_PARTICIPANTS, creator.address,
          await factory.getAddress(), 0, ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(Raffle, "InvalidUSDCAddress");
    });

    it("Should reject commission > 10%", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION, ENTRY_FEE,
          deadline, MAX_PARTICIPANTS, creator.address,
          await factory.getAddress(), 1001, await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "InvalidCommission");
    });
  });

  describe("Register Tickets (via Factory)", function () {
    it("Should register single ticket", async function () {
      const { raffle, factory, user1 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);

      expect(await raffle.getTotalTickets()).to.equal(1);
      expect(await raffle.getUserTicketCount(user1.address)).to.equal(1);
    });

    it("Should register multiple tickets at once", async function () {
      const { raffle, factory, user1 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 5);

      expect(await raffle.getTotalTickets()).to.equal(5);
      expect(await raffle.getUserTicketCount(user1.address)).to.equal(5);
    });

    it("Should track multiple purchases from same user", async function () {
      const { raffle, factory, user1 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 2);
      await joinViaFactory(factory, raffle, user1, 3);

      expect(await raffle.getTotalTickets()).to.equal(5);
      expect(await raffle.getUserTicketCount(user1.address)).to.equal(5);
    });

    it("Should allow different users to join", async function () {
      const { raffle, factory, user1, user2, user3 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 2);
      await joinViaFactory(factory, raffle, user2, 3);
      await joinViaFactory(factory, raffle, user3, 1);

      expect(await raffle.getTotalTickets()).to.equal(6);
      expect(await raffle.getUserTicketCount(user1.address)).to.equal(2);
      expect(await raffle.getUserTicketCount(user2.address)).to.equal(3);
      expect(await raffle.getUserTicketCount(user3.address)).to.equal(1);
    });

    it("Should reject join from non-factory", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      await expect(
        raffle.connect(user1).registerTickets(user1.address, 1)
      ).to.be.revertedWithCustomError(raffle, "OnlyFactory");
    });

    it("Should reject when raffle is full", async function () {
      const { raffle, factory, user1, user2 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, MAX_PARTICIPANTS);

      await expect(
        joinViaFactory(factory, raffle, user2, 1)
      ).to.be.revertedWithCustomError(raffle, "RaffleFull");
    });

    it("Should reject after deadline", async function () {
      const { raffle, factory, user1, deadline } = await loadFixture(deployRaffleFixture);

      await time.increaseTo(deadline + 1);

      await expect(
        joinViaFactory(factory, raffle, user1, 1)
      ).to.be.revertedWithCustomError(raffle, "RaffleEnded");
    });

    it("Should allow unlimited participants when maxParticipants = 0", async function () {
      const { raffle, factory, user1 } = await loadFixture(deployUnlimitedRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 200);
      expect(await raffle.getTotalTickets()).to.equal(200);
    });
  });

  describe("Draw Winner", function () {
    it("Should reject draw before deadline with unfilled raffle", async function () {
      const { raffle, factory, user1 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 5);

      await expect(raffle.drawWinner())
        .to.be.revertedWithCustomError(raffle, "DeadlineNotReached");
    });

    it("Should allow draw when max participants reached", async function () {
      const { raffle, factory, user1 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, MAX_PARTICIPANTS);

      await expect(raffle.drawWinner())
        .to.emit(raffle, "RandomnessRequested");
    });

    it("Should allow draw after deadline", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 3);
      await joinViaFactory(factory, raffle, user2, 2);

      await time.increaseTo(deadline + 1);

      await expect(raffle.drawWinner())
        .to.emit(raffle, "RandomnessRequested");
    });

    it("Should reject draw with no participants", async function () {
      const { raffle, deadline } = await loadFixture(deployRaffleFixture);

      await time.increaseTo(deadline + 1);

      await expect(raffle.drawWinner())
        .to.be.revertedWithCustomError(raffle, "NoParticipants");
    });

    it("Should reject draw with < 2 participants", async function () {
      const { raffle, factory, user1, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await time.increaseTo(deadline + 1);

      await expect(raffle.drawWinner())
        .to.be.revertedWithCustomError(raffle, "NotEnoughParticipants");
    });

    it("Should change status to ENDED", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      await raffle.drawWinner();
      expect(await raffle.status()).to.equal(2); // ENDED
    });

    it("Should allow anyone to call drawWinner", async function () {
      const { raffle, factory, user1, user2, user3, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      await expect(raffle.connect(user3).drawWinner())
        .to.emit(raffle, "RandomnessRequested");
    });
  });

  describe("Fulfill Randomness", function () {
    it("Should only allow factory to fulfill", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      await expect(
        raffle.connect(user1).fulfillRandomness(requestId, 12345)
      ).to.be.revertedWithCustomError(raffle, "OnlyFactory");
    });

    it("Should select winner correctly", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 3);
      await joinViaFactory(factory, raffle, user2, 2);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      const randomNumber = 12345;
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, randomNumber);

      const winner = await raffle.winner();
      const winnerIndex = await raffle.winnerIndex();

      expect(winner).to.not.equal(ethers.ZeroAddress);
      expect(winnerIndex).to.equal(randomNumber % 5); // 5 total tickets
      expect(await raffle.status()).to.equal(3); // DRAWN
    });

    it("Should reject wrong requestId", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      await expect(
        factory.simulateFulfillment(await raffle.getAddress(), requestId + BigInt(1), 12345)
      ).to.be.revertedWithCustomError(raffle, "InvalidRequestId");
    });

    it("Should reject double fulfillment", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 12345);

      await expect(
        factory.simulateFulfillment(await raffle.getAddress(), requestId, 67890)
      ).to.be.revertedWithCustomError(raffle, "WinnerAlreadySet");
    });
  });

  describe("Claim Prize (3-way USDC split)", function () {
    it("Should pay 2% platform fee + remainder to winner (0% commission)", async function () {
      const { raffle, factory, usdc, owner, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 3);
      await joinViaFactory(factory, raffle, user2, 2);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      // Select user1 as winner (randomNumber 0 -> index 0 -> user1)
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();
      expect(winner).to.equal(user1.address);

      const prizePool = BigInt(ENTRY_FEE) * BigInt(5); // $5
      const platformFee = prizePool * BigInt(200) / BigInt(10000); // 2%
      const winnerAmount = prizePool - platformFee;

      const winnerBefore = await usdc.balanceOf(winner);
      const platformBefore = await usdc.balanceOf(owner.address);

      await raffle.connect(user1).claimPrize();

      expect(await usdc.balanceOf(winner) - winnerBefore).to.equal(winnerAmount);
      expect(await usdc.balanceOf(owner.address) - platformBefore).to.equal(platformFee);
    });

    it("Should pay platform fee + creator commission + winner share", async function () {
      const [owner, creator, user1, user2] = await ethers.getSigners();

      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy(owner.address, await usdc.getAddress());

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const entryFee = 10000000; // $10

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = await Raffle.deploy(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION, entryFee, deadline,
        0, creator.address, await factory.getAddress(),
        1000, // 10% commission
        await usdc.getAddress()
      );

      const factoryAddr = await factory.getAddress();
      const mintAmount = ethers.parseUnits("100000", 6);
      for (const account of [owner, creator, user1, user2]) {
        await usdc.mint(account.address, mintAmount);
        await usdc.connect(account).approve(factoryAddr, ethers.MaxUint256);
      }

      await factory.joinRaffle(await raffle.getAddress(), user1.address, 1);
      await factory.joinRaffle(await raffle.getAddress(), user2.address, 1);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();
      const winnerSigner = winner === user1.address ? user1 : user2;

      const prizePool = BigInt(entryFee) * BigInt(2); // $20
      const platformFee = prizePool * BigInt(200) / BigInt(10000); // 2% = $0.40
      const remainder = prizePool - platformFee; // $19.60
      const creatorAmount = remainder * BigInt(1000) / BigInt(10000); // 10% of remainder
      const winnerAmount = remainder - creatorAmount;

      const winnerBefore = await usdc.balanceOf(winner);
      const creatorBefore = await usdc.balanceOf(creator.address);
      const platformBefore = await usdc.balanceOf(owner.address);

      await raffle.connect(winnerSigner).claimPrize();

      expect(await usdc.balanceOf(winner) - winnerBefore).to.equal(winnerAmount);
      expect(await usdc.balanceOf(creator.address) - creatorBefore).to.equal(creatorAmount);
      expect(await usdc.balanceOf(owner.address) - platformBefore).to.equal(platformFee);
    });

    it("Should reject non-winner claiming", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();
      const nonWinner = winner === user1.address ? user2 : user1;

      await expect(
        raffle.connect(nonWinner).claimPrize()
      ).to.be.revertedWithCustomError(raffle, "NotWinner");
    });

    it("Should reject double claim", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();
      const winnerSigner = winner === user1.address ? user1 : user2;

      await raffle.connect(winnerSigner).claimPrize();

      await expect(
        raffle.connect(winnerSigner).claimPrize()
      ).to.be.revertedWithCustomError(raffle, "PrizeAlreadyClaimed");
    });

    it("Should emit PlatformFeePaid and PrizeClaimed events", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();
      const winnerSigner = winner === user1.address ? user1 : user2;

      await expect(raffle.connect(winnerSigner).claimPrize())
        .to.emit(raffle, "PlatformFeePaid")
        .and.to.emit(raffle, "PrizeClaimed");
    });
  });

  describe("Cancel Raffle", function () {
    it("Should allow creator to cancel", async function () {
      const { raffle, factory, creator, user1 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 2);

      await expect(raffle.connect(creator).cancelRaffle())
        .to.emit(raffle, "RaffleCancelled");
      expect(await raffle.status()).to.equal(4); // CANCELLED
    });

    it("Should allow anyone to cancel if underfilled after deadline", async function () {
      const { raffle, factory, user1, user3, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await time.increaseTo(deadline + 1);

      await expect(raffle.connect(user3).cancelRaffle())
        .to.emit(raffle, "RaffleCancelled");
    });

    it("Should reject cancel by non-creator before deadline", async function () {
      const { raffle, factory, user1, user2 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);

      await expect(
        raffle.connect(user2).cancelRaffle()
      ).to.be.revertedWithCustomError(raffle, "NotCreator");
    });

    it("Should reject cancel after draw", async function () {
      const { raffle, factory, creator, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await joinViaFactory(factory, raffle, user2, 1);
      await time.increaseTo(deadline + 1);

      await raffle.drawWinner();

      await expect(
        raffle.connect(creator).cancelRaffle()
      ).to.be.revertedWithCustomError(raffle, "DrawInProgress");
    });
  });

  describe("Withdraw Refund (USDC)", function () {
    it("Should refund USDC after cancel", async function () {
      const { raffle, factory, usdc, creator, user1, user2 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 3);
      await joinViaFactory(factory, raffle, user2, 2);

      await raffle.connect(creator).cancelRaffle();

      const user1Before = await usdc.balanceOf(user1.address);
      await raffle.connect(user1).withdrawRefund();
      expect(await usdc.balanceOf(user1.address) - user1Before).to.equal(BigInt(ENTRY_FEE) * BigInt(3));

      const user2Before = await usdc.balanceOf(user2.address);
      await raffle.connect(user2).withdrawRefund();
      expect(await usdc.balanceOf(user2.address) - user2Before).to.equal(BigInt(ENTRY_FEE) * BigInt(2));
    });

    it("Should revert if not cancelled", async function () {
      const { raffle, factory, user1 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);

      await expect(
        raffle.connect(user1).withdrawRefund()
      ).to.be.revertedWithCustomError(raffle, "RaffleNotCancelled");
    });

    it("Should revert double refund", async function () {
      const { raffle, factory, creator, user1 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 1);
      await raffle.connect(creator).cancelRaffle();

      await raffle.connect(user1).withdrawRefund();
      await expect(
        raffle.connect(user1).withdrawRefund()
      ).to.be.revertedWithCustomError(raffle, "NoRefundAvailable");
    });
  });

  describe("View Functions", function () {
    it("Should return correct raffle details", async function () {
      const { raffle, creator, deadline } = await loadFixture(deployRaffleFixture);

      const details = await raffle.getRaffleDetails();

      expect(details._title).to.equal(TITLE);
      expect(details._description).to.equal(DESCRIPTION);
      expect(details._entryFee).to.equal(ENTRY_FEE);
      expect(details._deadline).to.equal(deadline);
      expect(details._maxParticipants).to.equal(MAX_PARTICIPANTS);
      expect(details._currentParticipants).to.equal(0);
      expect(details._status).to.equal(1);
      expect(details._creator).to.equal(creator.address);
      expect(details._winner).to.equal(ethers.ZeroAddress);
    });

    it("Should return correct participants array", async function () {
      const { raffle, factory, user1, user2 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 2);
      await joinViaFactory(factory, raffle, user2, 1);

      const participants = await raffle.getParticipants();
      expect(participants.length).to.equal(3);
      expect(participants[0]).to.equal(user1.address);
      expect(participants[1]).to.equal(user1.address);
      expect(participants[2]).to.equal(user2.address);
    });

    it("Should return correct prize pool (USDC balance)", async function () {
      const { raffle, factory, user1, user2 } = await loadFixture(deployRaffleFixture);

      await joinViaFactory(factory, raffle, user1, 3);
      await joinViaFactory(factory, raffle, user2, 2);

      expect(await raffle.getPrizePool()).to.equal(BigInt(ENTRY_FEE) * BigInt(5));
    });
  });
});
