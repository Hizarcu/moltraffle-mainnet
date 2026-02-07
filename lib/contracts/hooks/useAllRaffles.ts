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
    functionName: 'getRaffleDetails',
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

  const { data: prizeDescription } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'prizeDescription',
    query: {
      enabled: !!raffleAddress,
    },
  });

  const { data: winnerIndex } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'winnerIndex',
    query: {
      enabled: !!raffleAddress,
    },
  });

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

    console.log('=== Raffle Data Debug ===');
    console.log('Raffle Address:', raffleAddress);
    console.log('Deadline (Unix seconds):', deadlineTimestamp);
    console.log('Deadline (Date):', deadlineDate.toISOString());
    console.log('Current Time:', new Date(currentTime).toISOString());
    console.log('Time until deadline (ms):', deadlineDate.getTime() - currentTime);
    console.log('Status from contract:', contractStatus);
    console.log('Calculated status:', actualStatus, actualStatus === 0 ? '(ACTIVE)' : actualStatus === 1 ? '(ENDED)' : '(DRAWN)');
    console.log('Has winner:', hasWinner);
    console.log('========================');

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
      chainId: 84532, // Base Sepolia
    };
  })() : null;

  return {
    raffle,
    isLoading: isLoadingInfo,
  };
}
