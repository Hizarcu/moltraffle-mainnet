const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("RaffleFactory Contract", function () {
  // Constants
  const ENTRY_FEE = ethers.parseEther("0.1");
  const MAX_PARTICIPANTS = 100;
  const TITLE = "Test Raffle";
  const DESCRIPTION = "Test Description";
  const PRIZE_DESCRIPTION = "Test Prize";

  // Mock VRF Config
  const MOCK_KEY_HASH = "0x" + "0".repeat(64);
  const MOCK_SUBSCRIPTION_ID = BigInt("12345");

  async function deployFactoryFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy Mock VRF Coordinator
    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinatorV2Plus");
    const vrfCoordinator = await MockVRFCoordinator.deploy();

    // Deploy RaffleFactory
    const RaffleFactory = await ethers.getContractFactory("RaffleFactory");
    const factory = await RaffleFactory.deploy(
      await vrfCoordinator.getAddress(),
      MOCK_KEY_HASH,
      MOCK_SUBSCRIPTION_ID
    );

    return { factory, vrfCoordinator, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      expect(await factory.platformOwner()).to.equal(owner.address);
      expect(await factory.keyHash()).to.equal(MOCK_KEY_HASH);
      expect(await factory.subscriptionId()).to.equal(MOCK_SUBSCRIPTION_ID);
      expect(await factory.paused()).to.equal(false);
    });

    it("Should have correct fee constants", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      expect(await factory.CREATION_FEE_BPS()).to.equal(100); // 1%
      expect(await factory.MIN_FEE()).to.equal(ethers.parseEther("0.0004"));
      expect(await factory.MAX_FEE()).to.equal(ethers.parseEther("0.05"));
    });
  });

  describe("Creation Fee Calculation", function () {
    it("Should calculate fee correctly for normal raffle", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      const entryFee = ethers.parseEther("0.1");
      const maxParticipants = 100;

      const fee = await factory.calculateCreationFee(entryFee, maxParticipants);
      const expectedFee = (entryFee * BigInt(maxParticipants) * BigInt(100)) / BigInt(10000);

      // 1% of 10 ETH = 0.1 ETH, but capped at MAX_FEE = 0.05 ETH
      expect(fee).to.equal(ethers.parseEther("0.05")); // MAX_FEE cap
    });

    it("Should enforce minimum fee", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      const entryFee = ethers.parseEther("0.01");
      const maxParticipants = 2;

      const fee = await factory.calculateCreationFee(entryFee, maxParticipants);

      // 1% of 0.02 = 0.0002, but min is 0.0004
      expect(fee).to.equal(ethers.parseEther("0.0004"));
    });

    it("Should enforce maximum fee", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      const entryFee = ethers.parseEther("10");
      const maxParticipants = 1000;

      const fee = await factory.calculateCreationFee(entryFee, maxParticipants);

      // 1% of 10000 = 100 ETH, but max is 0.05
      expect(fee).to.equal(ethers.parseEther("0.05"));
    });

    it("Should return max fee for unlimited participants", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      const entryFee = ethers.parseEther("0.1");
      const maxParticipants = 0; // Unlimited

      const fee = await factory.calculateCreationFee(entryFee, maxParticipants);

      expect(fee).to.equal(ethers.parseEther("0.05"));
    });
  });

  describe("Create Raffle", function () {
    it("Should create raffle with correct fee", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await expect(
        factory.connect(user1).createRaffle(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          deadline,
          MAX_PARTICIPANTS,
          { value: creationFee }
        )
      ).to.emit(factory, "RaffleCreated");

      expect(await factory.getRaffleCount()).to.equal(1);
      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(1);
    });

    it("Should reject insufficient creation fee", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await expect(
        factory.connect(user1).createRaffle(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          deadline,
          MAX_PARTICIPANTS,
          { value: creationFee - BigInt(1) }
        )
      ).to.be.revertedWithCustomError(factory, "InsufficientCreationFee");
    });

    it("Should refund excess fee", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);
      const overpayment = creationFee + ethers.parseEther("0.1");

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await factory.connect(user1).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: overpayment }
      );

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const expectedBalance = balanceBefore - creationFee - gasUsed;

      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });

    it("Should store raffle correctly", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      const tx = await factory.connect(user1).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = event.args.raffleAddress;

      expect(await factory.isRaffle(raffleAddress)).to.equal(true);

      const allRaffles = await factory.getAllRaffles();
      expect(allRaffles[0]).to.equal(raffleAddress);

      const creatorRaffles = await factory.getRafflesByCreator(user1.address);
      expect(creatorRaffles[0]).to.equal(raffleAddress);
    });

    it("Should track multiple raffles by creator", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      // Create 3 raffles
      await factory.connect(user1).createRaffle(
        "Raffle 1",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      await factory.connect(user1).createRaffle(
        "Raffle 2",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      await factory.connect(user1).createRaffle(
        "Raffle 3",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(3);
      expect(await factory.getRaffleCount()).to.equal(3);

      const creatorRaffles = await factory.getRafflesByCreator(user1.address);
      expect(creatorRaffles.length).to.equal(3);
    });

    it("Should track raffles from different creators", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await factory.connect(user1).createRaffle(
        "User1 Raffle",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      await factory.connect(user2).createRaffle(
        "User2 Raffle",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(1);
      expect(await factory.getCreatorRaffleCount(user2.address)).to.equal(1);
      expect(await factory.getRaffleCount()).to.equal(2);
    });

    it("Should enforce raffle validation rules", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = ethers.parseEther("0.01");

      // Try to create raffle with maxParticipants = 1 (should fail)
      await expect(
        factory.connect(user1).createRaffle(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          deadline,
          1, // Invalid
          { value: creationFee }
        )
      ).to.be.reverted; // Will fail in Raffle constructor
    });
  });

  describe("Request Randomness", function () {
    it("Should only allow raffle contracts to request randomness", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(user1).requestRandomnessForRaffle()
      ).to.be.revertedWithCustomError(factory, "OnlyRaffleContract");
    });

    it("Should request randomness for valid raffle", async function () {
      const { factory, vrfCoordinator, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      const tx = await factory.connect(user1).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = event.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = Raffle.attach(raffleAddress);

      // Join raffle
      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      // Advance time past deadline
      await time.increaseTo(deadline + 1);

      // Draw winner (should request randomness)
      await expect(raffle.drawWinner())
        .to.emit(factory, "RandomnessRequested");
    });
  });

  describe("Fulfill Randomness", function () {
    it("Should fulfill randomness and select winner", async function () {
      const { factory, vrfCoordinator, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      const tx = await factory.connect(user1).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = event.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = Raffle.attach(raffleAddress);

      // Join raffle
      await raffle.connect(user1).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      await raffle.connect(user2).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await time.increaseTo(deadline + 1);

      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();
      const randomnessEvent = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested");
      const requestId = randomnessEvent.args[0];

      // Simulate VRF callback
      const randomNumber = 12345;
      await vrfCoordinator.fulfillRandomWords(
        requestId,
        await factory.getAddress()
      );

      const winner = await raffle.winner();
      expect(winner).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Pause Mechanism", function () {
    it("Should allow owner to pause", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).pause();

      expect(await factory.paused()).to.equal(true);
    });

    it("Should reject pause by non-owner", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(user1).pause()
      ).to.be.revertedWithCustomError(factory, "NotPlatformOwner");
    });

    it("Should prevent raffle creation when paused", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).pause();

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await expect(
        factory.connect(user1).createRaffle(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          deadline,
          MAX_PARTICIPANTS,
          { value: creationFee }
        )
      ).to.be.revertedWithCustomError(factory, "EnforcedPause");
    });

    it("Should allow owner to unpause", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).pause();
      await factory.connect(owner).unpause();

      expect(await factory.paused()).to.equal(false);
    });

    it("Should reject unpause by non-owner", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).pause();

      await expect(
        factory.connect(user1).unpause()
      ).to.be.revertedWithCustomError(factory, "NotPlatformOwner");
    });

    it("Should allow raffle creation after unpause", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).pause();
      await factory.connect(owner).unpause();

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await expect(
        factory.connect(user1).createRaffle(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          deadline,
          MAX_PARTICIPANTS,
          { value: creationFee }
        )
      ).to.emit(factory, "RaffleCreated");
    });
  });

  describe("Fee Withdrawal", function () {
    it("Should allow owner to withdraw fees", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      // Create raffle (fee goes to factory)
      await factory.connect(user1).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      const factoryBalance = await factory.getAccumulatedFees();
      expect(factoryBalance).to.equal(creationFee);

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await factory.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + creationFee - gasUsed);
    });

    it("Should reject withdrawal by non-owner", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(user1).withdrawFees()
      ).to.be.revertedWithCustomError(factory, "NotPlatformOwner");
    });

    it("Should emit FeesWithdrawn event", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await factory.connect(user1).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      await expect(factory.connect(owner).withdrawFees())
        .to.emit(factory, "FeesWithdrawn")
        .withArgs(owner.address, creationFee);
    });

    it("Should reset balance after withdrawal", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await factory.connect(user1).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      await factory.connect(owner).withdrawFees();

      const factoryBalance = await factory.getAccumulatedFees();
      expect(factoryBalance).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return correct raffle count", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      expect(await factory.getRaffleCount()).to.equal(0);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await factory.connect(user1).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      expect(await factory.getRaffleCount()).to.equal(1);
    });

    it("Should return correct creator raffle count", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      await factory.connect(user1).createRaffle(
        "Raffle 1",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      await factory.connect(user1).createRaffle(
        "Raffle 2",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      await factory.connect(user2).createRaffle(
        "Raffle 3",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(2);
      expect(await factory.getCreatorRaffleCount(user2.address)).to.equal(1);
    });
  });
});
