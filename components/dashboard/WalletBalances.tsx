'use client';

import { Card } from '@/components/ui';
import { formatEth, formatTokens } from '@/lib/formatters';
import type { Balance } from '@/providers/OARNClientProvider';

interface WalletBalancesProps {
  balance: Balance | null;
  isLoading?: boolean;
}

export function WalletBalances({ balance, isLoading = false }: WalletBalancesProps) {
  if (isLoading) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Wallet Balances</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-background-light rounded-lg">
              <div className="h-5 w-16 bg-surface rounded animate-pulse" />
              <div className="h-6 w-24 bg-surface rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Wallet Balances</h3>
        <p className="text-text-muted text-center py-4">Connect wallet to view balances</p>
      </Card>
    );
  }

  const tokens = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: balance.eth,
      formatter: formatEth,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1.75l-6.25 10.5L12 16l6.25-3.75L12 1.75zM5.75 13.5L12 22.25l6.25-8.75L12 17.25 5.75 13.5z" />
        </svg>
      ),
      color: 'text-primary-light',
    },
    {
      symbol: 'COMP',
      name: 'Compute Token',
      balance: balance.comp,
      formatter: formatTokens,
      icon: (
        <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
          C
        </div>
      ),
      color: 'text-accent',
    },
    {
      symbol: 'GOV',
      name: 'Governance Token',
      balance: balance.gov,
      formatter: formatTokens,
      icon: (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
          G
        </div>
      ),
      color: 'text-primary',
    },
  ];

  return (
    <Card>
      <h3 className="text-lg font-semibold text-text mb-4">Wallet Balances</h3>
      <div className="space-y-3">
        {tokens.map((token) => (
          <div
            key={token.symbol}
            className="flex items-center justify-between p-3 bg-background-light rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={token.color}>{token.icon}</div>
              <div>
                <p className="text-sm font-medium text-text">{token.symbol}</p>
                <p className="text-xs text-text-muted">{token.name}</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-text">
              {token.formatter(token.balance)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
