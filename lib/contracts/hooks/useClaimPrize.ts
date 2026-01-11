import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { RaffleABI } from '../abis/Raffle';

interface UseClaimPrizeOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useClaimPrize(raffleAddress: string, options?: UseClaimPrizeOptions) {
  const { writeContractAsync, isPending } = useWriteContract();
  const optionsRef = useRef(options);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  // Update ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Prize claimed successfully!', { id: 'claim-prize' });
      optionsRef.current?.onSuccess?.();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading('Claiming prize...', { id: 'claim-prize' });
    }
  }, [isConfirming]);

  const claimPrize = async () => {
    try {
      toast.loading('Confirm transaction in your wallet...', { id: 'claim-prize' });

      const hash = await writeContractAsync({
        address: raffleAddress as `0x${string}`,
        abi: RaffleABI,
        functionName: 'claimPrize',
        gas: BigInt(300000), // Increased gas limit for ETH transfer + state changes
      });

      setTxHash(hash);
    } catch (err: any) {
      console.error('Error claiming prize:', err);

      let errorMessage = 'Failed to claim prize';
      if (err.shortMessage) {
        errorMessage = err.shortMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, { id: 'claim-prize', duration: 10000 });
      optionsRef.current?.onError?.(err as Error);
    }
  };

  return {
    claimPrize,
    isClaiming: isPending || isConfirming,
    hash: txHash,
    isSuccess,
  };
}
