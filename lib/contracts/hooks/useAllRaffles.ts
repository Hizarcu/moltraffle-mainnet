import { useReadContract, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';
import { getRaffleFactoryAddress } from '../addresses';
import { RaffleFactoryABI } from '../abis/RaffleFactory';
import { RaffleABI } from '../abis/Raffle';
import { Raffle, RaffleStatus } from '@/lib/types/raffle';
import { formatEther } from 'viem';

/**
 * Hook to fetch all raffles from the blockchain
 */
export function useAllRaffles() {
  const chainId = useChainId();
  const factoryAddress = getRaffleFactoryAddress(chainId);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [isLoadingRaffles, setIsLoadingRaffles] = useState(false);

  // Get all raffle addresses
  const { data: raffleAddresses, isLoading: isLoadingAddresses } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RaffleFactoryABI,
    functionName: 'getAllRaffles',
    query: {
      enabled: !!factoryAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Fetch raffle info for each address
  useEffect(() => {
    if (!raffleAddresses || raffleAddresses.length === 0) {
      setRaffles([]);
      setIsLoadingRaffles(false);
      return;
    }

    const fetchRaffleData = async () => {
      setIsLoadingRaffles(true);

      // Note: In production, you'd want to use multicall or batch these requests
      // For now, we'll just show a loading state

      setIsLoadingRaffles(false);
    };

    fetchRaffleData();
  }, [raffleAddresses]);

  return {
    raffleAddresses: (raffleAddresses as `0x${string}`[]) || [],
    raffles,
    isLoading: isLoadingAddresses || isLoadingRaffles,
  };
}

/**
 * Hook to fetch single raffle with all details
 */
export function useRaffleDetails(raffleAddress: string) {
  const { data: raffleInfo, isLoading: isLoadingInfo } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'getRaffleInfo',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  const { data: participants } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'getParticipants',
    query: {
      enabled: !!raffleAddress,
    },
  });

  const { data: winner } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'winner',
    query: {
      enabled: !!raffleAddress,
    },
  });

  const { data: vrfRequestId } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'vrfRequestId',
    query: {
      enabled: !!raffleAddress,
    },
  });

  const { data: randomResult } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'randomResult',
    query: {
      enabled: !!raffleAddress,
    },
  });

  // Transform blockchain data to Raffle type
  const raffle: Raffle | null = raffleInfo ? {
    id: raffleAddress,
    contractAddress: raffleAddress,
    title: (raffleInfo as any)[0],
    description: (raffleInfo as any)[1],
    prizeDescription: (raffleInfo as any)[2],
    entryFee: parseFloat(formatEther((raffleInfo as any)[3])),
    deadline: new Date(Number((raffleInfo as any)[4]) * 1000),
    maxParticipants: Number((raffleInfo as any)[5]),
    currentParticipants: Number((raffleInfo as any)[6]),
    creator: (raffleInfo as any)[7],
    status: (raffleInfo as any)[8] as RaffleStatus,
    participants: (participants as string[]) || [],
    prizePool: parseFloat(formatEther((raffleInfo as any)[3])) * Number((raffleInfo as any)[6]),
    createdAt: new Date(), // Note: This would ideally come from events
    winner: winner as string | undefined,
    vrfRequestId: vrfRequestId ? String(vrfRequestId) : undefined,
    randomNumber: randomResult ? String(randomResult) : undefined,
    winnerIndex: undefined, // Would need to calculate or fetch separately
  } : null;

  return {
    raffle,
    isLoading: isLoadingInfo,
  };
}
