const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get network info
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  let networkName;
  if (chainId === 8453) {
    networkName = "base";
  } else if (chainId === 84532) {
    networkName = "baseSepolia";
  } else {
    networkName = network.name;
  }

  console.log(`🚀 Deploying Raffle Party Platform to ${networkName} (Chain ID: ${chainId})...\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Chainlink VRF Configuration
  let VRF_COORDINATOR, KEY_HASH, SUBSCRIPTION_ID;

  if (chainId === 8453) {
    // Base Mainnet
    VRF_COORDINATOR = process.env.VRF_COORDINATOR_BASE_MAINNET || "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634";
    KEY_HASH = process.env.VRF_KEY_HASH_BASE_MAINNET || "0x";
    SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID_MAINNET || "0";

    if (SUBSCRIPTION_ID === "0" || KEY_HASH === "0x") {
      console.log("❌ ERROR: Base Mainnet VRF configuration incomplete!");
      console.log("📋 Required environment variables:");
      console.log("   - VRF_SUBSCRIPTION_ID_MAINNET");
      console.log("   - VRF_KEY_HASH_BASE_MAINNET");
      console.log("\n⚠️  Aborting deployment. Please configure VRF first.");
      process.exit(1);
    }
  } else {
    // Base Sepolia (Testnet)
    VRF_COORDINATOR = process.env.VRF_COORDINATOR_BASE_SEPOLIA || "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE";
    KEY_HASH = process.env.VRF_KEY_HASH_BASE_SEPOLIA || "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887";
    SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "0";
  }

  if (SUBSCRIPTION_ID === "0") {
    console.log("⚠️  WARNING: VRF_SUBSCRIPTION_ID not set!");
    console.log("📋 You need to:");
    console.log("   1. Create a Chainlink VRF subscription at https://vrf.chain.link/");
    console.log("   2. Fund it with LINK tokens");
    console.log("   3. Add your deployed contract as a consumer");
    console.log("   4. Update VRF_SUBSCRIPTION_ID in .env\n");
  }

  console.log("🔗 Chainlink VRF Configuration:");
  console.log("   Coordinator:", VRF_COORDINATOR);
  console.log("   Key Hash:", KEY_HASH);
  console.log("   Subscription ID:", SUBSCRIPTION_ID);
  console.log("");

  // Deploy RaffleFactory
  console.log("📦 Deploying RaffleFactory...");
  const RaffleFactory = await ethers.getContractFactory("RaffleFactory");
  const raffleFactory = await RaffleFactory.deploy(
    VRF_COORDINATOR,
    KEY_HASH,
    SUBSCRIPTION_ID
  );

  await raffleFactory.waitForDeployment();
  const factoryAddress = await raffleFactory.getAddress();

  console.log("✅ RaffleFactory deployed to:", factoryAddress);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      RaffleFactory: {
        address: factoryAddress,
        vrfCoordinator: VRF_COORDINATOR,
        keyHash: KEY_HASH,
        subscriptionId: SUBSCRIPTION_ID,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentPath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", deploymentPath);

  // Update frontend addresses.ts
  console.log("\n🔄 Updating frontend contract addresses...");
  const addressesPath = path.join(__dirname, "../lib/contracts/addresses.ts");

  let addressesContent = fs.readFileSync(addressesPath, "utf8");

  // Update address for the deployed network
  const chainIdPattern = new RegExp(`${chainId}: \\{[\\s\\S]*?RaffleFactory: ['"]0x[0-9a-fA-F]{40}['"]`, 'g');
  addressesContent = addressesContent.replace(
    chainIdPattern,
    `${chainId}: {\n    RaffleFactory: '${factoryAddress}'`
  );

  fs.writeFileSync(addressesPath, addressesContent);
  console.log("✅ Frontend addresses updated!");

  console.log("\n🎉 Deployment Complete!\n");

  if (chainId === 8453) {
    // Mainnet specific instructions
    console.log("⚠️  MAINNET DEPLOYMENT - READ CAREFULLY:");
    console.log("\n📋 Critical Next Steps:");
    console.log("   1. Add factory as VRF consumer:");
    console.log("      Go to https://vrf.chain.link/");
    console.log("      Add consumer:", factoryAddress);
    console.log("\n   2. Verify contract on BaseScan:");
    console.log(`      npx hardhat verify --network base ${factoryAddress} "${VRF_COORDINATOR}" "${KEY_HASH}" ${SUBSCRIPTION_ID}`);
    console.log("\n   3. Test with small amounts first:");
    console.log("      Create a test raffle with 0.001 ETH entry fee");
    console.log("      Verify draw winner works correctly");
    console.log("\n   4. Update frontend:");
    console.log("      - Verify lib/contracts/addresses.ts has correct mainnet address");
    console.log("      - Update wagmi config for Base mainnet (chainId: 8453)");
    console.log("\n   5. Security checklist:");
    console.log("      ✅ All tests passing");
    console.log("      ✅ Contract verified on BaseScan");
    console.log("      ✅ VRF consumer added");
    console.log("      ✅ Small test raffle completed successfully");
    console.log("\n⚠️  DO NOT promote to users until all steps complete!");
  } else {
    // Testnet instructions
    console.log("📋 Next Steps:");
    console.log("   1. Go to https://vrf.chain.link/");
    console.log("   2. Add this contract as a consumer:", factoryAddress);
    console.log("   3. Verify contract (optional):");
    console.log(`      npx hardhat verify --network baseSepolia ${factoryAddress} "${VRF_COORDINATOR}" "${KEY_HASH}" ${SUBSCRIPTION_ID}`);
  }

  console.log("\n✨ Deployment info saved to:", deploymentPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
