import { useReadContract, useChainId } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
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
  const { data: raffleInfo, isLoading: isLoadingInfo, refetch: refetchInfo } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'getRaffleDetails',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  const { data: participants, refetch: refetchParticipants } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'getParticipants',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  const { data: winner, refetch: refetchWinner } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'winner',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  const { data: vrfRequestId, refetch: refetchVrf } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'vrfRequestId',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  const { data: randomResult, refetch: refetchRandom } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'randomResult',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  const { data: prizeDescription } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'prizeDescription',
    query: {
      enabled: !!raffleAddress,
    },
  });

  const { data: winnerIndex, refetch: refetchWinnerIndex } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'winnerIndex',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  // Refetch all mutable data at once
  const refetch = useCallback(() => {
    refetchInfo();
    refetchParticipants();
    refetchWinner();
    refetchVrf();
    refetchRandom();
    refetchWinnerIndex();
  }, [refetchInfo, refetchParticipants, refetchWinner, refetchVrf, refetchRandom, refetchWinnerIndex]);

  // Transform blockchain data to Raffle type
  // getRaffleDetails returns: (title, description, entryFee, deadline, maxParticipants, currentParticipants, status, creator, winner)
  const raffle: Raffle | null = raffleInfo ? (() => {
    const deadlineTimestamp = Number((raffleInfo as any)[3]);
    const deadlineDate = new Date(deadlineTimestamp * 1000);
    const contractStatus = (raffleInfo as any)[6];
    const currentTime = Date.now();
    const hasWinner = winner && winner !== '0x0000000000000000000000000000000000000000';

    // Check contract status - CANCELLED (4) takes priority
    // Otherwise calculate status ourselves as a workaround for buggy contract logic
    let actualStatus: number;
    if (contractStatus === 4) {
      actualStatus = 4; // CANCELLED - prize was claimed or raffle cancelled
    } else if (hasWinner) {
      actualStatus = 2; // DRAWN - winner has been selected
    } else if (deadlineDate.getTime() <= currentTime) {
      actualStatus = 1; // ENDED - deadline passed but no winner yet
    } else {
      actualStatus = 0; // ACTIVE - deadline in future
    }

    const entryFeeWei = (raffleInfo as any)[2] as bigint;
    const entryFeeEth = parseFloat(formatEther(entryFeeWei));
    const participantCount = Number((raffleInfo as any)[5]);
    const prizePoolEth = entryFeeEth * participantCount;

    return {
      id: raffleAddress,
      contractAddress: raffleAddress,
      title: (raffleInfo as any)[0],
      description: (raffleInfo as any)[1],
      prizeDescription: prizeDescription as string || '',
      entryFee: entryFeeWei,
      entryFeeFormatted: `${entryFeeEth} ETH`,
      deadline: deadlineDate,
      maxParticipants: Number((raffleInfo as any)[4]),
      currentParticipants: participantCount,
      creator: (raffleInfo as any)[7],
      status: actualStatus as unknown as RaffleStatus,
      participants: (participants as string[]) || [],
      totalPrizePool: BigInt(Math.floor(prizePoolEth * 1e18)),
      totalPrizePoolFormatted: `${prizePoolEth.toFixed(4)} ETH`,
      prizePool: prizePoolEth, // Keep for backward compatibility
      createdAt: new Date(),
      winner: winner as string | undefined,
      vrfRequestId: vrfRequestId ? String(vrfRequestId) : undefined,
      randomNumber: randomResult ? BigInt(String(randomResult)) : undefined,
      winnerIndex: winnerIndex ? Number(winnerIndex) : undefined,
      chainId: 8453, // Base Mainnet
    };
  })() : null;

  return {
    raffle,
    isLoading: isLoadingInfo,
    refetch,
  };
}
