'use client';

import { useQuery } from '@tanstack/react-query';
import { useOARNClient } from '@/providers/OARNClientProvider';
import { TaskStatus } from '@/lib/constants';
import type { Task } from '@/providers/OARNClientProvider';

export interface TaskResult {
  taskId: number;
  status: TaskStatus;
  modelHash: string;
  inputHash: string;
  rewardPerNode: bigint;
  requiredNodes: number;
  completedNodes: number;
  // consensus data
  reached: boolean;
  consensusHash: string;
  agreeingNodes: number;
  totalSubmissions: number;
  uniqueResults: number;
}

export interface BatchMetrics {
  total: number;
  completed: number;
  consensusReached: number;
  disputed: number;
  pending: number;
  cancelled: number;
  avgConsensusRate: number; // % of submissions that agreed with winner
  avgDisagreement: number;  // % with uniqueResults > 1
}

async function fetchTaskResult(
  client: NonNullable<ReturnType<typeof useOARNClient>['client']>,
  taskId: number
): Promise<TaskResult> {
  const [task, consensus] = await Promise.all([
    client.getTask(taskId),
    client.getConsensusStatus(taskId),
  ]);

  return {
    taskId,
    status: task?.status ?? TaskStatus.Pending,
    modelHash: task?.modelHash ?? '',
    inputHash: task?.inputHash ?? '',
    rewardPerNode: task?.rewardPerNode ?? BigInt(0),
    requiredNodes: task?.requiredNodes ?? 0,
    completedNodes: task?.completedNodes ?? 0,
    reached: consensus?.reached ?? false,
    consensusHash: consensus?.resultHash ?? '',
    agreeingNodes: consensus?.requiredCount ?? 0,
    totalSubmissions: consensus?.submittedCount ?? 0,
    uniqueResults: 0, // not exposed in ConsensusStatus; 0 = unknown
  };
}

export function useBatchResults(taskIds: number[]) {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['batchResults', taskIds],
    queryFn: async (): Promise<TaskResult[]> => {
      if (!client || taskIds.length === 0) return [];
      return Promise.all(taskIds.map((id) => fetchTaskResult(client, id)));
    },
    enabled: !!client && taskIds.length > 0,
    refetchInterval: 30_000,
  });
}

export function computeBatchMetrics(results: TaskResult[]): BatchMetrics {
  const total = results.length;
  if (total === 0) {
    return { total: 0, completed: 0, consensusReached: 0, disputed: 0, pending: 0, cancelled: 0, avgConsensusRate: 0, avgDisagreement: 0 };
  }

  const completed   = results.filter((r) => r.status === TaskStatus.Completed).length;
  const consensusReached = results.filter((r) => r.reached).length;
  const disputed    = results.filter((r) => r.status === TaskStatus.Disputed).length;
  const cancelled   = results.filter((r) => r.status === TaskStatus.Cancelled || r.status === TaskStatus.Expired).length;
  const pending     = total - completed - disputed - cancelled;

  const finishedWithData = results.filter((r) => r.totalSubmissions > 0);
  const avgConsensusRate = finishedWithData.length > 0
    ? finishedWithData.reduce((sum, r) => sum + (r.agreeingNodes / Math.max(r.totalSubmissions, 1)), 0) / finishedWithData.length * 100
    : 0;
  const avgDisagreement = finishedWithData.length > 0
    ? finishedWithData.filter((r) => r.uniqueResults > 1).length / finishedWithData.length * 100
    : 0;

  return { total, completed, consensusReached, disputed, pending, cancelled, avgConsensusRate, avgDisagreement };
}

export function generateCSV(results: TaskResult[]): string {
  const headers = [
    'Task ID',
    'Status',
    'Consensus Reached',
    'Consensus Hash',
    'Agreeing Nodes',
    'Total Submissions',
    'Unique Results',
    'Disagreement Rate (%)',
    'Required Nodes',
    'Model Hash',
    'Input Hash',
  ];

  const rows = results.map((r) => [
    r.taskId,
    TaskStatus[r.status],
    r.reached ? 'Yes' : 'No',
    r.consensusHash || 'N/A',
    r.agreeingNodes,
    r.totalSubmissions,
    r.uniqueResults,
    r.totalSubmissions > 0 ? ((r.uniqueResults - 1) / r.totalSubmissions * 100).toFixed(1) : '0',
    r.requiredNodes,
    r.modelHash,
    r.inputHash,
  ]);

  return [headers, ...rows].map((row) => row.map(String).join(',')).join('\n');
}
