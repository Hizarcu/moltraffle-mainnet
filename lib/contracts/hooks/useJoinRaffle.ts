import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { RaffleABI } from '../abis/Raffle';
import toast from 'react-hot-toast';

interface UseJoinRaffleParams {
  raffleAddress: string;
  entryFee: bigint;
  onSuccess?: () => void;
}

export function useJoinRaffle({ raffleAddress, entryFee, onSuccess }: UseJoinRaffleParams) {
  const [isJoining, setIsJoining] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const joinRaffle = async () => {
    try {
      setIsJoining(true);

      // Show pending toast
      toast.loading('Confirm transaction in your wallet...', { id: 'join-raffle' });

      // Call contract
      writeContract({
        address: raffleAddress as `0x${string}`,
        abi: RaffleABI,
        functionName: 'joinRaffle',
        value: entryFee,
      });
    } catch (err: any) {
      console.error('Join raffle error:', err);
      toast.error(err.message || 'Failed to join raffle', { id: 'join-raffle' });
      setIsJoining(false);
    }
  };

  // Handle transaction status changes
  if (isConfirming && isJoining) {
    toast.loading('Transaction pending...', { id: 'join-raffle' });
  }

  if (isSuccess && isJoining) {
    toast.success('Successfully joined the raffle!', { id: 'join-raffle' });
    setIsJoining(false);
    onSuccess?.();
  }

  if (error && isJoining) {
    toast.error(error.message || 'Transaction failed', { id: 'join-raffle' });
    setIsJoining(false);
  }

  return {
    joinRaffle,
    isJoining: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}
