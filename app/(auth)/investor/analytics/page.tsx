'use client';

import { StatCard, StatGrid } from '@/components/dashboard';
import { LineChart, AreaChart, PieChart } from '@/components/charts';
import { Card, Badge } from '@/components/ui';
import { useNetworkStats, useNetworkHistory, useNodeLeaderboard, useModelFrameworks } from '@/hooks';
import { formatEth, formatCompactNumber, formatAddress } from '@/lib/formatters';
import { TaskStatus } from '@/lib/constants';
import type { Task } from '@/providers/OARNClientProvider';

export default function AnalyticsPage() {
  const { data: stats } = useNetworkStats();
  const { data: history = [] } = useNetworkHistory(30);
  const { data: leaderboard = [] } = useNodeLeaderboard();
  const { data: frameworkCounts = {} } = useModelFrameworks();

  // Status distribution from real task data
  const tasksByStatus: Task[] = stats?.tasks ?? [];
  const activeCount = tasksByStatus.filter(
    t => t.status === TaskStatus.Active || t.status === TaskStatus.Consensus
  ).length;
  const pendingCount = tasksByStatus.filter(t => t.status === TaskStatus.Pending).length;

  // Completion rate and avg reward from real data
  const completionRate = stats && stats.totalTasks > 0
    ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) + '%'
    : '—';
  const avgRewardDisplay = stats?.avgReward ? `${formatEth(stats.avgReward)} ETH` : '—';

  // Calculate derived stats
  const avgTasksPerDay = history.length > 0
    ? Math.round(history.reduce((sum, d) => sum + d.tasks, 0) / history.length)
    : 0;

  const avgEarningsPerDay = history.length > 0
    ? (history.reduce((sum, d) => sum + d.earnings, 0) / history.length).toFixed(2)
    : '0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Network Analytics</h1>
        <p className="text-text-muted mt-1">Comprehensive network statistics and metrics</p>
      </div>

      {/* Overview Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Total Tasks"
          value={formatCompactNumber(stats?.totalTasks ?? 0)}
          trend={{ value: 23, isPositive: true }}
        />
        <StatCard
          title="Active Nodes"
          value={stats?.activeNodes ?? 0}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Avg. Tasks/Day"
          value={avgTasksPerDay}
        />
        <StatCard
          title="Avg. Daily Volume"
          value={`${avgEarningsPerDay} ETH`}
        />
      </StatGrid>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AreaChart
          title="Task Volume (30 Days)"
          data={history}
          xKey="date"
          areaKey="tasks"
          color="#6366f1"
          height={350}
        />

        <LineChart
          title="Network Growth"
          data={history}
          xKey="date"
          lines={[
            { key: 'tasks', color: '#6366f1', name: 'Tasks' },
            { key: 'nodes', color: '#22d3ee', name: 'Active Nodes' },
          ]}
          showLegend
          height={350}
        />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PieChart
          title="Task Status Distribution"
          data={[
            { name: 'Completed', value: stats?.completedTasks ?? 0, color: '#22c55e' },
            { name: 'Active', value: activeCount, color: '#22d3ee' },
            { name: 'Pending', value: pendingCount, color: '#f59e0b' },
          ]}
          height={280}
        />

        <PieChart
          title="Model Frameworks"
          data={Object.entries(frameworkCounts).length > 0
            ? Object.entries(frameworkCounts).map(([name, value], i) => ({
                name,
                value,
                color: ['#6366f1', '#ef4444', '#f59e0b', '#22d3ee', '#a855f7'][i % 5],
              }))
            : [{ name: 'No tasks yet', value: 1, color: '#374151' }]
          }
          height={280}
        />

        <AreaChart
          title="Daily Earnings (ETH)"
          data={history}
          xKey="date"
          areaKey="earnings"
          color="#22d3ee"
          gradientFrom="#22d3ee"
          height={280}
        />
      </div>

      {/* Top Nodes Leaderboard */}
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Top Performing Nodes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="pb-3 text-sm font-medium text-text-muted">Rank</th>
                <th className="pb-3 text-sm font-medium text-text-muted">Node Address</th>
                <th className="pb-3 text-sm font-medium text-text-muted">Tasks Completed</th>
                <th className="pb-3 text-sm font-medium text-text-muted">Total Earnings</th>
                <th className="pb-3 text-sm font-medium text-text-muted">Success Rate</th>
                <th className="pb-3 text-sm font-medium text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.slice(0, 10).map((node, index) => (
                <tr key={node.address} className="hover:bg-surface/50">
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index < 3
                          ? 'bg-gradient-primary text-white'
                          : 'bg-surface text-text-muted'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="font-mono text-sm text-text">
                      {formatAddress(node.address, 8, 6)}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-text">
                    {node.tasksCompleted}
                  </td>
                  <td className="py-3 text-sm text-text">
                    {formatEth(node.totalEarnings)} ETH
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-success">
                      {node.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge variant="success" size="sm">Active</Badge>
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-text-muted">
                    No reward events found on-chain yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-sm text-text-muted">Completion Rate</p>
          <p className="text-2xl font-bold text-success mt-1">{completionRate}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-text-muted">Avg. Time to Consensus</p>
          <p className="text-2xl font-bold text-text mt-1">
            {stats?.avgConsensusTimeMin != null ? `${stats.avgConsensusTimeMin} min` : '—'}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-text-muted">Avg. Reward per Task</p>
          <p className="text-2xl font-bold text-text mt-1">{avgRewardDisplay}</p>
        </Card>
      </div>
    </div>
  );
}
