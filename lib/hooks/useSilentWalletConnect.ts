import { useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { useAgent } from '@/lib/contexts/AgentContext';

export function useSilentWalletConnect() {
  const { isAuthenticated } = useAgent();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // If agent authenticated but wallet not connected, auto-connect
    if (isAuthenticated && !isConnected) {
      const injectedConnector = connectors.find(c => c.id === 'injected');
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    }
  }, [isAuthenticated, isConnected, connect, connectors]);
}
