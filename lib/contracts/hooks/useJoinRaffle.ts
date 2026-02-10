import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RaffleABI } from '../abis/Raffle';
import toast from 'react-hot-toast';

interface UseJoinRaffleParams {
  raffleAddress: string;
  entryFee: bigint;
  ticketCount: number;
  onSuccess?: () => void;
}

export function useJoinRaffle({ raffleAddress, entryFee, ticketCount, onSuccess }: UseJoinRaffleParams) {
  const [isJoining, setIsJoining] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const joinRaffle = async () => {
    try {
      setIsJoining(true);

      // Show pending toast
      toast.loading('Confirm transaction in your wallet...', { id: 'join-raffle' });

      console.log('=== Calling joinRaffle ===');
      console.log('Raffle Address:', raffleAddress);
      console.log('Ticket Count:', ticketCount);
      console.log('Total Value (Wei):', entryFee.toString());

      // Call contract with ticketCount parameter
      const hash = await writeContractAsync({
        address: raffleAddress as `0x${string}`,
        abi: RaffleABI,
        functionName: 'joinRaffle',
        args: [BigInt(ticketCount)],
        value: entryFee,
      });

      console.log('Transaction hash:', hash);
      setTxHash(hash);
      toast.loading('Transaction pending...', { id: 'join-raffle' });

    } catch (err: any) {
      console.error('Join raffle error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));

      // Extract the most useful error message
      let errorMessage = 'Failed to join raffle';
      if (err.shortMessage) {
        errorMessage = err.shortMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Check for common contract errors
      if (errorMessage.includes('RaffleNotActive')) {
        errorMessage = 'Raffle is not active (contract bug - status shows ENDED)';
      } else if (errorMessage.includes('AlreadyJoined')) {
        errorMessage = 'You have already joined this raffle';
      } else if (errorMessage.includes('RaffleFull')) {
        errorMessage = 'Raffle is full';
      } else if (errorMessage.includes('InsufficientEntryFee')) {
        errorMessage = 'Insufficient entry fee sent';
      } else if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction cancelled by user';
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
