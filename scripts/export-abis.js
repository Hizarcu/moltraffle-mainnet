const fs = require('fs');
const path = require('path');

// Read compiled artifacts
const RaffleFactoryArtifact = require('../artifacts/contracts/RaffleFactory.sol/RaffleFactory.json');
const RaffleArtifact = require('../artifacts/contracts/Raffle.sol/Raffle.json');

// Extract ABIs
const RaffleFactoryABI = RaffleFactoryArtifact.abi;
const RaffleABI = RaffleArtifact.abi;

// Create TypeScript content for RaffleFactory
const raffleFactoryContent = `// Auto-generated from compiled contracts
// Do not edit manually

export const RaffleFactoryABI = ${JSON.stringify(RaffleFactoryABI, null, 2)} as const;
`;

// Create TypeScript content for Raffle
const raffleContent = `// Auto-generated from compiled contracts
// Do not edit manually

export const RaffleABI = ${JSON.stringify(RaffleABI, null, 2)} as const;
`;

// Write to frontend lib directory
const libContractsDir = path.join(__dirname, '../lib/contracts/abis');

// Create directory if it doesn't exist
if (!fs.existsSync(libContractsDir)) {
  fs.mkdirSync(libContractsDir, { recursive: true });
}

// Write files
fs.writeFileSync(path.join(libContractsDir, 'RaffleFactory.ts'), raffleFactoryContent);
fs.writeFileSync(path.join(libContractsDir, 'Raffle.ts'), raffleContent);

console.log('✅ ABIs exported successfully!');
console.log('📁 Files written to:');
console.log('   - lib/contracts/abis/RaffleFactory.ts');
console.log('   - lib/contracts/abis/Raffle.ts');
