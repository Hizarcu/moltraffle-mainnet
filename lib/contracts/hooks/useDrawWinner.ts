import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { RaffleABI } from '../abis/Raffle';

interface UseDrawWinnerOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDrawWinner(raffleAddress: string, options?: UseDrawWinnerOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const optionsRef = useRef(options);

  // Update ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Winner drawn successfully! Waiting for VRF response...', { id: 'draw-winner' });
      optionsRef.current?.onSuccess?.();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error('Draw winner error:', error);
      const errorMessage = error.message || 'Failed to draw winner';
      toast.error(errorMessage, { id: 'draw-winner', duration: 10000 });
      optionsRef.current?.onError?.(error as Error);
    }
  }, [error]);

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
        gas: BigInt(500000), // Set reasonable gas limit for VRF request
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
