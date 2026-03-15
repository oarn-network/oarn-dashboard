'use client';

import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { Button, Select } from '@/components/ui';
import { TaskCardSkeleton } from '@/components/ui/Spinner';
import { TaskStatus, TASK_STATUS_LABELS } from '@/lib/constants';
import type { Task } from '@/providers/OARNClientProvider';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  emptyMessage?: string;
  showFilters?: boolean;
  showActions?: boolean;
  onClaim?: (taskId: number) => void;
  onFund?: (taskId: number) => void;
  onView?: (taskId: number) => void;
  onSubmitResult?: (taskId: number) => void;
  claimingTaskId?: number | null;
}

export function TaskList({
  tasks,
  isLoading = false,
  emptyMessage = 'No tasks found',
  showFilters = true,
  showActions = true,
  onClaim,
  onFund,
  onView,
  onSubmitResult,
  claimingTaskId,
}: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Filter tasks
  let filteredTasks = [...tasks];

  if (statusFilter !== 'all') {
    const statusValue = parseInt(statusFilter);
    filteredTasks = filteredTasks.filter((t) => t.status === statusValue);
  }

  // Sort tasks
  filteredTasks.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.id - a.id;
      case 'oldest':
        return a.id - b.id;
      case 'reward-high':
        return Number(b.rewardPerNode - a.rewardPerNode);
      case 'reward-low':
        return Number(a.rewardPerNode - b.rewardPerNode);
      case 'deadline':
        return a.deadline - b.deadline;
      default:
        return 0;
    }
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'reward-high', label: 'Highest Reward' },
    { value: 'reward-low', label: 'Lowest Reward' },
    { value: 'deadline', label: 'Deadline (Soonest)' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <div className="flex items-center gap-4 p-4 bg-surface rounded-lg">
            <div className="h-10 w-40 bg-background-light rounded animate-pulse" />
            <div className="h-10 w-40 bg-background-light rounded animate-pulse" />
          </div>
        )}
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-surface rounded-lg border border-border">
          <div className="w-40">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
          <div className="flex-1" />
          <span className="text-sm text-text-muted">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Task grid */}
      {filteredTasks.length === 0 ? (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showActions={showActions}
              onClaim={onClaim}
              onFund={onFund}
              onView={onView}
              onSubmitResult={onSubmitResult}
              isLoading={claimingTaskId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
