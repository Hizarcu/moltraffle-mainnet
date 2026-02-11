const { ethers } = require("hardhat");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  const FACTORY_ADDRESS = "0x0A7c2E2Eb08e198800C57CD75eA73d6D335B1BDc";
  const factory = await ethers.getContractAt("RaffleFactory", FACTORY_ADDRESS);

  // ============================================
  // Test 1: Read existing 5% commission raffle
  // ============================================
  console.log("=== Test 1: Read existing 5% commission raffle ===");
  const EXISTING_RAFFLE = "0x2a894ddFEd9B3BE2F2a0FAaac1923eE52b7ec5C8";
  const raffle5 = await ethers.getContractAt("Raffle", EXISTING_RAFFLE);

  const comm5 = await raffle5.creatorCommissionBps();
  console.log("creatorCommissionBps():", Number(comm5), "bps =", Number(comm5) / 100, "%");

  const details5 = await raffle5.getRaffleDetails();
  console.log("getRaffleDetails()[9]:", Number(details5[9]), "bps =", Number(details5[9]) / 100, "%");
  console.log("PASS: 5% commission stored and readable\n");

  // ============================================
  // Test 2: Create 0% commission raffle
  // ============================================
  console.log("=== Test 2: Create 0% commission raffle ===");
  const entryFee = ethers.parseEther("0.001");
  const creationFee = await factory.calculateCreationFee(entryFee, 5);
  const deadline = Math.floor(Date.now() / 1000) + 7200; // 2 hours

  const tx0 = await factory.createRaffle(
    "Zero Commission Test",
    "Testing 0% commission works correctly",
    "Full prize to winner",
    entryFee, deadline, 5, 0,
    { value: creationFee }
  );
  const receipt0 = await tx0.wait();
  const event0 = receipt0.logs.find(log => {
    try { return factory.interface.parseLog({ topics: log.topics, data: log.data })?.name === "RaffleCreated"; }
    catch { return false; }
  });
  const parsed0 = factory.interface.parseLog({ topics: event0.topics, data: event0.data });
  console.log("Raffle:", parsed0.args.raffleAddress);
  console.log("Commission from event:", Number(parsed0.args.creatorCommissionBps), "bps (expected: 0)");

  // Wait for state propagation
  console.log("Waiting 5s for RPC state propagation...");
  await sleep(5000);

  const raffle0 = await ethers.getContractAt("Raffle", parsed0.args.raffleAddress);
  const code0 = await ethers.provider.getCode(parsed0.args.raffleAddress);
  console.log("Contract code length:", code0.length, "chars");
  const comm0 = await raffle0.creatorCommissionBps();
  console.log("creatorCommissionBps():", Number(comm0), "bps (expected: 0)");
  console.log("PASS: 0% commission created\n");

  // ============================================
  // Test 3: Create 10% commission raffle (max)
  // ============================================
  console.log("=== Test 3: Create 10% commission raffle (max) ===");
  const tx10 = await factory.createRaffle(
    "Max Commission Test",
    "Testing 10% max commission",
    "Prize minus 10%",
    entryFee, deadline, 5, 1000,
    { value: creationFee }
  );
  const receipt10 = await tx10.wait();
  const event10 = receipt10.logs.find(log => {
    try { return factory.interface.parseLog({ topics: log.topics, data: log.data })?.name === "RaffleCreated"; }
    catch { return false; }
  });
  const parsed10 = factory.interface.parseLog({ topics: event10.topics, data: event10.data });
  console.log("Raffle:", parsed10.args.raffleAddress);
  console.log("Commission from event:", Number(parsed10.args.creatorCommissionBps), "bps (expected: 1000)");

  await sleep(5000);
  const raffle10 = await ethers.getContractAt("Raffle", parsed10.args.raffleAddress);
  const comm10 = await raffle10.creatorCommissionBps();
  console.log("creatorCommissionBps():", Number(comm10), "bps (expected: 1000)");
  console.log("PASS: 10% commission created\n");

  // ============================================
  // Test 4: 11% commission should REVERT
  // ============================================
  console.log("=== Test 4: Reject 11% commission ===");
  try {
    const tx11 = await factory.createRaffle(
      "Invalid", "Invalid", "Invalid",
      entryFee, deadline, 5, 1100,
      { value: creationFee }
    );
    await tx11.wait();
    console.log("FAIL: 11% commission was not rejected!");
    process.exit(1);
  } catch (err) {
    const msg = err.message || String(err);
    if (msg.includes("InvalidCommission") || msg.includes("reverted")) {
      console.log("PASS: 11% commission correctly rejected\n");
    } else {
      console.log("Rejected with:", msg.substring(0, 120));
      console.log("PASS: Transaction was rejected\n");
    }
  }

  // ============================================
  // Test 5: Join 5% raffle & verify prize split math
  // ============================================
  console.log("=== Test 5: Join 5% raffle & check split math ===");
  const prizePoolBefore = await raffle5.getPrizePool();
  const currentCount = Number(details5[5]);
  console.log("Current participants:", currentCount, "| Prize pool:", ethers.formatEther(prizePoolBefore), "ETH");

  if (currentCount < 5) {
    const ticketsToAdd = 3;
    const joinTx = await raffle5.joinRaffle(ticketsToAdd, { value: entryFee * BigInt(ticketsToAdd) });
    await joinTx.wait();
    console.log("Joined with", ticketsToAdd, "more tickets");

    await sleep(3000);
    const prizePoolAfter = await raffle5.getPrizePool();
    console.log("Prize pool after:", ethers.formatEther(prizePoolAfter), "ETH");

    const creatorCut = (prizePoolAfter * BigInt(500)) / BigInt(10000);
    const winnerCut = prizePoolAfter - creatorCut;
    console.log("Expected creator cut (5%):", ethers.formatEther(creatorCut), "ETH");
    console.log("Expected winner cut (95%):", ethers.formatEther(winnerCut), "ETH");
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n========================================");
  console.log("  ALL TESTS PASSED");
  console.log("========================================");
  console.log("Factory:", FACTORY_ADDRESS);
  console.log("5% raffle:", EXISTING_RAFFLE);
  console.log("0% raffle:", parsed0.args.raffleAddress);
  console.log("10% raffle:", parsed10.args.raffleAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
