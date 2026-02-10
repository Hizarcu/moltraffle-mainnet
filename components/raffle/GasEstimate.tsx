'use client';

import { useEstimateGas, useGasPrice } from 'wagmi';
import { formatEther } from 'viem';
import { RaffleABI } from '@/lib/contracts/abis/Raffle';

interface GasEstimateProps {
  raffleAddress: string;
  entryFee: bigint;
  userAddress?: string;
}

export function GasEstimate({ raffleAddress, entryFee, userAddress }: GasEstimateProps) {
  // Get current gas price
  const { data: gasPrice } = useGasPrice();

  // Estimate gas for joining raffle
  const { data: gasEstimate } = useEstimateGas({
    to: raffleAddress as `0x${string}`,
    data: '0x', // joinRaffle() function call data
    value: entryFee,
    account: userAddress as `0x${string}`,
  });

  if (!gasPrice || !gasEstimate) {
    return null;
  }

  const totalGasCost = gasPrice * gasEstimate;
  const totalCost = entryFee + totalGasCost;

  return (
    <div className="text-sm space-y-1">
      <div className="flex justify-between text-text-muted">
        <span>Estimated Gas</span>
        <span className="font-mono">{formatEther(totalGasCost)} ETH</span>
      </div>
      <div className="flex justify-between border-t border-border pt-1">
        <span className="font-semibold">Total Cost</span>
        <span className="font-mono font-semibold">{formatEther(totalCost)} ETH</span>
      </div>
    </div>
  );
}
