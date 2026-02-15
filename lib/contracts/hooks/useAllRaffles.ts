import { useReadContract, useReadContracts, useChainId } from 'wagmi';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getRaffleFactoryAddress } from '../addresses';
import { RaffleFactoryABI } from '../abis/RaffleFactory';
import { RaffleABI } from '../abis/Raffle';
import { Raffle, RaffleStatus } from '@/lib/types/raffle';
import { formatUnits } from 'viem';

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
      refetchInterval: 8000, // Refetch every 30 seconds
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
      refetchInterval: 8000,
    },
  });

  const { data: participants, refetch: refetchParticipants } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'getParticipants',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 8000,
    },
  });

  const { data: winner, refetch: refetchWinner } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'winner',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 8000,
    },
  });

  const { data: vrfRequestId, refetch: refetchVrf } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'vrfRequestId',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 8000,
    },
  });

  const { data: randomResult, refetch: refetchRandom } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'randomResult',
    query: {
      enabled: !!raffleAddress,
      refetchInterval: 8000,
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
      refetchInterval: 8000,
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
  // getRaffleDetails returns: (title, description, entryFee, deadline, maxParticipants, currentParticipants, status, creator, winner, creatorCommissionBps)
  const raffle: Raffle | null = raffleInfo ? (() => {
    const deadlineTimestamp = Number((raffleInfo as any)[3]);
    const deadlineDate = new Date(deadlineTimestamp * 1000);
    const contractStatus = (raffleInfo as any)[6];
    const currentTime = Date.now();
    const hasWinner = winner && winner !== '0x0000000000000000000000000000000000000000';

    // Check contract status - CANCELLED (4) and CLAIMED (5) take priority
    // Otherwise calculate status ourselves as a workaround for buggy contract logic
    let actualStatus: number;
    if (contractStatus === 4) {
      actualStatus = 4; // CANCELLED
    } else if (contractStatus === 5) {
      actualStatus = 5; // CLAIMED - prize was claimed
    } else if (hasWinner) {
      actualStatus = 2; // DRAWN - winner has been selected
    } else if (deadlineDate.getTime() <= currentTime) {
      actualStatus = 1; // ENDED - deadline passed but no winner yet
    } else {
      actualStatus = 0; // ACTIVE - deadline in future
    }

    const entryFeeRaw = (raffleInfo as any)[2] as bigint;
    const entryFeeUsdc = parseFloat(formatUnits(entryFeeRaw, 6));
    const participantCount = Number((raffleInfo as any)[5]);
    const prizePoolUsdc = entryFeeUsdc * participantCount;
    const commissionBps = Number((raffleInfo as any)[9] || 0);

    return {
      id: raffleAddress,
      contractAddress: raffleAddress,
      title: (raffleInfo as any)[0],
      description: (raffleInfo as any)[1],
      prizeDescription: prizeDescription as string || '',
      entryFee: entryFeeRaw,
      entryFeeFormatted: `$${entryFeeUsdc.toFixed(2)} USDC`,
      deadline: deadlineDate,
      maxParticipants: Number((raffleInfo as any)[4]),
      currentParticipants: participantCount,
      creator: (raffleInfo as any)[7],
      creatorCommissionBps: commissionBps,
      status: actualStatus as unknown as RaffleStatus,
      participants: (participants as string[]) || [],
      totalPrizePool: BigInt(Math.floor(prizePoolUsdc * 1e6)),
      totalPrizePoolFormatted: `$${prizePoolUsdc.toFixed(2)} USDC`,
      prizePool: prizePoolUsdc,
      createdAt: undefined as unknown as Date,
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

/**
 * Sortable raffle data returned by useAllRafflesSortable
 */
export interface SortableRaffleData {
  address: `0x${string}`;
  entryFee: bigint;
  maxParticipants: number;
  currentParticipants: number;
  creatorCommissionBps: number;
  actualStatus: number; // 0=ACTIVE, 1=ENDED, 2=DRAWN, 4=CANCELLED, 5=CLAIMED
  expectedPrizePool: bigint; // in USDC raw units (6 decimals)
}

/**
 * Hook that batch-fetches getRaffleDetails for all raffles via multicall.
 * Provides sortable data so the parent page can filter + sort before rendering cards.
 */
export function useAllRafflesSortable() {
  const chainId = useChainId();
  const factoryAddress = getRaffleFactoryAddress(chainId);

  // Step 1: Get all raffle addresses
  const { data: raffleAddresses, isLoading: isLoadingAddresses } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RaffleFactoryABI,
    functionName: 'getAllRaffles',
    query: {
      enabled: !!factoryAddress,
      refetchInterval: 8000,
    },
  });

  const addresses = useMemo(
    () => (raffleAddresses as `0x${string}`[]) || [],
    [raffleAddresses]
  );

  // Step 2: Batch-fetch getRaffleDetails for all addresses via multicall
  const contracts = useMemo(
    () =>
      addresses.map((addr) => ({
        address: addr,
        abi: RaffleABI,
        functionName: 'getRaffleDetails' as const,
      })),
    [addresses]
  );

  const { data: detailsResults, isLoading: isLoadingDetails } = useReadContracts({
    contracts,
    query: {
      enabled: addresses.length > 0,
      refetchInterval: 8000,
    },
  });

  // Step 3: Transform multicall results into SortableRaffleData[]
  const sortableData: SortableRaffleData[] = useMemo(() => {
    if (!detailsResults || detailsResults.length === 0) return [];

    const currentTime = Date.now();

    return addresses
      .map((addr, i) => {
        const result = detailsResults[i];
        if (!result || result.status !== 'success' || !result.result) return null;

        const data = result.result as readonly [string, string, bigint, bigint, bigint, bigint, number, string, string, bigint];
        const entryFee = data[2];
        const deadlineTimestamp = Number(data[3]);
        const maxParticipants = Number(data[4]);
        const currentParticipants = Number(data[5]);
        const contractStatus = Number(data[6]);
        const winnerAddr = data[8];
        const creatorCommissionBps = Number(data[9]);

        const deadlineMs = deadlineTimestamp * 1000;
        const hasWinner = winnerAddr && winnerAddr !== '0x0000000000000000000000000000000000000000';

        // Mirror status logic from useRaffleDetails
        let actualStatus: number;
        if (contractStatus === 4) {
          actualStatus = 4; // CANCELLED
        } else if (contractStatus === 5) {
          actualStatus = 5; // CLAIMED
        } else if (hasWinner) {
          actualStatus = 2; // DRAWN
        } else if (deadlineMs <= currentTime) {
          actualStatus = 1; // ENDED
        } else {
          actualStatus = 0; // ACTIVE
        }

        // Expected prize pool: entryFee * maxParticipants (or currentParticipants if unlimited)
        const ticketCount = maxParticipants > 0 ? maxParticipants : currentParticipants;
        const expectedPrizePool = entryFee * BigInt(ticketCount);

        return {
          address: addr,
          entryFee,
          maxParticipants,
          currentParticipants,
          creatorCommissionBps,
          actualStatus,
          expectedPrizePool,
        } as SortableRaffleData;
      })
      .filter((item): item is SortableRaffleData => item !== null);
  }, [addresses, detailsResults]);

  return {
    raffleAddresses: addresses,
    sortableData,
    isLoading: isLoadingAddresses || isLoadingDetails,
  };
}
