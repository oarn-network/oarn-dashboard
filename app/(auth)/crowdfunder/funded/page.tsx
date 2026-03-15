'use client';

import { Card, Badge } from '@/components/ui';
import { formatEth, formatAddress, formatRelativeTime } from '@/lib/formatters';

// Mock funded tasks data
const fundedTasks = [
  {
    taskId: 1,
    amount: '0.5',
    date: Math.floor(Date.now() / 1000) - 86400 * 2,
    status: 'completed',
    totalFunding: '1.5',
    requiredFunding: '1.5',
  },
  {
    taskId: 2,
    amount: '0.2',
    date: Math.floor(Date.now() / 1000) - 86400,
    status: 'active',
    totalFunding: '0.8',
    requiredFunding: '1.0',
  },
  {
    taskId: 3,
    amount: '1.0',
    date: Math.floor(Date.now() / 1000) - 3600,
    status: 'pending',
    totalFunding: '1.0',
    requiredFunding: '1.5',
  },
];

export default function FundedTasksPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">My Funded Tasks</h1>
        <p className="text-text-muted mt-1">Track the tasks you have contributed to</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-text-muted">Total Contributed</p>
          <p className="text-2xl font-bold text-text mt-1">
            {fundedTasks.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)} ETH
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">Tasks Funded</p>
          <p className="text-2xl font-bold text-text mt-1">{fundedTasks.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">Completed Tasks</p>
          <p className="text-2xl font-bold text-success mt-1">
            {fundedTasks.filter((t) => t.status === 'completed').length}
          </p>
        </Card>
      </div>

      {/* Funded Tasks List */}
      <div className="space-y-4">
        {fundedTasks.map((task) => (
          <Card key={task.taskId}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  #{task.taskId}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">Task #{task.taskId}</span>
                    <Badge
                      variant={
                        task.status === 'completed'
                          ? 'success'
                          : task.status === 'active'
                          ? 'accent'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-muted">
                    Contributed {formatRelativeTime(task.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Funding Progress */}
                <div className="text-right">
                  <p className="text-sm text-text-muted">Funding Progress</p>
                  <p className="text-sm font-medium text-text">
                    {task.totalFunding} / {task.requiredFunding} ETH
                  </p>
                  <div className="w-24 h-1.5 bg-background-light rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${
                        parseFloat(task.totalFunding) >= parseFloat(task.requiredFunding)
                          ? 'bg-success'
                          : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          (parseFloat(task.totalFunding) / parseFloat(task.requiredFunding)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Your Contribution */}
                <div className="text-right">
                  <p className="text-sm text-text-muted">Your Contribution</p>
                  <p className="text-lg font-bold gradient-text">{task.amount} ETH</p>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {fundedTasks.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-text-muted mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-text-muted">You haven't funded any tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
