import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { RaffleABI } from '../abis/Raffle';

interface UseCancelRaffleOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCancelRaffle(raffleAddress: string, options?: UseCancelRaffleOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Raffle cancelled! All participants have been refunded.', { id: 'cancel-raffle' });
      optionsRef.current?.onSuccess?.();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error('Cancel raffle error:', error);
      const errorMessage = error.message || 'Failed to cancel raffle';
      toast.error(errorMessage, { id: 'cancel-raffle', duration: 10000 });
      optionsRef.current?.onError?.(error as Error);
    }
  }, [error]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading('Cancelling raffle & refunding...', { id: 'cancel-raffle' });
    }
  }, [isConfirming]);

  const cancelRaffle = async () => {
    toast.loading('Confirm transaction in your wallet...', { id: 'cancel-raffle' });

    try {
      writeContract({
        address: raffleAddress as `0x${string}`,
        abi: RaffleABI,
        functionName: 'cancelRaffle',
      });
    } catch (err) {
      console.error('Error cancelling raffle:', err);
      toast.error('Failed to cancel raffle');
    }
  };

  return {
    cancelRaffle,
    isCancelling: isPending || isConfirming,
    hash,
    isSuccess,
  };
}
