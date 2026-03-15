'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { type ReactNode } from 'react';
import { wagmiConfig } from '@/lib/wagmi-config';
import { QueryProvider } from './QueryProvider';

const customTheme = darkTheme({
  accentColor: '#6366f1',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Override theme colors to match OARN design
customTheme.colors.modalBackground = '#252136';
customTheme.colors.modalBorder = '#334155';
customTheme.colors.modalText = '#f8fafc';
customTheme.colors.modalTextSecondary = '#94a3b8';
customTheme.colors.connectButtonBackground = '#252136';
customTheme.colors.connectButtonInnerBackground = '#1a1625';
customTheme.colors.connectButtonText = '#f8fafc';

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryProvider>
        <RainbowKitProvider theme={customTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryProvider>
    </WagmiProvider>
  );
}
