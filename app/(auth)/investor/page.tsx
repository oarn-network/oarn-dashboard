'use client';

import Link from 'next/link';
import { StatCard, StatGrid, WalletBalances } from '@/components/dashboard';
import { LineChart, PieChart } from '@/components/charts';
import { Card, Button } from '@/components/ui';
import { useNetworkStats, useNetworkHistory, useMyBalance, useTokenMetrics } from '@/hooks';
import { useGovernanceProposals, type GovernanceProposal } from '@/hooks/useGovernance';
import { formatUnits } from 'viem';
import { ProposalState, PROPOSAL_STATE_LABELS, TaskStatus, TASK_STATUS_LABELS } from '@/lib/constants';
import { formatEth, formatCompactNumber } from '@/lib/formatters';
import { BuyGOVPanel } from '@/components/investor/BuyGOVPanel';

export default function InvestorDashboard() {
  const { data: stats, isLoading: loadingStats } = useNetworkStats();
  const { data: history = [] } = useNetworkHistory(30);
  const { data: balance, isLoading: loadingBalance } = useMyBalance();
  const { data: tokenMetrics } = useTokenMetrics();
  const { data: proposals = [] } = useGovernanceProposals();

  const taskList = stats?.tasks ?? [];

  const STATUS_PIE_COLORS: Partial<Record<TaskStatus, string>> = {
    [TaskStatus.Pending]:   '#f59e0b',
    [TaskStatus.Active]:    '#22d3ee',
    [TaskStatus.Consensus]: '#6366f1',
    [TaskStatus.Completed]: '#22c55e',
    [TaskStatus.Disputed]:  '#ef4444',
    [TaskStatus.Cancelled]: '#6b7280',
    [TaskStatus.Expired]:   '#9ca3af',
  };

  const taskPieData = (Object.values(TaskStatus).filter((v): v is TaskStatus => typeof v === 'number') as TaskStatus[])
    .map(status => ({
      name: TASK_STATUS_LABELS[status],
      value: taskList.filter(t => t.status === status).length,
      color: STATUS_PIE_COLORS[status] ?? '#6b7280',
    }))
    .filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Investor Dashboard</h1>
          <p className="text-text-muted mt-1">Network analytics and governance</p>
        </div>
        <Link href="/investor/analytics">
          <Button
            variant="secondary"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          >
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Network Stats */}
      <StatGrid>
        <StatCard
          title="Total Tasks"
          value={formatCompactNumber(stats?.totalTasks ?? 0)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          trend={{ value: 23, isPositive: true }}
        />
        <StatCard
          title="Active Nodes"
          value={stats?.activeNodes ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
              />
            </svg>
          }
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Completed Tasks"
          value={formatCompactNumber(stats?.completedTasks ?? 0)}
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
          title="Total Value Locked"
          value={`${formatEth(stats?.tvl ?? BigInt(0))} ETH`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          }
          trend={{ value: 8, isPositive: true }}
        />
      </StatGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LineChart
          title="Network Activity (30 Days)"
          data={history}
          xKey="date"
          lines={[
            { key: 'tasks', color: '#6366f1', name: 'Tasks' },
            { key: 'nodes', color: '#22d3ee', name: 'Nodes' },
          ]}
          showLegend
          height={300}
        />

        <PieChart
          title="Task Distribution"
          data={taskPieData.length > 0 ? taskPieData : [{ name: 'No tasks yet', value: 1, color: '#374151' }]}
          height={300}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <BuyGOVPanel />
        <WalletBalances balance={balance ?? null} isLoading={loadingBalance} />

        {/* Token Metrics */}
        <Card>
          <h3 className="text-lg font-semibold text-text mb-4">Token Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-background-light rounded-lg">
              <div>
                <p className="text-sm font-medium text-text">COMP Supply</p>
                <p className="text-xs text-text-muted">Total minted</p>
              </div>
              <p className="text-lg font-bold text-text">
                {tokenMetrics
                  ? formatCompactNumber(Math.round(Number(formatUnits(tokenMetrics.compSupply, 18))))
                  : '—'}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-background-light rounded-lg">
              <div>
                <p className="text-sm font-medium text-text">GOV Supply</p>
                <p className="text-xs text-text-muted">Total minted</p>
              </div>
              <p className="text-lg font-bold text-text">
                {tokenMetrics
                  ? formatCompactNumber(Math.round(Number(formatUnits(tokenMetrics.govSupply, 18))))
                  : '—'}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-background-light rounded-lg">
              <div>
                <p className="text-sm font-medium text-text">GOV Holders</p>
                <p className="text-xs text-text-muted">Unique addresses</p>
              </div>
              <p className="text-lg font-bold text-text">
                {tokenMetrics ? tokenMetrics.govHolders : '—'}
              </p>
            </div>
          </div>
        </Card>

        {/* Active Proposals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">Active Proposals</h3>
            <Link href="/investor/governance" className="text-sm text-primary hover:text-primary-light">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {proposals.filter(p => p.state === ProposalState.Active).slice(0, 3).map((p: GovernanceProposal) => (
              <div key={p.id} className="p-3 bg-background-light rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text truncate pr-2">{p.title || `Proposal #${p.id.slice(0, 6)}`}</span>
                  <span className="text-xs text-accent shrink-0">{PROPOSAL_STATE_LABELS[p.state]}</span>
                </div>
                {p.description && (
                  <p className="text-xs text-text-muted line-clamp-1">{p.description}</p>
                )}
                <div className="mt-2 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${p.forPercent}%` }} />
                </div>
                <p className="text-xs text-text-muted mt-1">{p.forPercent}% in favor</p>
              </div>
            ))}
            {proposals.filter(p => p.state === ProposalState.Active).length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">No active proposals</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
