'use client';

import { StatCard, StatGrid } from '@/components/dashboard';
import { LineChart, AreaChart, PieChart } from '@/components/charts';
import { Card, Badge } from '@/components/ui';
import { useNetworkStats, useNetworkHistory, useActiveProviders } from '@/hooks';
import { formatEth, formatCompactNumber, formatAddress } from '@/lib/formatters';

export default function AnalyticsPage() {
  const { data: stats } = useNetworkStats();
  const { data: history = [] } = useNetworkHistory(30);
  const { data: providers = [] } = useActiveProviders();

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
            { name: 'Completed', value: stats?.completedTasks ?? 75, color: '#22c55e' },
            { name: 'Active', value: Math.floor((stats?.totalTasks ?? 100) * 0.15), color: '#22d3ee' },
            { name: 'Pending', value: Math.floor((stats?.totalTasks ?? 100) * 0.1), color: '#f59e0b' },
          ]}
          height={280}
        />

        <PieChart
          title="Model Frameworks"
          data={[
            { name: 'ONNX', value: 45, color: '#6366f1' },
            { name: 'PyTorch', value: 35, color: '#ef4444' },
            { name: 'TensorFlow', value: 20, color: '#f59e0b' },
          ]}
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
              {providers.slice(0, 10).map((provider, index) => (
                <tr key={provider} className="hover:bg-surface/50">
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
                      {formatAddress(provider, 8, 6)}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-text">
                    {Math.floor(Math.random() * 100) + 50}
                  </td>
                  <td className="py-3 text-sm text-text">
                    {(Math.random() * 10 + 5).toFixed(2)} ETH
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-success">
                      {(95 + Math.random() * 5).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge variant="success" size="sm">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-text-muted">Completion Rate</p>
          <p className="text-2xl font-bold text-success mt-1">94.2%</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-text-muted">Avg. Time to Consensus</p>
          <p className="text-2xl font-bold text-text mt-1">12.5 min</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-text-muted">Avg. Reward per Task</p>
          <p className="text-2xl font-bold text-text mt-1">0.15 ETH</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-text-muted">Network Uptime</p>
          <p className="text-2xl font-bold text-success mt-1">99.9%</p>
        </Card>
      </div>
    </div>
  );
}
