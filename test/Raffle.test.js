const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Raffle Contract", function () {
  // Constants
  const ENTRY_FEE = ethers.parseEther("0.1");
  const MAX_PARTICIPANTS = 100;
  const TITLE = "Test Raffle";
  const DESCRIPTION = "Test Description";
  const PRIZE_DESCRIPTION = "Test Prize";

  // Deployment fixture
  async function deployRaffleFixture() {
    const [owner, creator, user1, user2, user3, contractWallet] = await ethers.getSigners();

    // Deploy mock factory
    const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
    const factory = await MockFactory.deploy();

    // Set deadline to 7 days from now
    const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

    // Deploy Raffle via factory mock
    const Raffle = await ethers.getContractFactory("Raffle");
    const raffle = await Raffle.deploy(
      TITLE,
      DESCRIPTION,
      PRIZE_DESCRIPTION,
      ENTRY_FEE,
      deadline,
      MAX_PARTICIPANTS,
      creator.address,
      await factory.getAddress()
    );

    return { raffle, factory, owner, creator, user1, user2, user3, contractWallet, deadline };
  }

  async function deployUnlimitedRaffleFixture() {
    const [owner, creator, user1, user2] = await ethers.getSigners();

    const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
    const factory = await MockFactory.deploy();

    const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

    const Raffle = await ethers.getContractFactory("Raffle");
    const raffle = await Raffle.deploy(
      TITLE,
      DESCRIPTION,
      PRIZE_DESCRIPTION,
      ENTRY_FEE,
      deadline,
      0, // Unlimited
      creator.address,
      await factory.getAddress()
    );

    return { raffle, factory, owner, creator, user1, user2, deadline };
  }

  describe("Deployment & Validation", function () {
    it("Should deploy with correct parameters", async function () {
      const { raffle, creator, deadline } = await loadFixture(deployRaffleFixture);

      expect(await raffle.title()).to.equal(TITLE);
      expect(await raffle.description()).to.equal(DESCRIPTION);
      expect(await raffle.entryFee()).to.equal(ENTRY_FEE);
      expect(await raffle.deadline()).to.equal(deadline);
      expect(await raffle.maxParticipants()).to.equal(MAX_PARTICIPANTS);
      expect(await raffle.creator()).to.equal(creator.address);
      expect(await raffle.status()).to.equal(1); // ACTIVE
    });

    it("Should reject deadline in the past", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy();

      const pastDeadline = (await time.latest()) - 1;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          pastDeadline,
          MAX_PARTICIPANTS,
          creator.address,
          await factory.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "DeadlineMustBeInFuture");
    });

    it("Should reject deadline > 365 days", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy();

      const farDeadline = (await time.latest()) + 366 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          farDeadline,
          MAX_PARTICIPANTS,
          creator.address,
          await factory.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "DeadlineTooFar");
    });

    it("Should reject entry fee = 0", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy();

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          0,
          deadline,
          MAX_PARTICIPANTS,
          creator.address,
          await factory.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "EntryFeeMustBePositive");
    });

    it("Should reject entry fee > 100 ETH", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy();

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ethers.parseEther("101"),
          deadline,
          MAX_PARTICIPANTS,
          creator.address,
          await factory.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "EntryFeeTooHigh");
    });

    it("Should reject maxParticipants = 1", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy();

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          deadline,
          1, // Invalid
          creator.address,
          await factory.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "MinParticipantsTooLow");
    });

    it("Should reject maxParticipants > 10000", async function () {
      const [owner, creator] = await ethers.getSigners();
      const MockFactory = await ethers.getContractFactory("MockRaffleFactory");
      const factory = await MockFactory.deploy();

      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          deadline,
          10001, // Invalid
          creator.address,
          await factory.getAddress()
        )
      ).to.be.revertedWithCustomError(Raffle, "MaxParticipantsTooHigh");
    });

    it("Should accept maxParticipants = 0 (unlimited)", async function () {
      const { raffle } = await loadFixture(deployUnlimitedRaffleFixture);
      expect(await raffle.maxParticipants()).to.equal(0);
    });

    it("Should reject zero factory address", async function () {
      const [owner, creator] = await ethers.getSigners();
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      const Raffle = await ethers.getContractFactory("Raffle");
      await expect(
        Raffle.deploy(
          TITLE,
          DESCRIPTION,
          PRIZE_DESCRIPTION,
          ENTRY_FEE,
          deadline,
          MAX_PARTICIPANTS,
          creator.address,
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(Raffle, "InvalidFactoryAddress");
    });
  });

  describe("Join Raffle - Single Ticket", function () {
    it("Should allow user to join with exact payment", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      await expect(
        raffle.connect(user1).joinRaffle(1, { value: ENTRY_FEE })
      ).to.emit(raffle, "ParticipantJoined")
        .withArgs(user1.address, 1, 1, 1);

      expect(await raffle.getTotalTickets()).to.equal(1);
      expect(await raffle.getUserTicketCount(user1.address)).to.equal(1);
    });

    it("Should refund overpayment", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      const overpayment = ENTRY_FEE + ethers.parseEther("0.05");
      const balanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await raffle.connect(user1).joinRaffle(1, { value: overpayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const expectedBalance = balanceBefore - ENTRY_FEE - gasUsed;

      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });

    it("Should reject insufficient payment", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      await expect(
        raffle.connect(user1).joinRaffle(1, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWithCustomError(raffle, "InsufficientPayment");
    });

    it("Should reject zero tickets", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      await expect(
        raffle.connect(user1).joinRaffle(0, { value: ENTRY_FEE })
      ).to.be.revertedWithCustomError(raffle, "InvalidTicketCount");
    });
  });

  describe("Join Raffle - Multiple Tickets", function () {
    it("Should allow user to buy multiple tickets at once", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      await expect(
        raffle.connect(user1).joinRaffle(5, { value: ENTRY_FEE * BigInt(5) })
      ).to.emit(raffle, "ParticipantJoined")
        .withArgs(user1.address, 5, 5, 5);

      expect(await raffle.getTotalTickets()).to.equal(5);
      expect(await raffle.getUserTicketCount(user1.address)).to.equal(5);
    });

    it("Should track multiple purchases from same user", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      await raffle.connect(user1).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });

      expect(await raffle.getTotalTickets()).to.equal(5);
      expect(await raffle.getUserTicketCount(user1.address)).to.equal(5);
    });

    it("Should allow different users to join", async function () {
      const { raffle, user1, user2, user3 } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      await raffle.connect(user2).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      await raffle.connect(user3).joinRaffle(1, { value: ENTRY_FEE });

      expect(await raffle.getTotalTickets()).to.equal(6);
      expect(await raffle.getUserTicketCount(user1.address)).to.equal(2);
      expect(await raffle.getUserTicketCount(user2.address)).to.equal(3);
      expect(await raffle.getUserTicketCount(user3.address)).to.equal(1);
    });
  });

  describe("Join Raffle - Max Participants", function () {
    it("Should reject when raffle is full", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      // Fill the raffle (100 max)
      await raffle.connect(user1).joinRaffle(MAX_PARTICIPANTS, {
        value: ENTRY_FEE * BigInt(MAX_PARTICIPANTS)
      });

      // Try to join when full
      await expect(
        raffle.connect(user1).joinRaffle(1, { value: ENTRY_FEE })
      ).to.be.revertedWithCustomError(raffle, "RaffleFull");
    });

    it("Should reject when purchase would exceed max", async function () {
      const { raffle, user1, user2 } = await loadFixture(deployRaffleFixture);

      // Buy 98 tickets
      await raffle.connect(user1).joinRaffle(98, { value: ENTRY_FEE * BigInt(98) });

      // Try to buy 3 tickets (would exceed 100)
      await expect(
        raffle.connect(user2).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) })
      ).to.be.revertedWithCustomError(raffle, "RaffleFull");
    });

    it("Should allow unlimited participants when maxParticipants = 0", async function () {
      const { raffle, user1 } = await loadFixture(deployUnlimitedRaffleFixture);

      // Buy 200 tickets (more than default max)
      await raffle.connect(user1).joinRaffle(200, { value: ENTRY_FEE * BigInt(200) });

      expect(await raffle.getTotalTickets()).to.equal(200);
    });
  });

  describe("Join Raffle - Deadline", function () {
    it("Should reject join after deadline", async function () {
      const { raffle, user1, deadline } = await loadFixture(deployRaffleFixture);

      // Advance time past deadline
      await time.increaseTo(deadline + 1);

      await expect(
        raffle.connect(user1).joinRaffle(1, { value: ENTRY_FEE })
      ).to.be.revertedWithCustomError(raffle, "RaffleEnded");
    });
  });

  describe("Draw Winner", function () {
    it("Should reject draw before deadline with unfilled raffle", async function () {
      const { raffle, user1 } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(5, { value: ENTRY_FEE * BigInt(5) });

      await expect(
        raffle.drawWinner()
      ).to.be.revertedWithCustomError(raffle, "DeadlineNotReached");
    });

    it("Should allow draw when max participants reached", async function () {
      const { raffle, factory, user1 } = await loadFixture(deployRaffleFixture);

      // Fill raffle to max
      await raffle.connect(user1).joinRaffle(MAX_PARTICIPANTS, {
        value: ENTRY_FEE * BigInt(MAX_PARTICIPANTS)
      });

      await expect(raffle.drawWinner())
        .to.emit(raffle, "RandomnessRequested");
    });

    it("Should allow draw after deadline", async function () {
      const { raffle, user1, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(5, { value: ENTRY_FEE * BigInt(5) });

      await time.increaseTo(deadline + 1);

      await expect(raffle.drawWinner())
        .to.emit(raffle, "RandomnessRequested");
    });

    it("Should reject draw with no participants", async function () {
      const { raffle, deadline } = await loadFixture(deployRaffleFixture);

      await time.increaseTo(deadline + 1);

      await expect(
        raffle.drawWinner()
      ).to.be.revertedWithCustomError(raffle, "NoParticipants");
    });

    it("Should change status to ENDED after draw request", async function () {
      const { raffle, user1, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      await time.increaseTo(deadline + 1);

      await raffle.drawWinner();

      expect(await raffle.status()).to.equal(2); // ENDED
    });

    it("Should allow anyone to call drawWinner", async function () {
      const { raffle, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      await time.increaseTo(deadline + 1);

      // User2 calls drawWinner (not creator)
      await expect(raffle.connect(user2).drawWinner())
        .to.emit(raffle, "RandomnessRequested");
    });
  });

  describe("Fulfill Randomness", function () {
    it("Should only allow factory to fulfill randomness", async function () {
      const { raffle, user1, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      await expect(
        raffle.connect(user1).fulfillRandomness(requestId, 12345)
      ).to.be.revertedWithCustomError(raffle, "OnlyFactory");
    });

    it("Should select winner correctly with VRF callback", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      await raffle.connect(user2).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      // Simulate VRF callback via factory
      const randomNumber = 12345;
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, randomNumber);

      const winner = await raffle.winner();
      const winnerIndex = await raffle.winnerIndex();
      const randomResult = await raffle.randomResult();

      expect(winner).to.not.equal(ethers.ZeroAddress);
      expect(winnerIndex).to.equal(randomNumber % 5); // 5 total tickets
      expect(randomResult).to.equal(randomNumber);
      expect(await raffle.status()).to.equal(3); // DRAWN
    });

    it("Should reject wrong requestId", async function () {
      const { raffle, factory, user1, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      await expect(
        factory.simulateFulfillment(await raffle.getAddress(), requestId + BigInt(1), 12345)
      ).to.be.revertedWithCustomError(raffle, "InvalidRequestId");
    });

    it("Should reject double fulfillment", async function () {
      const { raffle, factory, user1, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
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

  describe("Claim Prize", function () {
    it("Should allow winner to claim prize", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      await raffle.connect(user2).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      // Fulfill with number that selects user1
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();
      const prizePool = await raffle.getPrizePool();

      const balanceBefore = await ethers.provider.getBalance(winner);

      const winnerSigner = await ethers.getSigner(winner);
      const claimTx = await raffle.connect(winnerSigner).claimPrize();
      const claimReceipt = await claimTx.wait();
      const gasUsed = claimReceipt.gasUsed * claimReceipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(winner);

      expect(balanceAfter).to.equal(balanceBefore + prizePool - gasUsed);
    });

    it("Should reject non-winner claiming", async function () {
      const { raffle, factory, user1, user2, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();

      // User2 tries to claim (not winner)
      if (winner !== user2.address) {
        await expect(
          raffle.connect(user2).claimPrize()
        ).to.be.revertedWithCustomError(raffle, "NotWinner");
      }
    });

    it("Should reject double claim", async function () {
      const { raffle, factory, user1, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();
      const winnerSigner = await ethers.getSigner(winner);

      await raffle.connect(winnerSigner).claimPrize();

      await expect(
        raffle.connect(winnerSigner).claimPrize()
      ).to.be.revertedWithCustomError(raffle, "WinnerAlreadyDrawn");
    });
  });

  describe("Cancel Raffle", function () {
    it("Should allow creator to cancel raffle", async function () {
      const { raffle, creator, user1 } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await expect(raffle.connect(creator).cancelRaffle())
        .to.emit(raffle, "RaffleCancelled");

      expect(await raffle.status()).to.equal(4); // CANCELLED
    });

    it("Should refund all participants on cancel", async function () {
      const { raffle, creator, user1, user2 } = await loadFixture(deployRaffleFixture);

      const balance1Before = await ethers.provider.getBalance(user1.address);
      const balance2Before = await ethers.provider.getBalance(user2.address);

      const tx1 = await raffle.connect(user1).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed * receipt1.gasPrice;

      const tx2 = await raffle.connect(user2).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      const receipt2 = await tx2.wait();
      const gas2 = receipt2.gasUsed * receipt2.gasPrice;

      await raffle.connect(creator).cancelRaffle();

      const balance1After = await ethers.provider.getBalance(user1.address);
      const balance2After = await ethers.provider.getBalance(user2.address);

      // Users should get their entry fees back (minus gas)
      expect(balance1After).to.equal(balance1Before - gas1);
      expect(balance2After).to.equal(balance2Before - gas2);
    });

    it("Should reject cancel by non-creator", async function () {
      const { raffle, user1, user2 } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await expect(
        raffle.connect(user2).cancelRaffle()
      ).to.be.revertedWithCustomError(raffle, "NotCreator");
    });

    it("Should reject cancel after winner drawn", async function () {
      const { raffle, factory, creator, user1, deadline } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      await expect(
        raffle.connect(creator).cancelRaffle()
      ).to.be.revertedWithCustomError(raffle, "RaffleEnded");
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
      expect(details._status).to.equal(1); // ACTIVE
      expect(details._creator).to.equal(creator.address);
      expect(details._winner).to.equal(ethers.ZeroAddress);
    });

    it("Should return correct participants array", async function () {
      const { raffle, user1, user2 } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });
      await raffle.connect(user2).joinRaffle(1, { value: ENTRY_FEE });

      const participants = await raffle.getParticipants();

      expect(participants.length).to.equal(3);
      expect(participants[0]).to.equal(user1.address);
      expect(participants[1]).to.equal(user1.address);
      expect(participants[2]).to.equal(user2.address);
    });

    it("Should return correct prize pool", async function () {
      const { raffle, user1, user2 } = await loadFixture(deployRaffleFixture);

      await raffle.connect(user1).joinRaffle(3, { value: ENTRY_FEE * BigInt(3) });
      await raffle.connect(user2).joinRaffle(2, { value: ENTRY_FEE * BigInt(2) });

      const prizePool = await raffle.getPrizePool();

      expect(prizePool).to.equal(ENTRY_FEE * BigInt(5));
    });
  });

  describe("Smart Contract Recipients (Call Safety)", function () {
    it("Should successfully refund overpayment to contract wallet", async function () {
      const { raffle, contractWallet } = await loadFixture(deployRaffleFixture);

      // Deploy mock receiver contract
      const MockReceiver = await ethers.getContractFactory("MockReceiver");
      const receiver = await MockReceiver.deploy();

      const overpayment = ENTRY_FEE + ethers.parseEther("0.1");

      // Send from contract wallet to join
      await contractWallet.sendTransaction({
        to: await receiver.getAddress(),
        value: overpayment * BigInt(2)
      });

      await receiver.joinRaffle(await raffle.getAddress(), 1, overpayment);

      // Verify refund was received by checking contract balance
      const receiverBalance = await ethers.provider.getBalance(await receiver.getAddress());
      expect(receiverBalance).to.be.gte(ethers.parseEther("0.09"));
    });

    it("Should successfully send prize to contract wallet", async function () {
      const { raffle, factory, deadline, user1 } = await loadFixture(deployRaffleFixture);

      const MockReceiver = await ethers.getContractFactory("MockReceiver");
      const receiver = await MockReceiver.deploy();

      // Send ETH to receiver contract first
      await user1.sendTransaction({
        to: await receiver.getAddress(),
        value: ENTRY_FEE * BigInt(3)
      });

      // Receiver joins raffle
      await receiver.joinRaffle(await raffle.getAddress(), 2, ENTRY_FEE * BigInt(2));

      await time.increaseTo(deadline + 1);

      const tx = await raffle.drawWinner();
      const receipt = await tx.wait();
      const requestId = receipt.logs[0].args[0];

      // Ensure receiver wins
      await factory.simulateFulfillment(await raffle.getAddress(), requestId, 0);

      const winner = await raffle.winner();
      expect(winner).to.equal(await receiver.getAddress());

      const balanceBefore = await ethers.provider.getBalance(await receiver.getAddress());

      await receiver.claimPrize(await raffle.getAddress());

      const balanceAfter = await ethers.provider.getBalance(await receiver.getAddress());

      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });
});
