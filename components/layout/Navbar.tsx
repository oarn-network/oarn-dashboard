'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
  const pathname = usePathname();

  // Extract current role from pathname
  const currentRole = pathname.split('/')[1] || '';
  const roleLabels: Record<string, string> = {
    'node-operator': 'Node Operator',
    researcher: 'Researcher',
    crowdfunder: 'Crowdfunder',
    investor: 'Investor',
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-bold gradient-text">OARN</span>
          </Link>

          {/* Center - Current role indicator */}
          {roleLabels[currentRole] && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-text-muted text-sm">Dashboard:</span>
              <span className="text-text font-medium">{roleLabels[currentRole]}</span>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Network indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-text-muted">Arbitrum Sepolia</span>
            </div>

            {/* Wallet Connect */}
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
