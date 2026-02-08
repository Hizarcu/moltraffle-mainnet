/**
 * Contract addresses per chain
 * These are placeholders - replace with your deployed contract addresses
 */

export const CONTRACT_ADDRESSES = {
  // Mainnet
  1: {
    RaffleFactory: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },

  // Sepolia Testnet
  11155111: {
    RaffleFactory: '0xA5162a3132341bF0Beca924C0f0809F97bd0550c', // Replace with actual address
  },

  // Base Mainnet
  8453: {
    RaffleFactory: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },

  // Base Sepolia Testnet
  84532: {
    RaffleFactory: '0x5EbeD72589eFA689DC1BaAA333487cfdC35E4d3d', // Deployed factory address
  },

  // Avalanche Mainnet
  43114: {
    RaffleFactory: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },

  // Avalanche Fuji Testnet
  43113: {
    RaffleFactory: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

/**
 * Get RaffleFactory address for a given chain
 */
export function getRaffleFactoryAddress(chainId: number): string | undefined {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  return addresses?.RaffleFactory;
}

/**
 * Check if chain is supported
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId in CONTRACT_ADDRESSES;
}
