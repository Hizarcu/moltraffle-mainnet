'use client';

import { ReactNode, useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, projectId } from '@/lib/wagmi/config';

// Setup queryClient for wagmi
const queryClient = new QueryClient();

// Track if modal has been created
let modalCreated = false;

export function Web3Provider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Create modal only once on client side
    if (!modalCreated && projectId) {
      createWeb3Modal({
        wagmiConfig: config,
        projectId,
        enableAnalytics: true,
        enableOnramp: true,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#7B3FF2',
          '--w3m-border-radius-master': '16px',
        },
      });
      modalCreated = true;
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
