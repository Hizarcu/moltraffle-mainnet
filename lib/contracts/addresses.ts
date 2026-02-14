/**
 * Contract addresses per chain
 */

export const CONTRACT_ADDRESSES = {
  // Base Mainnet
  8453: {
    RaffleFactory: '0x198C3AbA1d0B2eC0BBf2Be986F3070074915E7f1', // Set after deployment
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
} as const;

export const USDC_DECIMALS = 6;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

/**
 * Get RaffleFactory address for a given chain
 */
export function getRaffleFactoryAddress(chainId: number): string | undefined {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  return addresses?.RaffleFactory;
}

/**
 * Get USDC address for a given chain
 */
export function getUSDCAddress(chainId: number): string | undefined {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  return addresses?.USDC;
}

/**
 * Check if chain is supported
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId in CONTRACT_ADDRESSES;
}
