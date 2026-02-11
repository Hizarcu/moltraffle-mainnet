/**
 * Contract addresses per chain
 */

export const CONTRACT_ADDRESSES = {
  // Base Mainnet
  8453: {
    RaffleFactory: '0xd921A03dd1d78cD030FC769feB944f018c00F1a7', // Set after deployment
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
