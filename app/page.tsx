'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Card, Button } from '@/components/ui';
import { ROLES } from '@/lib/constants';
import { useNetworkStats } from '@/hooks';
import { formatEth } from '@/lib/formatters';

export default function HomePage() {
  const { isConnected } = useAccount();
  const { data: stats } = useNetworkStats();

  const roles = Object.values(ROLES);

  const roleIcons: Record<string, React.ReactNode> = {
    'node-operator': (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
        />
      </svg>
    ),
    researcher: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    ),
    crowdfunder: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    investor: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">OARN Network</h1>
                <p className="text-xs text-text-muted">Decentralized AI Compute</p>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text mb-4">
            Welcome to <span className="gradient-text">OARN Dashboard</span>
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Access the decentralized AI compute network. Run nodes, submit tasks, fund research, or
            view network analytics.
          </p>
        </div>

        {/* Connect Wallet CTA */}
        {!isConnected && (
          <Card className="max-w-md mx-auto mb-12 text-center">
            <div className="p-6">
              <svg
                className="w-12 h-12 mx-auto text-primary mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-text mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-text-muted mb-4">
                Connect your wallet to access the OARN network dashboards.
              </p>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button onClick={openConnectModal} size="lg">
                    Connect Wallet
                  </Button>
                )}
              </ConnectButton.Custom>
            </div>
          </Card>
        )}

        {/* Role Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-text text-center mb-6">Select Your Role</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role) => (
              <Link key={role.id} href={role.path}>
                <Card
                  variant="interactive"
                  className={`h-full ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      {roleIcons[role.id]}
                    </div>
                    <h4 className="text-lg font-semibold text-text mb-2">{role.label}</h4>
                    <p className="text-sm text-text-muted">{role.description}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Network Stats Preview */}
        <Card className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text">Network Overview</h3>
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live on Arbitrum Sepolia
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-background-light rounded-lg">
              <p className="text-sm text-text-muted">Total Tasks</p>
              <p className="text-2xl font-bold text-text">{stats?.totalTasks ?? '—'}</p>
            </div>
            <div className="p-4 bg-background-light rounded-lg">
              <p className="text-sm text-text-muted">Active Nodes</p>
              <p className="text-2xl font-bold text-text">{stats?.activeNodes ?? '—'}</p>
            </div>
            <div className="p-4 bg-background-light rounded-lg">
              <p className="text-sm text-text-muted">Completed Tasks</p>
              <p className="text-2xl font-bold text-text">{stats?.completedTasks ?? '—'}</p>
            </div>
            <div className="p-4 bg-background-light rounded-lg">
              <p className="text-sm text-text-muted">Total Value Locked</p>
              <p className="text-2xl font-bold text-text">
                {stats ? `${formatEth(stats.tvl)} ETH` : '—'}
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              OARN Network - Decentralized AI Compute Infrastructure
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://sepolia.arbiscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-muted hover:text-text"
              >
                Arbiscan
              </a>
              <a
                href="#"
                className="text-sm text-text-muted hover:text-text"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-sm text-text-muted hover:text-text"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
