'use client';

import Link from 'next/link';
import { StatCard, StatGrid, TaskList, WalletBalances } from '@/components/dashboard';
import { Button, Card } from '@/components/ui';
import { useMyTasks, useMyBalance } from '@/hooks';
import { TaskStatus } from '@/lib/constants';
import { formatEth } from '@/lib/formatters';

export default function ResearcherDashboard() {
  const { data: tasks = [], isLoading: loadingTasks } = useMyTasks('requester');
  const { data: balance, isLoading: loadingBalance } = useMyBalance();

  // Calculate stats
  const submittedTasks = tasks.length;
  const activeTasks = tasks.filter((t) => t.status === TaskStatus.Active).length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.Completed).length;
  const totalSpent = tasks.reduce(
    (sum, t) => sum + BigInt(t.rewardPerNode) * BigInt(t.requiredNodes),
    BigInt(0)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Researcher Dashboard</h1>
          <p className="text-text-muted mt-1">Submit and track AI inference tasks</p>
        </div>
        <Link href="/researcher/submit">
          <Button
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Submit New Task
          </Button>
        </Link>
      </div>

      {/* Batch Submission Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">Batch Parameter Testing</h3>
              <p className="text-sm text-text-muted mt-1">
                Run 10,000+ parameter combinations in parallel. Perfect for hyperparameter sweeps,
                grid search, and large-scale A/B testing.
              </p>
            </div>
          </div>
          <Link href="/researcher/batch">
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Batch Submit
            </Button>
          </Link>
        </div>
      </Card>

      {/* Stats */}
      <StatGrid>
        <StatCard
          title="Tasks Submitted"
          value={submittedTasks}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
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
          trend={{ value: 25, isPositive: true }}
        />
        <StatCard
          title="Total Spent"
          value={`${formatEth(totalSpent)} ETH`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
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
              <h2 className="text-lg font-semibold text-text">Recent Tasks</h2>
              <Link href="/researcher/tasks" className="text-sm text-primary hover:text-primary-light">
                View All
              </Link>
            </div>
            <TaskList
              tasks={tasks.slice(0, 5)}
              isLoading={loadingTasks}
              emptyMessage="You haven't submitted any tasks yet"
              showFilters={false}
              showActions={false}
              onView={(taskId) => {
                window.location.href = `/researcher/tasks/${taskId}`;
              }}
            />
          </div>
        </div>

        {/* Right Column - Balance & Quick Actions */}
        <div className="space-y-8">
          <WalletBalances balance={balance ?? null} isLoading={loadingBalance} />

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/researcher/submit" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Submit Single Task
                </Button>
              </Link>
              <Link href="/researcher/batch" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  Batch Submit (10K+)
                </Button>
              </Link>
              <Link href="/researcher/tasks" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  View All Tasks
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
