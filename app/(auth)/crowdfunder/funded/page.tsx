'use client';

import { Card, Badge } from '@/components/ui';
import { formatEth, formatRelativeTime } from '@/lib/formatters';
import { useFundedTasks, useMyCrowdfunderStats } from '@/hooks';
import { TaskStatus, TASK_STATUS_LABELS } from '@/lib/constants';
import { formatUnits } from 'viem';

function taskStatusVariant(status: TaskStatus): 'success' | 'accent' | 'warning' | 'error' | 'default' {
  switch (status) {
    case TaskStatus.Completed:  return 'success';
    case TaskStatus.Active:
    case TaskStatus.Consensus:  return 'accent';
    case TaskStatus.Pending:    return 'warning';
    case TaskStatus.Disputed:   return 'error';
    default:                    return 'default';
  }
}

export default function FundedTasksPage() {
  const { data: fundedTasks = [], isLoading } = useFundedTasks();
  const { data: stats } = useMyCrowdfunderStats();

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
            {stats ? `${parseFloat(formatUnits(stats.totalContributed, 18)).toFixed(4)} ETH` : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">Tasks Funded</p>
          <p className="text-2xl font-bold text-text mt-1">{stats?.tasksFunded ?? fundedTasks.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">Completed Tasks</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.tasksCompleted ?? 0}</p>
        </Card>
      </div>

      {/* Funded Tasks List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-text-muted">Loading funded tasks…</p>
          </div>
        )}

        {!isLoading && fundedTasks.map((item) => {
          const task = item.task;
          const rewardPool = task ? task.rewardPerNode * BigInt(task.requiredNodes) : null;

          return (
            <Card key={item.taskId}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                    #{item.taskId}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">Task #{item.taskId}</span>
                      {task && (
                        <Badge variant={taskStatusVariant(task.status)} size="sm">
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-muted">
                      Contributed {item.timestamp ? formatRelativeTime(item.timestamp) : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Reward Pool */}
                  {rewardPool !== null && (
                    <div className="text-right">
                      <p className="text-sm text-text-muted">Reward Pool</p>
                      <p className="text-sm font-medium text-text">
                        {formatEth(rewardPool)} ETH
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {task?.requiredNodes} node{task?.requiredNodes !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* Your Contribution */}
                  <div className="text-right">
                    <p className="text-sm text-text-muted">Your Contribution</p>
                    <p className="text-lg font-bold gradient-text">
                      {parseFloat(formatUnits(item.amount, 18)).toFixed(4)} ETH
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {!isLoading && fundedTasks.length === 0 && (
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
            <p className="text-text-muted">You have not funded any tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
