import { useReadContract, useAccount } from 'wagmi';
import { RaffleFactoryABI } from '../abis/RaffleFactory';
import { getRaffleFactoryAddress } from '../addresses';
import { useChainId } from 'wagmi';

export function useUserRaffles() {
  const { address } = useAccount();
  const chainId = useChainId();
  const factoryAddress = getRaffleFactoryAddress(chainId);

  // Get raffles created by user
  const { data: createdRaffles, isLoading: isLoadingCreated } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RaffleFactoryABI,
    functionName: 'getRafflesByCreator',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!factoryAddress,
    },
  });

  // Get total raffle count to fetch all raffles
  const { data: totalRaffles } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RaffleFactoryABI,
    functionName: 'getRaffleCount',
    query: {
      enabled: !!factoryAddress,
    },
  });

  // Get all raffles (we'll filter for participated ones on client side)
  const { data: allRaffles, isLoading: isLoadingAll } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RaffleFactoryABI,
    functionName: 'getAllRaffles',
    query: {
      enabled: !!factoryAddress && !!totalRaffles,
    },
  });

  const isLoading = isLoadingCreated || isLoadingAll;

  return {
    createdRaffles: (createdRaffles as `0x${string}`[]) || [],
    allRaffles: (allRaffles as `0x${string}`[]) || [],
    totalRaffles: totalRaffles ? Number(totalRaffles) : 0,
    isLoading,
  };
}
