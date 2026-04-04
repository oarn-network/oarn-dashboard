'use client';

import { Card, Button, StatusBadge, Badge } from '@/components/ui';
import { formatEth, formatAddress, formatHash, formatDeadline } from '@/lib/formatters';
import { TaskStatus, ConsensusType, TASK_STATUS_LABELS, CONSENSUS_TYPE_LABELS } from '@/lib/constants';
import { useTaskName } from '@/hooks';
import type { Task } from '@/providers/OARNClientProvider';

interface TaskCardProps {
  task: Task;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onClaim?: (taskId: number) => void;
  onFund?: (taskId: number) => void;
  onView?: (taskId: number) => void;
  onSubmitResult?: (taskId: number) => void;
  isLoading?: boolean;
}

export function TaskCard({
  task,
  variant = 'default',
  showActions = true,
  onClaim,
  onFund,
  onView,
  onSubmitResult,
  isLoading = false,
}: TaskCardProps) {
  const { data: taskName } = useTaskName(task.id);
  const statusKey = TASK_STATUS_LABELS[task.status].toLowerCase() as
    | 'pending'
    | 'active'
    | 'consensus'
    | 'completed'
    | 'disputed'
    | 'cancelled'
    | 'expired';

  const progress = task.requiredNodes > 0
    ? Math.round(((task.completedNodes ?? 0) / task.requiredNodes) * 100)
    : 0;

  const totalReward = BigInt(task.rewardPerNode) * BigInt(task.requiredNodes);

  if (variant === 'compact') {
    return (
      <Card variant="interactive" className="p-3" onClick={() => onView?.(task.id)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">#{task.id}</span>
            <StatusBadge status={statusKey} size="sm" />
          </div>
          <span className="text-sm font-medium text-text">{formatEth(task.rewardPerNode)} ETH</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-text-muted">{formatAddress(task.requester)}</span>
          <span className="text-xs text-text-muted">{formatDeadline(task.deadline)}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="default">Task #{task.id}</Badge>
          <StatusBadge status={statusKey} />
        </div>
        {task.consensusType !== undefined && (
          <Badge variant="primary" size="sm">
            {CONSENSUS_TYPE_LABELS[task.consensusType as ConsensusType] ?? 'Unknown'}
          </Badge>
        )}
      </div>

      {/* Body */}
      <h3 className="text-lg font-semibold text-text mb-2">
        {taskName ?? `Task #${task.id}`}
      </h3>
      <p className="text-sm text-text-muted mb-4">
        {task.status === TaskStatus.Pending
          ? 'Waiting for nodes to claim this task'
          : task.status === TaskStatus.Active
          ? `${task.completedNodes ?? 0} of ${task.requiredNodes} nodes have submitted results`
          : task.status === TaskStatus.Completed
          ? 'Task completed with consensus reached'
          : 'Task is no longer active'}
      </p>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-3 bg-background-light rounded-lg">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">Reward/Node</p>
          <p className="text-sm font-medium text-text mt-1">{formatEth(task.rewardPerNode)} ETH</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">Total Reward</p>
          <p className="text-sm font-medium text-text mt-1">{formatEth(totalReward)} ETH</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">Required Nodes</p>
          <p className="text-sm font-medium text-text mt-1">{task.requiredNodes}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">Deadline</p>
          <p className="text-sm font-medium text-text mt-1">{formatDeadline(task.deadline)}</p>
        </div>
      </div>

      {/* Progress bar for active tasks */}
      {task.status === TaskStatus.Active && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-text-muted">Progress</span>
            <span className="text-text">{task.completedNodes ?? 0}/{task.requiredNodes} nodes</span>
          </div>
          <div className="h-2 bg-background-light rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Hashes */}
      <div className="space-y-2 mb-4 p-3 bg-background-light rounded-lg font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Model Hash:</span>
          <span className="text-text">{formatHash(task.modelHash)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Input Hash:</span>
          <span className="text-text">{formatHash(task.inputHash)}</span>
        </div>
        {task.resultHash && (
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Result Hash:</span>
            <span className="text-success">{formatHash(task.resultHash)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-sm text-text-muted">
          Requester: {formatAddress(task.requester)}
        </span>

        {showActions && (
          <div className="flex items-center gap-2">
            {task.status === TaskStatus.Pending && onClaim && (
              <Button size="sm" onClick={() => onClaim(task.id)} isLoading={isLoading}>
                Claim Task
              </Button>
            )}
            {task.status === TaskStatus.Pending && onFund && (
              <Button size="sm" variant="secondary" onClick={() => onFund(task.id)}>
                Fund
              </Button>
            )}
            {task.status === TaskStatus.Active && onSubmitResult && (
              <Button size="sm" onClick={() => onSubmitResult(task.id)} isLoading={isLoading}>
                Submit Result
              </Button>
            )}
            {onView && (
              <Button size="sm" variant="ghost" onClick={() => onView(task.id)}>
                View Details
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
