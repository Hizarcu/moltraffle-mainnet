// Flat $1 USDC creation fee (6 decimals)
export const CREATION_FEE_USDC = BigInt(1000000);

/**
 * Returns the flat creation fee display string
 */
export function useCreationFee(): string {
  return '$1.00 USDC';
}
