import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { RaffleFactoryABI } from '../abis/RaffleFactory';
import { getRaffleFactoryAddress } from '../addresses';
import toast from 'react-hot-toast';

interface UseJoinRaffleParams {
  raffleAddress: string;
  ticketCount: number;
  onSuccess?: () => void;
}

export function useJoinRaffle({ raffleAddress, ticketCount, onSuccess }: UseJoinRaffleParams) {
  const [isJoining, setIsJoining] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const chainId = useChainId();

  const { writeContractAsync, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const joinRaffle = async () => {
    const factoryAddress = getRaffleFactoryAddress(chainId);
    if (!factoryAddress) {
      toast.error('Factory not deployed on this chain', { id: 'join-raffle' });
      return;
    }

    try {
      setIsJoining(true);

      toast.loading('Confirm transaction in your wallet...', { id: 'join-raffle' });

      // Call Factory.joinRaffle(raffleAddress, ticketCount)
      const hash = await writeContractAsync({
        address: factoryAddress as `0x${string}`,
        abi: RaffleFactoryABI,
        functionName: 'joinRaffle',
        args: [raffleAddress as `0x${string}`, BigInt(ticketCount)],
      });

      setTxHash(hash);
      toast.loading('Transaction pending...', { id: 'join-raffle' });

    } catch (err: any) {
      console.error('Join raffle error:', err);

      let errorMessage = 'Failed to join raffle';
      if (err.shortMessage) {
        errorMessage = err.shortMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (errorMessage.includes('RaffleNotActive')) {
        errorMessage = 'Raffle is not active';
      } else if (errorMessage.includes('RaffleFull')) {
        errorMessage = 'Raffle is full';
      } else if (errorMessage.includes('InvalidRaffle')) {
        errorMessage = 'Invalid raffle address';
      } else if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (errorMessage.includes('insufficient allowance') || errorMessage.includes('SafeERC20')) {
        errorMessage = 'Insufficient USDC allowance. Please approve USDC first.';
      }

      toast.error(errorMessage, { id: 'join-raffle' });
      setIsJoining(false);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isSuccess && isJoining) {
      toast.success('Successfully joined the raffle!', { id: 'join-raffle' });
      setIsJoining(false);
      onSuccess?.();
    }
  }, [isSuccess, isJoining, onSuccess]);

  return {
    joinRaffle,
    isJoining: isJoining || isPending || isConfirming,
    isSuccess,
    hash: txHash,
  };
}
