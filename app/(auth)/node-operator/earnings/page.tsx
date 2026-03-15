'use client';

import { StatCard, StatGrid, WalletBalances } from '@/components/dashboard';
import { LineChart, AreaChart } from '@/components/charts';
import { Card } from '@/components/ui';
import { useMyBalance, useEarningsHistory } from '@/hooks';
import { formatEth, formatTokens } from '@/lib/formatters';

export default function NodeOperatorEarningsPage() {
  const { data: balance, isLoading: loadingBalance } = useMyBalance();
  const { data: earningsHistory = [] } = useEarningsHistory(30);

  // Calculate totals from history
  const totalEarnings = earningsHistory.reduce((sum, d) => sum + d.earnings, 0);
  const totalTasks = earningsHistory.reduce((sum, d) => sum + d.tasks, 0);
  const avgEarningsPerTask = totalTasks > 0 ? totalEarnings / totalTasks : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Earnings</h1>
        <p className="text-text-muted mt-1">Track your earnings and rewards history</p>
      </div>

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Total Earnings (30d)"
          value={`${totalEarnings.toFixed(4)} ETH`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Tasks Completed (30d)"
          value={totalTasks}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Avg. Earnings/Task"
          value={`${avgEarningsPerTask.toFixed(4)} ETH`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
        <StatCard
          title="COMP Balance"
          value={formatTokens(balance?.comp ?? BigInt(0))}
          icon={
            <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
              C
            </div>
          }
        />
      </StatGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AreaChart
          title="Earnings Over Time"
          data={earningsHistory}
          xKey="date"
          areaKey="earnings"
          color="#22d3ee"
          gradientFrom="#22d3ee"
          height={300}
        />

        <LineChart
          title="Tasks Completed"
          data={earningsHistory}
          xKey="date"
          lines={[{ key: 'tasks', color: '#6366f1', name: 'Tasks' }]}
          height={300}
        />
      </div>

      {/* Wallet Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <WalletBalances balance={balance ?? null} isLoading={loadingBalance} />

        {/* Recent Payouts */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-text mb-4">Recent Payouts</h3>
          <div className="space-y-3">
            {earningsHistory
              .filter((d) => d.earnings > 0)
              .slice(-5)
              .reverse()
              .map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-background-light rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-text">{entry.tasks} task(s) completed</p>
                    <p className="text-xs text-text-muted">{entry.date}</p>
                  </div>
                  <p className="text-lg font-semibold text-success">+{entry.earnings.toFixed(4)} ETH</p>
                </div>
              ))}
            {earningsHistory.filter((d) => d.earnings > 0).length === 0 && (
              <p className="text-center text-text-muted py-8">No payouts yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
