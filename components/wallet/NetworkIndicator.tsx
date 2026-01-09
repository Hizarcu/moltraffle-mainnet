'use client';

import { useChainId, useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { Badge } from '../ui/Badge';

export function NetworkIndicator() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return null;
  }

  const getNetworkInfo = () => {
    switch (chainId) {
      case 1:
        return { name: 'Ethereum', color: 'default' as const, supported: false };
      case 11155111:
        return { name: 'Sepolia', color: 'success' as const, supported: true };
      case 43114:
        return { name: 'Avalanche', color: 'default' as const, supported: false };
      case 43113:
        return { name: 'Fuji', color: 'warning' as const, supported: true };
      default:
        return { name: `Chain ${chainId}`, color: 'default' as const, supported: false };
    }
  };

  const network = getNetworkInfo();

  const handleSwitchToSepolia = () => {
    if (switchChain) {
      switchChain({ chainId: sepolia.id });
    }
  };

  if (!network.supported) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="error">{network.name}</Badge>
        <button
          onClick={handleSwitchToSepolia}
          className="text-xs px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
        >
          Switch to Sepolia
        </button>
      </div>
    );
  }

  return <Badge variant={network.color}>{network.name}</Badge>;
}
