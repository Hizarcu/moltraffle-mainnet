/**
 * Contract addresses per chain
 */

export const CONTRACT_ADDRESSES = {
  // Base Mainnet
  8453: {
    RaffleFactory: '0x480b9708f619AbECE5c7E651A9D16ffb3FFeFaDe', // Set after deployment
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
