'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';

// Custom chain configuration with our RPC
const customArbitrumSepolia = {
  ...arbitrumSepolia,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
};

export const wagmiConfig = getDefaultConfig({
  appName: 'OARN Dashboard',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [customArbitrumSepolia],
  ssr: true,
});

export { customArbitrumSepolia as arbitrumSepolia };
