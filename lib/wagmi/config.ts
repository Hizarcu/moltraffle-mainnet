import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, avalanche, avalancheFuji, base, baseSepolia } from 'wagmi/chains';

// Get WalletConnect project ID from environment
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Wallet connection may not work properly.');
}

// Define chains based on environment
const enableTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true';

export const chains = enableTestnet
  ? [baseSepolia, sepolia, avalancheFuji, base, mainnet, avalanche] as const
  : [base, mainnet, avalanche] as const;

// Create wagmi config
export const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
});
