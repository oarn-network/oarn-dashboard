'use client';

import { use } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, StatusBadge, Spinner, useToast } from '@/components/ui';
import { useTask, useConsensusStatus, useTaskNodes, useCancelTask } from '@/hooks';
import { formatEth, formatAddress, formatHash, formatDeadline, formatDateTime, getArbiscanUrl } from '@/lib/formatters';
import { TaskStatus, ConsensusType, TASK_STATUS_LABELS, CONSENSUS_TYPE_LABELS } from '@/lib/constants';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const taskId = parseInt(id);
  const { data: task, isLoading: loadingTask } = useTask(taskId);
  const { data: consensus } = useConsensusStatus(taskId);
  const { data: nodes = [] } = useTaskNodes(taskId);
  const cancelMutation = useCancelTask();
  const { addToast } = useToast();

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(taskId);
      addToast({
        type: 'success',
        title: 'Task Cancelled',
        message: 'Your task has been cancelled',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Cancel',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  if (loadingTask) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-text mb-2">Task Not Found</h2>
        <p className="text-text-muted mb-4">The task you are looking for does not exist.</p>
        <Link href="/researcher/tasks">
          <Button>Back to Tasks</Button>
        </Link>
      </div>
    );
  }

  const statusKey = TASK_STATUS_LABELS[task.status].toLowerCase() as
    | 'pending'
    | 'active'
    | 'consensus'
    | 'completed'
    | 'disputed'
    | 'cancelled'
    | 'expired';

  const totalReward = BigInt(task.rewardPerNode) * BigInt(task.requiredNodes);
  const progress = task.requiredNodes > 0 ? Math.round(((task.completedNodes ?? 0) / task.requiredNodes) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/researcher/tasks">
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text">Task #{task.id}</h1>
              <StatusBadge status={statusKey} />
            </div>
            <p className="text-text-muted mt-1">Submitted by {formatAddress(task.requester)}</p>
          </div>
        </div>
        {task.status === TaskStatus.Pending && (
          <Button variant="danger" onClick={handleCancel} isLoading={cancelMutation.isPending}>
            Cancel Task
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Task Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          {(task.status === TaskStatus.Active || task.status === TaskStatus.Completed) && (
            <Card>
              <h3 className="text-lg font-semibold text-text mb-4">Progress</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">Node Submissions</span>
                  <span className="text-text font-medium">
                    {task.completedNodes} / {task.requiredNodes}
                  </span>
                </div>
                <div className="h-3 bg-background-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Consensus Status */}
              {consensus && (
                <div className={`p-4 rounded-lg ${consensus.reached ? 'bg-success/10' : 'bg-warning/10'}`}>
                  <div className="flex items-center gap-2">
                    {consensus.reached ? (
                      <>
                        <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-success">Consensus Reached</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-warning">Awaiting Consensus</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Task Hashes */}
          <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Task Data</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted mb-1">Model Hash</p>
                <code className="block p-3 bg-background-light rounded-lg text-sm font-mono text-text break-all">
                  {task.modelHash}
                </code>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Input Hash</p>
                <code className="block p-3 bg-background-light rounded-lg text-sm font-mono text-text break-all">
                  {task.inputHash}
                </code>
              </div>
              {task.resultHash && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Result Hash</p>
                  <code className="block p-3 bg-success/10 rounded-lg text-sm font-mono text-success break-all">
                    {task.resultHash}
                  </code>
                </div>
              )}
            </div>
          </Card>

          {/* Participating Nodes */}
          {nodes.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-text mb-4">Participating Nodes</h3>
              <div className="space-y-2">
                {nodes.map((node, i) => (
                  <div
                    key={node}
                    className="flex items-center justify-between p-3 bg-background-light rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-muted">#{i + 1}</span>
                      <span className="font-mono text-sm text-text">{formatAddress(node, 10, 6)}</span>
                    </div>
                    <a
                      href={getArbiscanUrl(node)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-light text-sm"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Task Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Status</span>
                <StatusBadge status={statusKey} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Reward per Node</span>
                <span className="text-sm font-medium text-text">{formatEth(task.rewardPerNode)} ETH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Required Nodes</span>
                <span className="text-sm font-medium text-text">{task.requiredNodes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Total Reward</span>
                <span className="text-sm font-bold text-text">{formatEth(totalReward)} ETH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Deadline</span>
                <span className="text-sm font-medium text-text">{formatDeadline(task.deadline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Consensus Type</span>
                <Badge size="sm" variant="primary">
                  {CONSENSUS_TYPE_LABELS[task.consensusType as ConsensusType] ?? 'Unknown'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Download Results */}
          {task.status === TaskStatus.Completed && task.resultHash && (
            <Card className="bg-success/5 border-success/20">
              <h3 className="text-lg font-semibold text-text mb-4">Results Available</h3>
              <p className="text-sm text-text-muted mb-4">
                Your task has completed with consensus. Download the results below.
              </p>
              <Button className="w-full">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Results
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
