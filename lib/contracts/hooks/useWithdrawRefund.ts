import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { RaffleABI } from '../abis/Raffle';

interface UseWithdrawRefundOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useWithdrawRefund(raffleAddress: string, options?: UseWithdrawRefundOptions) {
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
      toast.success('Refund withdrawn successfully!', { id: 'withdraw-refund' });
      optionsRef.current?.onSuccess?.();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error('Withdraw refund error:', error);
      const errorMessage = error.message || 'Failed to withdraw refund';
      toast.error(errorMessage, { id: 'withdraw-refund', duration: 10000 });
      optionsRef.current?.onError?.(error as Error);
    }
  }, [error]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading('Withdrawing refund...', { id: 'withdraw-refund' });
    }
  }, [isConfirming]);

  const withdrawRefund = async () => {
    toast.loading('Confirm transaction in your wallet...', { id: 'withdraw-refund' });

    try {
      writeContract({
        address: raffleAddress as `0x${string}`,
        abi: RaffleABI,
        functionName: 'withdrawRefund',
      });
    } catch (err) {
      console.error('Error withdrawing refund:', err);
      toast.error('Failed to withdraw refund');
    }
  };

  return {
    withdrawRefund,
    isWithdrawing: isPending || isConfirming,
    hash,
    isSuccess,
  };
}
