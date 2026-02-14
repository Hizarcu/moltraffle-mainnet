import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { USDCABI } from '../abis/USDC';
import { getUSDCAddress, getRaffleFactoryAddress } from '../addresses';

const MAX_UINT256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

interface UseUSDCApprovalParams {
  requiredAmount: bigint;
}

export function useUSDCApproval({ requiredAmount }: UseUSDCApprovalParams) {
  const { address } = useAccount();
  const chainId = useChainId();
  const usdcAddress = getUSDCAddress(chainId);
  const factoryAddress = getRaffleFactoryAddress(chainId);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: USDCABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, factoryAddress as `0x${string}`],
    query: {
      enabled: !!address && !!usdcAddress && !!factoryAddress,
      refetchInterval: 10000,
    },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('USDC approved!', { id: 'usdc-approve' });
      refetchAllowance();
    }
  }, [isSuccess, refetchAllowance]);

  const approve = () => {
    if (!usdcAddress || !factoryAddress) return;

    toast.loading('Approve USDC in your wallet...', { id: 'usdc-approve' });

    writeContract({
      address: usdcAddress as `0x${string}`,
      abi: USDCABI,
      functionName: 'approve',
      args: [factoryAddress as `0x${string}`, MAX_UINT256],
    });
  };

  const currentAllowance = (allowance as bigint) ?? BigInt(0);
  const needsApproval = currentAllowance < requiredAmount;

  return {
    needsApproval,
    approve,
    isApproving: isPending || isConfirming,
    allowance: currentAllowance,
    refetchAllowance,
  };
}
