const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("RaffleFactory Contract (USDC)", function () {
  // Constants — USDC has 6 decimals
  const ENTRY_FEE = 1000000; // $1 USDC
  const MAX_PARTICIPANTS = 100;
  const TITLE = "Test Raffle";
  const DESCRIPTION = "Test Description";
  const PRIZE_DESCRIPTION = "Test Prize";
  const CREATION_FEE = 1000000; // $1 USDC flat

  // Mock VRF Config
  const MOCK_KEY_HASH = "0x" + "0".repeat(64);
  const MOCK_SUBSCRIPTION_ID = BigInt("12345");

  async function deployFactoryFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy Mock VRF Coordinator
    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinatorV2Plus");
    const vrfCoordinator = await MockVRFCoordinator.deploy();

    // Deploy RaffleFactory with USDC address
    const RaffleFactory = await ethers.getContractFactory("RaffleFactory");
    const factory = await RaffleFactory.deploy(
      await vrfCoordinator.getAddress(),
      MOCK_KEY_HASH,
      MOCK_SUBSCRIPTION_ID,
      await usdc.getAddress()
    );

    // Mint USDC and approve factory for all test accounts
    const factoryAddr = await factory.getAddress();
    const mintAmount = ethers.parseUnits("100000", 6); // $100,000 each
    for (const account of [owner, user1, user2, user3]) {
      await usdc.mint(account.address, mintAmount);
      await usdc.connect(account).approve(factoryAddr, ethers.MaxUint256);
    }

    return { factory, vrfCoordinator, usdc, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      const { factory, usdc, owner } = await loadFixture(deployFactoryFixture);

      expect(await factory.platformOwner()).to.equal(owner.address);
      expect(await factory.keyHash()).to.equal(MOCK_KEY_HASH);
      expect(await factory.subscriptionId()).to.equal(MOCK_SUBSCRIPTION_ID);
      expect(await factory.paused()).to.equal(false);
      expect(await factory.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should have correct fee constants", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      expect(await factory.CREATION_FEE()).to.equal(CREATION_FEE);
      expect(await factory.PLATFORM_FEE_BPS()).to.equal(200);
    });
  });

  describe("Create Raffle", function () {
    it("Should create raffle and pull $1 USDC creation fee", async function () {
      const { factory, usdc, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const balBefore = await usdc.balanceOf(user1.address);

      await expect(
        factory.connect(user1).createRaffle(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
          ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
        )
      ).to.emit(factory, "RaffleCreated");

      const balAfter = await usdc.balanceOf(user1.address);
      expect(balBefore - balAfter).to.equal(BigInt(CREATION_FEE));
      expect(await factory.getRaffleCount()).to.equal(1);
      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(1);
    });

    it("Should store creation fee in factory USDC balance", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );

      expect(await factory.getAccumulatedFees()).to.equal(CREATION_FEE);
    });

    it("Should store raffle correctly", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const tx = await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
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

      for (let i = 1; i <= 3; i++) {
        await factory.connect(user1).createRaffle(
          `Raffle ${i}`, DESCRIPTION, PRIZE_DESCRIPTION,
          ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
        );
      }

      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(3);
      expect(await factory.getRaffleCount()).to.equal(3);
    });

    it("Should track raffles from different creators", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      await factory.connect(user1).createRaffle(
        "User1 Raffle", DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );

      await factory.connect(user2).createRaffle(
        "User2 Raffle", DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );

      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(1);
      expect(await factory.getCreatorRaffleCount(user2.address)).to.equal(1);
      expect(await factory.getRaffleCount()).to.equal(2);
    });

    it("Should enforce raffle validation (maxParticipants=1)", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      await expect(
        factory.connect(user1).createRaffle(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
          ENTRY_FEE, deadline, 1, 0
        )
      ).to.be.reverted;
    });
  });

  describe("Join Raffle via Factory", function () {
    it("Should route USDC from caller to raffle", async function () {
      const { factory, usdc, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const tx = await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = event.args.raffleAddress;

      const balBefore = await usdc.balanceOf(user2.address);
      await factory.connect(user2).joinRaffle(raffleAddress, 3);
      const balAfter = await usdc.balanceOf(user2.address);

      expect(balBefore - balAfter).to.equal(BigInt(ENTRY_FEE) * BigInt(3));

      // USDC should be in the raffle contract
      expect(await usdc.balanceOf(raffleAddress)).to.equal(BigInt(ENTRY_FEE) * BigInt(3));
    });

    it("Should emit RaffleJoined event", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const tx = await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      const receipt = await tx.wait();
      const raffleAddress = receipt.logs.find(log => log.eventName === "RaffleCreated").args.raffleAddress;

      await expect(
        factory.connect(user2).joinRaffle(raffleAddress, 2)
      ).to.emit(factory, "RaffleJoined")
        .withArgs(raffleAddress, user2.address, 2, BigInt(ENTRY_FEE) * BigInt(2));
    });

    it("Should revert for invalid raffle address", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(user1).joinRaffle(user1.address, 1)
      ).to.be.revertedWithCustomError(factory, "InvalidRaffle");
    });

    it("Should revert for 0 tickets", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const tx = await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      const receipt = await tx.wait();
      const raffleAddress = receipt.logs.find(log => log.eventName === "RaffleCreated").args.raffleAddress;

      await expect(
        factory.connect(user2).joinRaffle(raffleAddress, 0)
      ).to.be.revertedWithCustomError(factory, "InvalidTicketCount");
    });

    it("Should reject direct registerTickets on raffle from non-factory", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const tx = await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      const receipt = await tx.wait();
      const raffleAddress = receipt.logs.find(log => log.eventName === "RaffleCreated").args.raffleAddress;

      const raffle = await ethers.getContractAt("Raffle", raffleAddress);
      await expect(
        raffle.connect(user2).registerTickets(user2.address, 1)
      ).to.be.revertedWithCustomError(raffle, "OnlyFactory");
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
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const tx = await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      const receipt = await tx.wait();
      const raffleAddress = receipt.logs.find(log => log.eventName === "RaffleCreated").args.raffleAddress;
      const raffle = await ethers.getContractAt("Raffle", raffleAddress);

      // Join via factory
      await factory.connect(user1).joinRaffle(raffleAddress, 1);
      await factory.connect(user2).joinRaffle(raffleAddress, 1);

      await time.increaseTo(deadline + 1);

      await expect(raffle.drawWinner())
        .to.emit(factory, "RandomnessRequested");
    });
  });

  describe("Fulfill Randomness", function () {
    it("Should fulfill randomness and select winner", async function () {
      const { factory, vrfCoordinator, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const tx = await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      const receipt = await tx.wait();
      const raffleAddress = receipt.logs.find(log => log.eventName === "RaffleCreated").args.raffleAddress;
      const raffle = await ethers.getContractAt("Raffle", raffleAddress);

      await factory.connect(user1).joinRaffle(raffleAddress, 3);
      await factory.connect(user2).joinRaffle(raffleAddress, 2);

      await time.increaseTo(deadline + 1);

      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();
      const randomnessEvent = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested");
      const requestId = randomnessEvent.args[0];

      // Simulate VRF callback
      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

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
      await expect(
        factory.connect(user1).createRaffle(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
          ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
        )
      ).to.be.revertedWithCustomError(factory, "EnforcedPause");
    });

    it("Should allow creation after unpause", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).pause();
      await factory.connect(owner).unpause();

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      await expect(
        factory.connect(user1).createRaffle(
          TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
          ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
        )
      ).to.emit(factory, "RaffleCreated");
    });
  });

  describe("Fee Withdrawal", function () {
    it("Should allow owner to withdraw USDC fees", async function () {
      const { factory, usdc, owner, user1 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      // Create 2 raffles = $2 in fees
      await factory.connect(user1).createRaffle(
        "R1", DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      await factory.connect(user1).createRaffle(
        "R2", DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );

      const balBefore = await usdc.balanceOf(owner.address);
      await factory.connect(owner).withdrawFees();
      const balAfter = await usdc.balanceOf(owner.address);

      expect(balAfter - balBefore).to.equal(BigInt(CREATION_FEE) * BigInt(2));
      expect(await factory.getAccumulatedFees()).to.equal(0);
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
      await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );

      await expect(factory.connect(owner).withdrawFees())
        .to.emit(factory, "FeesWithdrawn")
        .withArgs(owner.address, CREATION_FEE);
    });
  });

  describe("View Functions", function () {
    it("Should return correct raffle count", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      expect(await factory.getRaffleCount()).to.equal(0);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      await factory.connect(user1).createRaffle(
        TITLE, DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );

      expect(await factory.getRaffleCount()).to.equal(1);
    });

    it("Should return correct creator raffle count", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      await factory.connect(user1).createRaffle(
        "R1", DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      await factory.connect(user1).createRaffle(
        "R2", DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );
      await factory.connect(user2).createRaffle(
        "R3", DESCRIPTION, PRIZE_DESCRIPTION,
        ENTRY_FEE, deadline, MAX_PARTICIPANTS, 0
      );

      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(2);
      expect(await factory.getCreatorRaffleCount(user2.address)).to.equal(1);
    });
  });
});
