'use client';

import Link from 'next/link';
import { StatCard, StatGrid, TaskList, WalletBalances } from '@/components/dashboard';
import { Button, Card } from '@/components/ui';
import { usePendingTasks, useMyBalance } from '@/hooks';
import { formatEth } from '@/lib/formatters';

export default function CrowdfunderDashboard() {
  const { data: tasks = [], isLoading: loadingTasks } = usePendingTasks();
  const { data: balance, isLoading: loadingBalance } = useMyBalance();

  // Mock stats
  const tasksFunded = 8;
  const totalContributed = BigInt('2500000000000000000'); // 2.5 ETH
  const tasksCompleted = 5;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Crowdfunder Dashboard</h1>
          <p className="text-text-muted mt-1">Fund research tasks and support AI compute</p>
        </div>
        <Link href="/crowdfunder/browse">
          <Button
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          >
            Browse Tasks
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatGrid>
        <StatCard
          title="Tasks Funded"
          value={tasksFunded}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Contributed"
          value={`${formatEth(totalContributed)} ETH`}
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
          trend={{ value: 18, isPositive: true }}
        />
        <StatCard
          title="Tasks Completed"
          value={tasksCompleted}
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
          title="Available to Fund"
          value={tasks.length}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />
      </StatGrid>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Tasks */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Tasks Available for Funding</h2>
              <Link href="/crowdfunder/browse" className="text-sm text-primary hover:text-primary-light">
                View All
              </Link>
            </div>
            <TaskList
              tasks={tasks.slice(0, 5)}
              isLoading={loadingTasks}
              emptyMessage="No tasks available for funding"
              showFilters={false}
              onFund={(taskId) => {
                // Handle fund action
              }}
            />
          </div>
        </div>

        {/* Right Column - Balance & Quick Actions */}
        <div className="space-y-8">
          <WalletBalances balance={balance ?? null} isLoading={loadingBalance} />

          {/* Impact Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Your Impact</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="font-medium text-text">AI Tasks Powered</span>
                </div>
                <p className="text-2xl font-bold text-text">{tasksCompleted}</p>
                <p className="text-sm text-text-muted">Tasks completed with your funding</p>
              </div>

              <div className="p-4 bg-success/10 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium text-text">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-success">100%</p>
                <p className="text-sm text-text-muted">Of funded tasks completed</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
