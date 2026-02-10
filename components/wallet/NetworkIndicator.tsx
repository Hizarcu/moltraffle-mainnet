'use client';

import { useChainId, useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { Badge } from '../ui/Badge';

export function NetworkIndicator() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return null;
  }

  const isBase = chainId === base.id;

  const handleSwitchToBase = () => {
    if (switchChain) {
      switchChain({ chainId: base.id });
    }
  };

  if (!isBase) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="error">Wrong Network</Badge>
        <button
          onClick={handleSwitchToBase}
          className="text-xs px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
        >
          Switch to Base
        </button>
      </div>
    );
  }

  return <Badge variant="success">Base</Badge>;
}
