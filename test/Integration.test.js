const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Integration Tests - Full Raffle Lifecycle (USDC)", function () {
  const ENTRY_FEE = 10000000; // $10 USDC
  const MAX_PARTICIPANTS = 10;
  const TITLE = "Integration Test Raffle";
  const DESCRIPTION = "Full lifecycle test";
  const PRIZE_DESCRIPTION = "$100 USDC Prize Pool";
  const CREATION_FEE = 1000000; // $1 USDC

  const MOCK_KEY_HASH = "0x" + "0".repeat(64);
  const MOCK_SUBSCRIPTION_ID = BigInt("12345");

  async function deployFullSystemFixture() {
    const [owner, creator, user1, user2, user3, user4] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy Mock VRF Coordinator
    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinatorV2Plus");
    const vrfCoordinator = await MockVRFCoordinator.deploy();

    // Deploy RaffleFactory with USDC
    const RaffleFactory = await ethers.getContractFactory("RaffleFactory");
    const factory = await RaffleFactory.deploy(
      await vrfCoordinator.getAddress(),
      MOCK_KEY_HASH,
      MOCK_SUBSCRIPTION_ID,
      await usdc.getAddress()
    );

    // Mint USDC and approve factory for all accounts
    const factoryAddr = await factory.getAddress();
    const mintAmount = ethers.parseUnits("1000000", 6); // $1M each
    for (const account of [owner, creator, user1, user2, user3, user4]) {
      await usdc.mint(account.address, mintAmount);
      await usdc.connect(account).approve(factoryAddr, ethers.MaxUint256);
    }

    return { factory, vrfCoordinator, usdc, owner, creator, user1, user2, user3, user4 };
  }

  // Helper: create raffle and return raffle contract
  async function createRaffle(factory, creator, opts = {}) {
    const deadline = opts.deadline || (await time.latest()) + 7 * 24 * 60 * 60;
    const tx = await factory.connect(creator).createRaffle(
      opts.title || TITLE,
      opts.description || DESCRIPTION,
      opts.prizeDescription || PRIZE_DESCRIPTION,
      opts.entryFee || ENTRY_FEE,
      deadline,
      opts.maxParticipants !== undefined ? opts.maxParticipants : MAX_PARTICIPANTS,
      opts.commission || 0
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.eventName === "RaffleCreated");
    const raffleAddress = event.args.raffleAddress;
    const raffle = await ethers.getContractAt("Raffle", raffleAddress);
    return { raffle, raffleAddress, deadline };
  }

  describe("Complete Raffle Flow - Create → Join → Draw → Claim", function () {
    it("Should complete full raffle lifecycle successfully", async function () {
      const { factory, vrfCoordinator, usdc, owner, creator, user1, user2, user3 } = await loadFixture(deployFullSystemFixture);

      // Step 1: Create raffle ($1 USDC fee)
      const creatorBefore = await usdc.balanceOf(creator.address);
      const { raffle, raffleAddress, deadline } = await createRaffle(factory, creator);
      expect(creatorBefore - await usdc.balanceOf(creator.address)).to.equal(BigInt(CREATION_FEE));

      expect(await raffle.creator()).to.equal(creator.address);
      expect(await raffle.status()).to.equal(1); // ACTIVE

      // Step 2: Multiple users join via factory
      await factory.connect(user1).joinRaffle(raffleAddress, 3);
      await factory.connect(user2).joinRaffle(raffleAddress, 4);
      await factory.connect(user3).joinRaffle(raffleAddress, 3);

      expect(await raffle.getTotalTickets()).to.equal(10);
      expect(await raffle.getPrizePool()).to.equal(BigInt(ENTRY_FEE) * BigInt(10)); // $100

      // Step 3: Advance time and draw winner
      await time.increaseTo(deadline + 1);

      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();
      expect(await raffle.status()).to.equal(2); // ENDED

      // Step 4: VRF fulfills randomness
      const randomnessEvent = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested");
      const requestId = randomnessEvent.args[0];

      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

      const winner = await raffle.winner();
      expect(winner).to.not.equal(ethers.ZeroAddress);
      expect(await raffle.status()).to.equal(3); // DRAWN

      // Step 5: Winner claims prize (2% platform fee, 0% commission)
      const winnerSigner = await ethers.getSigner(winner);
      const prizePool = await raffle.getPrizePool();
      const expectedPlatformFee = prizePool * BigInt(200) / BigInt(10000);
      const expectedWinnerAmount = prizePool - expectedPlatformFee;

      const winnerBefore = await usdc.balanceOf(winner);
      const platformBefore = await usdc.balanceOf(owner.address);

      await raffle.connect(winnerSigner).claimPrize();

      expect(await usdc.balanceOf(winner) - winnerBefore).to.equal(expectedWinnerAmount);
      expect(await usdc.balanceOf(owner.address) - platformBefore).to.equal(expectedPlatformFee);
      expect(await raffle.getPrizePool()).to.equal(0);
      expect(await raffle.status()).to.equal(5); // CLAIMED
    });

    it("Should complete raffle when max participants reached (no deadline wait)", async function () {
      const { factory, vrfCoordinator, usdc, creator, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const { raffle, raffleAddress } = await createRaffle(factory, creator);

      // Fill raffle to max
      await factory.connect(user1).joinRaffle(raffleAddress, 6);
      await factory.connect(user2).joinRaffle(raffleAddress, 4);

      // Should be able to draw immediately (max reached)
      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();

      const randomnessEvent = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested");
      const requestId = randomnessEvent.args[0];

      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

      expect(await raffle.winner()).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("3-Way Split with Creator Commission", function () {
    it("Should split prize correctly: 2% platform + 10% creator + winner", async function () {
      const { factory, vrfCoordinator, usdc, owner, creator, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const { raffle, raffleAddress, deadline } = await createRaffle(factory, creator, {
        commission: 1000, // 10%
        entryFee: 50000000, // $50 USDC
        maxParticipants: 4,
      });

      await factory.connect(user1).joinRaffle(raffleAddress, 2);
      await factory.connect(user2).joinRaffle(raffleAddress, 2);

      await time.increaseTo(deadline + 1);

      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();
      const requestId = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested").args[0];

      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

      const winner = await raffle.winner();
      const winnerSigner = await ethers.getSigner(winner);

      // Prize pool: 4 * $50 = $200
      const prizePool = BigInt(50000000) * BigInt(4);
      const platformFee = prizePool * BigInt(200) / BigInt(10000); // 2% = $4
      const remainder = prizePool - platformFee; // $196
      const creatorAmount = remainder * BigInt(1000) / BigInt(10000); // 10% = $19.60
      const winnerAmount = remainder - creatorAmount; // $176.40

      const winnerBefore = await usdc.balanceOf(winner);
      const creatorBefore = await usdc.balanceOf(creator.address);
      const platformBefore = await usdc.balanceOf(owner.address);

      await raffle.connect(winnerSigner).claimPrize();

      expect(await usdc.balanceOf(winner) - winnerBefore).to.equal(winnerAmount);
      expect(await usdc.balanceOf(creator.address) - creatorBefore).to.equal(creatorAmount);
      expect(await usdc.balanceOf(owner.address) - platformBefore).to.equal(platformFee);
    });
  });

  describe("Complete Cancellation Flow - Create → Join → Cancel → Refund", function () {
    it("Should refund all participants when creator cancels", async function () {
      const { factory, usdc, creator, user1, user2, user3 } = await loadFixture(deployFullSystemFixture);

      const { raffle, raffleAddress } = await createRaffle(factory, creator);

      // Users join
      await factory.connect(user1).joinRaffle(raffleAddress, 2);
      await factory.connect(user2).joinRaffle(raffleAddress, 3);
      await factory.connect(user3).joinRaffle(raffleAddress, 1);

      // Creator cancels
      await raffle.connect(creator).cancelRaffle();
      expect(await raffle.status()).to.equal(4); // CANCELLED

      // Each user withdraws refund
      const user1Before = await usdc.balanceOf(user1.address);
      await raffle.connect(user1).withdrawRefund();
      expect(await usdc.balanceOf(user1.address) - user1Before).to.equal(BigInt(ENTRY_FEE) * BigInt(2));

      const user2Before = await usdc.balanceOf(user2.address);
      await raffle.connect(user2).withdrawRefund();
      expect(await usdc.balanceOf(user2.address) - user2Before).to.equal(BigInt(ENTRY_FEE) * BigInt(3));

      const user3Before = await usdc.balanceOf(user3.address);
      await raffle.connect(user3).withdrawRefund();
      expect(await usdc.balanceOf(user3.address) - user3Before).to.equal(BigInt(ENTRY_FEE) * BigInt(1));

      // Raffle should be empty
      expect(await raffle.getPrizePool()).to.equal(0);
    });
  });

  describe("Multiple Concurrent Raffles", function () {
    it("Should handle multiple raffles independently", async function () {
      const { factory, usdc, creator, user1, user2, user3, user4 } = await loadFixture(deployFullSystemFixture);

      const { raffle: raffle1, raffleAddress: addr1, deadline } = await createRaffle(factory, creator, { title: "Raffle 1" });
      const { raffle: raffle2, raffleAddress: addr2 } = await createRaffle(factory, user1, {
        title: "Raffle 2",
        entryFee: 5000000, // $5
        maxParticipants: 20,
      });

      // Users join different raffles
      await factory.connect(user2).joinRaffle(addr1, 3);
      await factory.connect(user3).joinRaffle(addr1, 2);
      await factory.connect(user2).joinRaffle(addr2, 5);
      await factory.connect(user4).joinRaffle(addr2, 3);

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

      await createRaffle(factory, creator, { title: "Creator R1" });
      await createRaffle(factory, creator, { title: "Creator R2" });
      await createRaffle(factory, user1, { title: "User1 R1" });
      await createRaffle(factory, user2, { title: "User2 R1" });

      expect(await factory.getRaffleCount()).to.equal(4);
      expect(await factory.getCreatorRaffleCount(creator.address)).to.equal(2);
      expect(await factory.getCreatorRaffleCount(user1.address)).to.equal(1);
      expect(await factory.getCreatorRaffleCount(user2.address)).to.equal(1);
    });
  });

  describe("Approve Once, Join Many", function () {
    it("Should allow user to join multiple raffles with single approval", async function () {
      const { factory, usdc, creator, user1 } = await loadFixture(deployFullSystemFixture);

      const { raffleAddress: addr1 } = await createRaffle(factory, creator, { title: "R1" });
      const { raffleAddress: addr2 } = await createRaffle(factory, creator, { title: "R2" });
      const { raffleAddress: addr3 } = await createRaffle(factory, creator, { title: "R3" });

      // user1 already approved in fixture — join all three
      await factory.connect(user1).joinRaffle(addr1, 1);
      await factory.connect(user1).joinRaffle(addr2, 2);
      await factory.connect(user1).joinRaffle(addr3, 3);

      const raffle1 = await ethers.getContractAt("Raffle", addr1);
      const raffle2 = await ethers.getContractAt("Raffle", addr2);
      const raffle3 = await ethers.getContractAt("Raffle", addr3);

      expect(await raffle1.getUserTicketCount(user1.address)).to.equal(1);
      expect(await raffle2.getUserTicketCount(user1.address)).to.equal(2);
      expect(await raffle3.getUserTicketCount(user1.address)).to.equal(3);
    });
  });

  describe("Platform Fees & Economics", function () {
    it("Should accumulate creation fees from multiple raffles", async function () {
      const { factory, usdc, creator, user1, user2 } = await loadFixture(deployFullSystemFixture);

      await createRaffle(factory, creator, { title: "R1" });
      await createRaffle(factory, user1, { title: "R2" });
      await createRaffle(factory, user2, { title: "R3" });

      // 3 raffles = $3 in creation fees
      expect(await factory.getAccumulatedFees()).to.equal(BigInt(CREATION_FEE) * BigInt(3));
    });

    it("Should distribute creation fees correctly on withdrawal", async function () {
      const { factory, usdc, owner, creator, user1 } = await loadFixture(deployFullSystemFixture);

      await createRaffle(factory, creator, { title: "R1" });
      await createRaffle(factory, user1, { title: "R2" });

      const totalFees = BigInt(CREATION_FEE) * BigInt(2);
      const ownerBefore = await usdc.balanceOf(owner.address);

      await factory.connect(owner).withdrawFees();

      expect(await usdc.balanceOf(owner.address) - ownerBefore).to.equal(totalFees);
      expect(await factory.getAccumulatedFees()).to.equal(0);
    });
  });

  describe("Edge Cases & Stress Tests", function () {
    it("Should handle unlimited raffle with many participants", async function () {
      const { factory, vrfCoordinator, usdc, creator, user1 } = await loadFixture(deployFullSystemFixture);

      const { raffle, raffleAddress, deadline } = await createRaffle(factory, creator, {
        title: "Unlimited Raffle",
        maxParticipants: 0,
        entryFee: 100000, // $0.10
      });

      await factory.connect(user1).joinRaffle(raffleAddress, 500);

      expect(await raffle.getTotalTickets()).to.equal(500);
      expect(await raffle.maxParticipants()).to.equal(0);

      await time.increaseTo(deadline + 1);

      const drawTx = await raffle.drawWinner();
      const drawReceipt = await drawTx.wait();
      const requestId = drawReceipt.logs.find(log => log.eventName === "RandomnessRequested").args[0];

      await vrfCoordinator.fulfillRandomWords(requestId, await factory.getAddress());

      expect(await raffle.winner()).to.equal(user1.address); // Only participant
    });

    it("Should handle exact max participants", async function () {
      const { factory, usdc, creator, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const { raffle, raffleAddress } = await createRaffle(factory, creator, { maxParticipants: 5 });

      await factory.connect(user1).joinRaffle(raffleAddress, 3);
      await factory.connect(user2).joinRaffle(raffleAddress, 2);

      expect(await raffle.getTotalTickets()).to.equal(5);

      // Should be full
      await expect(
        factory.connect(user1).joinRaffle(raffleAddress, 1)
      ).to.be.revertedWithCustomError(raffle, "RaffleFull");

      // Should draw immediately (max reached)
      await raffle.drawWinner();
      expect(await raffle.status()).to.equal(2); // ENDED
    });
  });
});
