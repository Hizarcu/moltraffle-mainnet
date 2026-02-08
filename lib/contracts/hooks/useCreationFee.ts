import { useMemo } from 'react';
import { parseEther, formatEther } from 'viem';

const CREATION_FEE_BPS = BigInt(100); // 1%
const MIN_FEE = parseEther('0.0004');
const MAX_FEE = parseEther('0.05');

/**
 * Calculate the creation fee for a raffle (mirrors contract logic)
 * @param entryFeeStr Entry fee in ETH as string
 * @param maxParticipantsStr Max participants as string (empty = unlimited)
 * @returns Fee as formatted string (e.g. "0.0004") or null if inputs invalid
 */
export function useCreationFee(
  entryFeeStr: string | undefined,
  maxParticipantsStr: string | undefined
): string | null {
  return useMemo(() => {
    if (!entryFeeStr || Number(entryFeeStr) <= 0) return null;

    try {
      const entryFeeWei = parseEther(entryFeeStr);
      const maxParticipants = !maxParticipantsStr || maxParticipantsStr === ''
        ? BigInt(0)
        : BigInt(maxParticipantsStr);

      let fee: bigint;
      if (maxParticipants === BigInt(0)) {
        fee = MAX_FEE;
      } else {
        fee = (entryFeeWei * maxParticipants * CREATION_FEE_BPS) / BigInt(10000);
        if (fee < MIN_FEE) fee = MIN_FEE;
        if (fee > MAX_FEE) fee = MAX_FEE;
      }

      return formatEther(fee);
    } catch {
      return null;
    }
  }, [entryFeeStr, maxParticipantsStr]);
}

/**
 * Calculate creation fee in wei (for passing to contract call)
 */
export function calculateCreationFeeWei(
  entryFeeStr: string,
  maxParticipantsStr: string
): bigint {
  const entryFeeWei = parseEther(entryFeeStr);
  const maxParticipants = !maxParticipantsStr || maxParticipantsStr === ''
    ? BigInt(0)
    : BigInt(maxParticipantsStr);

  if (maxParticipants === BigInt(0)) {
    return MAX_FEE;
  }

  let fee = (entryFeeWei * maxParticipants * CREATION_FEE_BPS) / BigInt(10000);
  if (fee < MIN_FEE) fee = MIN_FEE;
  if (fee > MAX_FEE) fee = MAX_FEE;
  return fee;
}
