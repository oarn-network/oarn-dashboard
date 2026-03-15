'use client';

import { useAccount } from 'wagmi';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';

type Role = 'node-operator' | 'researcher' | 'crowdfunder' | 'investor';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  // Extract role from pathname
  const pathParts = pathname.split('/').filter(Boolean);
  const role = pathParts[0] as Role;

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push('/');
    }
  }, [isConnected, isConnecting, router]);

  // Show loading while checking connection
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-8 h-8 animate-spin mx-auto text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-text-muted">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar role={role} />
      <MobileNav role={role} />

      {/* Main content */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
