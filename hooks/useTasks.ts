'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOARNClient } from '@/providers/OARNClientProvider';
import { REFRESH_INTERVALS, TaskStatus } from '@/lib/constants';
import type { TaskFilter } from '@/providers/OARNClientProvider';

export function useTasks(filter?: TaskFilter) {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => client?.getTasks(filter) ?? Promise.resolve([]),
    enabled: !!client,
    refetchInterval: REFRESH_INTERVALS.TASKS,
  });
}

export function useTask(taskId: number | null) {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => (taskId !== null ? client?.getTask(taskId) : Promise.resolve(null)),
    enabled: !!client && taskId !== null,
    refetchInterval: REFRESH_INTERVALS.TASKS,
  });
}

export function useTaskCount() {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['taskCount'],
    queryFn: () => client?.getTaskCount() ?? Promise.resolve(0),
    enabled: !!client,
    refetchInterval: REFRESH_INTERVALS.TASKS,
  });
}

export function useConsensusStatus(taskId: number | null) {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['consensusStatus', taskId],
    queryFn: () => (taskId !== null ? client?.getConsensusStatus(taskId) : Promise.resolve(null)),
    enabled: !!client && taskId !== null,
    refetchInterval: REFRESH_INTERVALS.TASKS,
  });
}

export function useTaskNodes(taskId: number | null) {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['taskNodes', taskId],
    queryFn: () => (taskId !== null ? client?.getTaskNodes(taskId) : Promise.resolve([])),
    enabled: !!client && taskId !== null,
  });
}

export function useMyTasks(role: 'requester' | 'node') {
  const { client, address } = useOARNClient();

  return useQuery({
    queryKey: ['myTasks', role, address],
    queryFn: async () => {
      if (!client || !address) return [];

      if (role === 'requester') {
        return client.getTasks({ requester: address });
      }

      // For node operators, we'd need to check claimed tasks
      // For now, return all active tasks as a placeholder
      return client.getTasks({ status: TaskStatus.Active });
    },
    enabled: !!client && !!address,
    refetchInterval: REFRESH_INTERVALS.TASKS,
  });
}

export function usePendingTasks() {
  return useTasks({ status: TaskStatus.Pending });
}

export function useActiveTasks() {
  return useTasks({ status: TaskStatus.Active });
}

export function useClaimTask() {
  const { client } = useOARNClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: number) => {
      if (!client) throw new Error('Client not initialized');
      return client.claimTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}

export function useSubmitResult() {
  const { client } = useOARNClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, resultHash }: { taskId: number; resultHash: string }) => {
      if (!client) throw new Error('Client not initialized');
      return client.submitResult(taskId, resultHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}

export function useSubmitResultWithData() {
  const { client } = useOARNClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, resultData }: { taskId: number; resultData: Buffer | string }) => {
      if (!client) throw new Error('Client not initialized');
      return client.submitResultWithData(taskId, resultData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}

export function useFundTask() {
  const { client } = useOARNClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, amount }: { taskId: number; amount: bigint }) => {
      if (!client) throw new Error('Client not initialized');
      return client.fundTask(taskId, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

export function useCancelTask() {
  const { client } = useOARNClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: number) => {
      if (!client) throw new Error('Client not initialized');
      return client.cancelTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}
