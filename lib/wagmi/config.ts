import { http } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

// Get WalletConnect project ID from environment
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Wallet connection may not work properly.');
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base];

// Create wagmi adapter for AppKit
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
});

export const config = wagmiAdapter.wagmiConfig;
