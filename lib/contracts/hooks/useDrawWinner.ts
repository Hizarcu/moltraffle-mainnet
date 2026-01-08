import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { RaffleABI } from '../abis/Raffle';

interface UseDrawWinnerOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDrawWinner(raffleAddress: string, options?: UseDrawWinnerOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Winner drawn successfully! Waiting for VRF response...', { id: 'draw-winner' });
      options?.onSuccess?.();
    }
  }, [isSuccess, options]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Failed to draw winner', { id: 'draw-winner' });
      options?.onError?.(error as Error);
    }
  }, [error, options]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading('Drawing winner...', { id: 'draw-winner' });
    }
  }, [isConfirming]);

  const drawWinner = async () => {
    toast.loading('Confirm transaction in your wallet...', { id: 'draw-winner' });

    try {
      writeContract({
        address: raffleAddress as `0x${string}`,
        abi: RaffleABI,
        functionName: 'drawWinner',
      });
    } catch (err) {
      console.error('Error drawing winner:', err);
      toast.error('Failed to draw winner');
    }
  };

  return {
    drawWinner,
    isDrawing: isPending || isConfirming,
    hash,
    isSuccess,
  };
}
