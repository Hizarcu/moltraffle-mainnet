const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Integration Tests - Full Raffle Lifecycle", function () {
  const ENTRY_FEE = ethers.parseEther("0.1");
  const MAX_PARTICIPANTS = 10;
  const TITLE = "Integration Test Raffle";
  const DESCRIPTION = "Full lifecycle test";
  const PRIZE_DESCRIPTION = "1 ETH Prize Pool";

  const MOCK_KEY_HASH = "0x" + "0".repeat(64);
  const MOCK_SUBSCRIPTION_ID = BigInt("12345");

  async function deployFullSystemFixture() {
    const [owner, creator, user1, user2, user3, user4] = await ethers.getSigners();

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

    return { factory, vrfCoordinator, owner, creator, user1, user2, user3, user4 };
  }

  describe("Complete Raffle Flow - Create → Join → Draw → Claim", function () {
    it("Should complete full raffle lifecycle successfully", async function () {
      const { factory, vrfCoordinator, creator, user1, user2, user3 } = await loadFixture(deployFullSystemFixture);

      // Step 1: Create raffle
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      const createTx = await factory.connect(creator).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = createEvent.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = Raffle.attach(raffleAddress);

      // Verify raffle created correctly
      expect(await raffle.creator()).to.equal(creator.address);
      expect(await raffle.status()).to.equal(1); // ACTIVE

      // Step 2: Multiple users join
      await raffle.connect(user1).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      await raffle.connect(user2).joinRaffle(4, { value: ENTRY_FEE * BigInt(4) });
      await raffle.connect(user3).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });

      // Verify participants
      expect(await raffle.getTotalTickets()).to.equal(10);
      expect(await raffle.getPrizePool()).to.equal(ENTRY_FEE * BigInt(10));

      // Step 3: Advance time and draw winner
      await time.increaseTo(deadline + 1);

      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();

      expect(await raffle.status()).to.equal(2); // ENDED

      // Step 4: VRF fulfills randomness
      const randomnessEvent = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested");
      const requestId = randomnessEvent.args[0];

      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

      // Verify winner selected
      const winner = await raffle.winner();
      expect(winner).to.not.equal(ethers.ZeroAddress);
      expect(await raffle.status()).to.equal(3); // DRAWN

      // Step 5: Winner claims prize
      const winnerSigner = await ethers.getSigner(winner);
      const prizePool = await raffle.getPrizePool();
      const balanceBefore = await ethers.provider.getBalance(winner);

      const claimTx = await raffle.connect(winnerSigner).claimPrize();
      const claimReceipt = await claimTx.wait();
      const gasUsed = claimReceipt.gasUsed * claimReceipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(winner);

      // Verify prize claimed
      expect(balanceAfter).to.equal(balanceBefore + prizePool - gasUsed);
      expect(await raffle.getPrizePool()).to.equal(0);
    });

    it("Should complete raffle when max participants reached (no deadline wait)", async function () {
      const { factory, vrfCoordinator, creator, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      const createTx = await factory.connect(creator).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = createEvent.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = Raffle.attach(raffleAddress);

      // Fill raffle to max
      await raffle.connect(user1).joinRaffle(6, { value: ENTRY_FEE * BigInt(6) });
      await raffle.connect(user2).joinRaffle(4, { value: ENTRY_FEE * BigInt(4) });

      // Should be able to draw immediately (max reached)
      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();

      const randomnessEvent = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested");
      const requestId = randomnessEvent.args[0];

      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

      const winner = await raffle.winner();
      expect(winner).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Complete Cancellation Flow - Create → Join → Cancel → Refund", function () {
    it("Should refund all participants when creator cancels", async function () {
      const { factory, creator, user1, user2, user3 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      const createTx = await factory.connect(creator).createRaffle(
        TITLE,
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = createEvent.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = Raffle.attach(raffleAddress);

      // Track balances before joining
      const balance1Before = await ethers.provider.getBalance(user1.address);
      const balance2Before = await ethers.provider.getBalance(user2.address);
      const balance3Before = await ethers.provider.getBalance(user3.address);

      // Users join
      const tx1 = await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed * receipt1.gasPrice;

      const tx2 = await raffle.connect(user2).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      const receipt2 = await tx2.wait();
      const gas2 = receipt2.gasUsed * receipt2.gasPrice;

      const tx3 = await raffle.connect(user3).joinRaffle(1, { value: ENTRY_FEE });
      const receipt3 = await tx3.wait();
      const gas3 = receipt3.gasUsed * receipt3.gasPrice;

      // Creator cancels
      await raffle.connect(creator).cancelRaffle();

      // Check balances after cancel (should be refunded)
      const balance1After = await ethers.provider.getBalance(user1.address);
      const balance2After = await ethers.provider.getBalance(user2.address);
      const balance3After = await ethers.provider.getBalance(user3.address);

      expect(balance1After).to.equal(balance1Before - gas1);
      expect(balance2After).to.equal(balance2Before - gas2);
      expect(balance3After).to.equal(balance3Before - gas3);

      expect(await raffle.status()).to.equal(4); // CANCELLED
    });
  });

  describe("Multiple Concurrent Raffles", function () {
    it("Should handle multiple raffles independently", async function () {
      const { factory, vrfCoordinator, creator, user1, user2, user3, user4 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      // Create Raffle 1
      const createTx1 = await factory.connect(creator).createRaffle(
        "Raffle 1",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      // Create Raffle 2
      const createTx2 = await factory.connect(user1).createRaffle(
        "Raffle 2",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ethers.parseEther("0.05"),
        deadline,
        20,
        { value: creationFee }
      );

      const receipt1 = await createTx1.wait();
      const receipt2 = await createTx2.wait();

      const event1 = receipt1.logs.find(log => log.eventName === "RaffleCreated");
      const event2 = receipt2.logs.find(log => log.eventName === "RaffleCreated");

      const raffleAddress1 = event1.args.raffleAddress;
      const raffleAddress2 = event2.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle1 = Raffle.attach(raffleAddress1);
      const raffle2 = Raffle.attach(raffleAddress2);

      // Users join different raffles
      await raffle1.connect(user2).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      await raffle1.connect(user3).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await raffle2.connect(user2).joinRaffle(5, { value: ethers.parseEther("0.05") * BigInt(5) });
      await raffle2.connect(user4).joinRaffle(3, { value: ethers.parseEther("0.05") * BigInt(3) });

      // Verify independent state
      expect(await raffle1.getTotalTickets()).to.equal(5);
      expect(await raffle2.getTotalTickets()).to.equal(8);

      expect(await raffle1.creator()).to.equal(creator.address);
      expect(await raffle2.creator()).to.equal(user1.address);

      // Both can be drawn independently
      await time.increaseTo(deadline + 1);

      await raffle1.drawWinner();
      await raffle2.drawWinner();

      expect(await raffle1.status()).to.equal(2); // ENDED
      expect(await raffle2.status()).to.equal(2); // ENDED
    });

    it("Should track factory stats correctly with multiple raffles", async function () {
      const { factory, creator, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      // Creator makes 2 raffles
      await factory.connect(creator).createRaffle(
        "Creator Raffle 1",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      await factory.connect(creator).createRaffle(
        "Creator Raffle 2",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      // User1 makes 1 raffle
      await factory.connect(user1).createRaffle(
        "User1 Raffle",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      // User2 makes 1 raffle
      await factory.connect(user2).createRaffle(
        "User2 Raffle",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        MAX_PARTICIPANTS,
        { value: creationFee }
      );

      expect(await factory.getRaffleCount()).to.equal(4);
      expect(await factory.getCreatorRaffleCount(creator.address)).to.equal(2);
      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(1);
      expect(await factory.getCreatorRaffleCount(user2.address)).to.equal(1);

      const allRaffles = await factory.getAllRaffles();
      expect(allRaffles.length).to.equal(4);

      const creatorRaffles = await factory.getRafflesByCreator(creator.address);
      expect(creatorRaffles.length).to.equal(2);
    });
  });

  describe("Edge Cases & Stress Tests", function () {
    it("Should handle unlimited raffle with many participants", async function () {
      const { factory, vrfCoordinator, creator, user1 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, 0); // Unlimited

      const createTx = await factory.connect(creator).createRaffle(
        "Unlimited Raffle",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        0, // Unlimited
        { value: creationFee }
      );

      const receipt = await createTx.wait();
      const event = receipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = event.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = Raffle.attach(raffleAddress);

      // Buy many tickets
      await raffle.connect(user1).joinRaffle(500, { value: ENTRY_FEE * BigInt(500) });

      expect(await raffle.getTotalTickets()).to.equal(500);
      expect(await raffle.maxParticipants()).to.equal(0);

      await time.increaseTo(deadline + 1);

      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();

      const randomnessEvent = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested");
      const requestId = randomnessEvent.args[0];

      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

      const winner = await raffle.winner();
      expect(winner).to.equal(user1.address);
    });

    it("Should handle single participant correctly", async function () {
      const { factory, vrfCoordinator, creator, user1 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 1 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, 10);

      const createTx = await factory.connect(creator).createRaffle(
        "Single Participant Raffle",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        10,
        { value: creationFee }
      );

      const receipt = await createTx.wait();
      const event = receipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = event.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = Raffle.attach(raffleAddress);

      // Only one user joins
      await raffle.connect(user1).joinRaffle(1, { value: ENTRY_FEE });

      await time.increaseTo(deadline + 1);

      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();

      const randomnessEvent = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested");
      const requestId = randomnessEvent.args[0];

      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

      const winner = await raffle.winner();
      expect(winner).to.equal(user1.address); // Only participant must win
    });

    it("Should handle exact max participants correctly", async function () {
      const { factory, vrfCoordinator, creator, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, 5);

      const createTx = await factory.connect(creator).createRaffle(
        "Exact Max Raffle",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        5,
        { value: creationFee }
      );

      const receipt = await createTx.wait();
      const event = receipt.logs.find(log => log.eventName === "RaffleCreated");
      const raffleAddress = event.args.raffleAddress;

      const Raffle = await ethers.getContractFactory("Raffle");
      const raffle = Raffle.attach(raffleAddress);

      // Fill to exact max
      await raffle.connect(user1).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      await raffle.connect(user2).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      expect(await raffle.getTotalTickets()).to.equal(5);

      // Should be full now
      await expect(
        raffle.connect(user1).joinRaffle(1, { value: ENTRY_FEE })
      ).to.be.revertedWithCustomError(raffle, "RaffleFull");

      // Should draw immediately (max reached)
      await raffle.drawWinner();

      expect(await raffle.status()).to.equal(2); // ENDED
    });
  });

  describe("Platform Fees & Economics", function () {
    it("Should accumulate fees from multiple raffles", async function () {
      const { factory, creator, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const fee1 = await factory.calculateCreationFee(ENTRY_FEE, 100);
      const fee2 = await factory.calculateCreationFee(ethers.parseEther("0.5"), 50);
      const fee3 = await factory.calculateCreationFee(ethers.parseEther("0.01"), 10);

      await factory.connect(creator).createRaffle(
        "Raffle 1",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ENTRY_FEE,
        deadline,
        100,
        { value: fee1 }
      );

      await factory.connect(user1).createRaffle(
        "Raffle 2",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ethers.parseEther("0.5"),
        deadline,
        50,
        { value: fee2 }
      );

      await factory.connect(user2).createRaffle(
        "Raffle 3",
        DESCRIPTION,
        PRIZE_DESCRIPTION,
        ethers.parseEther("0.01"),
        deadline,
        10,
        { value: fee3 }
      );

      const totalFees = fee1 + fee2 + fee3;
      const accumulatedFees = await factory.getAccumulatedFees();

      expect(accumulatedFees).to.equal(totalFees);
    });

    it("Should distribute fees correctly on withdrawal", async function () {
      const { factory, owner, creator, user1 } = await loadFixture(deployFullSystemFixture);

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const creationFee = await factory.calculateCreationFee(ENTRY_FEE, MAX_PARTICIPANTS);

      // Create 3 raffles
      await factory.connect(creator).createRaffle(
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

      const totalFees = creationFee * BigInt(2);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await factory.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + totalFees - gasUsed);
      expect(await factory.getAccumulatedFees()).to.equal(0);
    });
  });
});
