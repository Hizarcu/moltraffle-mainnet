const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get network name
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "sepolia" : network.name;

  console.log(`🚀 Deploying Raffle Party Platform to ${networkName}...\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Chainlink VRF Configuration - Sepolia
  const VRF_COORDINATOR = process.env.VRF_COORDINATOR_SEPOLIA || "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";
  const KEY_HASH = process.env.VRF_KEY_HASH_SEPOLIA || "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
  const SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "0";

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
  const chainId = Number(network.chainId);
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
  console.log("📋 Next Steps:");
  console.log("   1. Go to https://vrf.chain.link/");
  console.log("   2. Create a subscription and fund it with LINK");
  console.log("   3. Add this contract as a consumer:", factoryAddress);
  console.log("   4. Verify contract on Snowtrace (optional):");
  console.log(`      npx hardhat verify --network fuji ${factoryAddress} "${VRF_COORDINATOR}" "${KEY_HASH}" ${SUBSCRIPTION_ID}`);
  console.log("\n✨ Your raffle platform is ready to use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
