import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { RaffleFactoryABI } from '../abis/RaffleFactory';
import { getRaffleFactoryAddress } from '../addresses';
import { calculateCreationFeeWei } from './useCreationFee';

interface CreateRaffleParams {
  title: string;
  description: string;
  prizeDescription: string;
  entryFee: string; // in ETH
  deadline: Date;
  maxParticipants: string; // empty string = unlimited (0)
  chainId: number;
}

interface UseCreateRaffleOptions {
  onSuccess?: (raffleAddress: string) => void;
  onError?: (error: Error) => void;
}

export function useCreateRaffle(options?: UseCreateRaffleOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle success
  useEffect(() => {
    if (isSuccess && receipt) {
      toast.success('Raffle created successfully!', { id: 'create-raffle' });

      // Extract raffle address from logs (RaffleCreated event)
      const raffleCreatedEvent = receipt.logs.find((log) => log.topics[0]);
      if (raffleCreatedEvent && raffleCreatedEvent.topics[1]) {
        // The raffle address is the first indexed parameter (topics[1])
        const raffleAddress = `0x${raffleCreatedEvent.topics[1].slice(26)}`;
        options?.onSuccess?.(raffleAddress);
      }
    }
  }, [isSuccess, receipt, options]);

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
      const networkName = params.chainId === 11155111 ? 'Sepolia' :
                         params.chainId === 1 ? 'Mainnet' :
                         params.chainId === 43114 ? 'Avalanche' :
                         params.chainId === 43113 ? 'Avalanche Fuji' :
                         params.chainId === 84532 ? 'Base Sepolia' :
                         `Unknown (${params.chainId})`;
      toast.error(`RaffleFactory not deployed on ${networkName}. Please switch to Base Sepolia testnet.`);
      return;
    }

    toast.loading('Confirm transaction in your wallet...', { id: 'create-raffle' });

    const deadlineTimestamp = BigInt(Math.floor(params.deadline.getTime() / 1000));
    const maxParticipants = params.maxParticipants === '' ? BigInt(0) : BigInt(params.maxParticipants);

    // Calculate creation fee
    const creationFee = calculateCreationFeeWei(params.entryFee, params.maxParticipants);

    try {
      writeContract({
        address: factoryAddress as `0x${string}`,
        abi: RaffleFactoryABI,
        functionName: 'createRaffle',
        args: [
          params.title,
          params.description,
          params.prizeDescription,
          parseEther(params.entryFee),
          deadlineTimestamp,
          maxParticipants,
        ],
        value: creationFee,
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
