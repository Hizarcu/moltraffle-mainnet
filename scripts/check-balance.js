const { ethers } = require("hardhat");

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  let networkName;
  if (chainId === 8453) {
    networkName = "Base Mainnet";
  } else if (chainId === 84532) {
    networkName = "Base Sepolia";
  } else {
    networkName = `Unknown (${chainId})`;
  }

  console.log(`\n🌐 Network: ${networkName}`);

  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deployer Address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceEth = ethers.formatEther(balance);

  console.log(`💰 Balance: ${balanceEth} ETH`);

  // Check if sufficient for deployment
  const minRequired = 0.005; // Minimum ETH needed
  if (parseFloat(balanceEth) < minRequired) {
    console.log(`\n⚠️  WARNING: Balance may be insufficient for deployment`);
    console.log(`   Recommended: At least ${minRequired} ETH`);
  } else {
    console.log(`\n✅ Sufficient balance for deployment`);
  }

  // Gas price info
  try {
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = ethers.formatUnits(feeData.gasPrice || 0, "gwei");
    console.log(`⛽ Current Gas Price: ${gasPrice} gwei`);
  } catch (e) {
    console.log(`⛽ Gas Price: Unable to fetch`);
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
