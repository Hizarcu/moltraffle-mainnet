import { useReadContract, useAccount } from 'wagmi';
import { RaffleABI } from '../abis/Raffle';

interface UseRaffleDataParams {
  raffleAddress: string;
  enabled?: boolean;
}

/**
 * Hook to read raffle data from blockchain
 * For now, this returns undefined since we don't have deployed contracts
 * When you deploy contracts, this will fetch live data
 */
export function useRaffleData({ raffleAddress, enabled = true }: UseRaffleDataParams) {
  const { address: userAddress } = useAccount();

  // Read raffle info
  const { data: raffleInfo, isLoading: isLoadingInfo } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'getRaffleInfo',
    query: {
      enabled: enabled && !!raffleAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Read participants
  const { data: participants, isLoading: isLoadingParticipants } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'getParticipants',
    query: {
      enabled: enabled && !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  // Check if user has joined
  const { data: hasJoined, isLoading: isLoadingHasJoined } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'hasJoined',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: enabled && !!raffleAddress && !!userAddress,
      refetchInterval: 30000,
    },
  });

  // Read winner (if drawn)
  const { data: winner } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'winner',
    query: {
      enabled: enabled && !!raffleAddress,
      refetchInterval: 30000,
    },
  });

  // Read VRF data
  const { data: vrfRequestId } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'vrfRequestId',
    query: {
      enabled: enabled && !!raffleAddress,
    },
  });

  const { data: randomResult } = useReadContract({
    address: raffleAddress as `0x${string}`,
    abi: RaffleABI,
    functionName: 'randomResult',
    query: {
      enabled: enabled && !!raffleAddress,
    },
  });

  return {
    raffleInfo,
    participants,
    hasJoined: hasJoined || false,
    winner,
    vrfRequestId,
    randomResult,
    isLoading: isLoadingInfo || isLoadingParticipants || isLoadingHasJoined,
  };
}
