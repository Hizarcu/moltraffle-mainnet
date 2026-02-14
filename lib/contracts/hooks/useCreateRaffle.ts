import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { RaffleFactoryABI } from '../abis/RaffleFactory';
import { getRaffleFactoryAddress } from '../addresses';

interface CreateRaffleParams {
  title: string;
  description: string;
  prizeDescription: string;
  entryFee: string; // in USDC (e.g. "1.00")
  deadline: Date;
  maxParticipants: string; // empty string = unlimited (0)
  creatorCommission: string; // "0"-"10" (percent)
  chainId: number;
}

interface UseCreateRaffleOptions {
  onSuccess?: (raffleAddress: string) => void;
  onError?: (error: Error) => void;
}

export function useCreateRaffle(options?: UseCreateRaffleOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const chainId = useChainId();
  const factoryAddr = getRaffleFactoryAddress(chainId)?.toLowerCase();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle success
  useEffect(() => {
    if (isSuccess && receipt) {
      toast.success('Raffle created successfully!', { id: 'create-raffle' });

      // Extract raffle address from RaffleCreated event (emitted by Factory, not USDC)
      const raffleCreatedEvent = receipt.logs.find(
        (log) => log.address.toLowerCase() === factoryAddr && log.topics.length >= 2
      );
      if (raffleCreatedEvent && raffleCreatedEvent.topics[1]) {
        // The raffle address is the first indexed parameter (topics[1])
        const raffleAddress = `0x${raffleCreatedEvent.topics[1].slice(26)}`;
        options?.onSuccess?.(raffleAddress);
      }
    }
  }, [isSuccess, receipt, options, factoryAddr]);

  // Handle error
  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Failed to create raffle', { id: 'create-raffle' });
      options?.onError?.(error as Error);
    }
  }, [error, options]);

  // Handle confirming state
  useEffect(() => {
    if (isConfirming) {
      toast.loading('Creating raffle...', { id: 'create-raffle' });
    }
  }, [isConfirming]);

  const createRaffle = async (params: CreateRaffleParams) => {
    const factoryAddress = getRaffleFactoryAddress(params.chainId);

    if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
      const networkName = params.chainId === 8453 ? 'Base' : `Unknown (${params.chainId})`;
      toast.error(`RaffleFactory not deployed on ${networkName}. Please switch to Base.`);
      return;
    }

    toast.loading('Confirm transaction in your wallet...', { id: 'create-raffle' });

    const deadlineTimestamp = BigInt(Math.floor(params.deadline.getTime() / 1000));
    const maxParticipants = params.maxParticipants === '' ? BigInt(0) : BigInt(params.maxParticipants);
    const creatorCommissionBps = BigInt(Number(params.creatorCommission) * 100);

    try {
      writeContract({
        address: factoryAddress as `0x${string}`,
        abi: RaffleFactoryABI,
        functionName: 'createRaffle',
        args: [
          params.title,
          params.description,
          params.prizeDescription,
          parseUnits(params.entryFee, 6),
          deadlineTimestamp,
          maxParticipants,
          creatorCommissionBps,
        ],
      });
    } catch (err) {
      console.error('Error creating raffle:', err);
      toast.error('Failed to create raffle');
    }
  };

  return {
    createRaffle,
    isCreating: isPending || isConfirming,
    hash,
    isSuccess,
  };
}
