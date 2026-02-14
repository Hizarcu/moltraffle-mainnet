'use client';

import { useEstimateGas, useGasPrice, useChainId } from 'wagmi';
import { encodeFunctionData, formatEther, formatUnits } from 'viem';
import { RaffleFactoryABI } from '@/lib/contracts/abis/RaffleFactory';
import { getRaffleFactoryAddress } from '@/lib/contracts/addresses';

interface GasEstimateProps {
  raffleAddress: string;
  entryFee: bigint;
  ticketCount?: bigint;
  userAddress?: string;
}

export function GasEstimate({ raffleAddress, entryFee, ticketCount, userAddress }: GasEstimateProps) {
  const chainId = useChainId();
  const factoryAddress = getRaffleFactoryAddress(chainId);

  // Get current gas price
  const { data: gasPrice } = useGasPrice();

  // Estimate gas for joining raffle via the Factory
  const { data: gasEstimate } = useEstimateGas({
    to: factoryAddress as `0x${string}`,
    data: encodeFunctionData({
      abi: RaffleFactoryABI,
      functionName: 'joinRaffle',
      args: [
        raffleAddress as `0x${string}`,
        ticketCount ?? BigInt(1),
      ],
    }),
    account: userAddress as `0x${string}`,
  });

  if (!gasPrice || !gasEstimate || !factoryAddress) {
    return null;
  }

  const totalGasCost = gasPrice * gasEstimate;
  const entryFeeDisplay = `$${formatUnits(entryFee, 6)} USDC`;

  return (
    <div className="text-sm space-y-1">
      <div className="flex justify-between text-text-muted">
        <span>Entry Fee</span>
        <span className="font-mono">{entryFeeDisplay}</span>
      </div>
      <div className="flex justify-between text-text-muted">
        <span>Estimated Gas</span>
        <span className="font-mono">{formatEther(totalGasCost)} ETH</span>
      </div>
      <div className="flex justify-between border-t border-border pt-1">
        <span className="font-semibold">Total Cost</span>
        <span className="font-mono font-semibold">{entryFeeDisplay} + {formatEther(totalGasCost)} ETH</span>
      </div>
    </div>
  );
}
