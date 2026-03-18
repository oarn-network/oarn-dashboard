'use client';

import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { useOARNClient } from '@/providers/OARNClientProvider';
import type { Task } from '@/providers/OARNClientProvider';
import { REFRESH_INTERVALS, TaskStatus } from '@/lib/constants';

export function useActiveProviders() {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['activeProviders'],
    queryFn: () => client?.getActiveProviders() ?? Promise.resolve([]),
    enabled: !!client,
    refetchInterval: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

export function useNetworkStats() {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['networkStats'],
    queryFn: async () => {
      if (!client) {
        return {
          totalTasks: 0,
          activeNodes: 0,
          completedTasks: 0,
          tvl: BigInt(0),
          avgReward: BigInt(0),
          tasks: [] as Task[],
        };
      }

      const [tasks, providers] = await Promise.all([
        client.getTasks(),
        client.getActiveProviders(),
      ]);

      const completedTasks = tasks.filter(t => t.status === TaskStatus.Completed).length;
      const avgReward = tasks.length > 0
        ? tasks.reduce((sum, t) => sum + t.rewardPerNode, BigInt(0)) / BigInt(tasks.length)
        : BigInt(0);
      const tvl = tasks
        .filter(t => t.status !== TaskStatus.Cancelled && t.status !== TaskStatus.Expired)
        .reduce((sum, t) => sum + t.rewardPerNode * BigInt(t.requiredNodes), BigInt(0));

      return {
        totalTasks: tasks.length,
        activeNodes: providers.length,
        completedTasks,
        tvl,
        avgReward,
        tasks,
      };
    },
    enabled: !!client,
    refetchInterval: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

export function useNetworkHistory(days: number = 30) {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['networkHistory', days],
    queryFn: async () => {
      const data: { date: string; tasks: number; nodes: number; earnings: number }[] = [];
      const now = Date.now();

      const [tasks, providers] = await Promise.all([
        client?.getTasks() ?? Promise.resolve([]),
        client?.getActiveProviders() ?? Promise.resolve([]),
      ]);

      const totalTasks = tasks.length;
      const nodeCount = providers.length;

      for (let i = days; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const slotIdx = days - i; // 0 = oldest, days = today

        // Cumulative task count at this slot (tasks ~= sequential by time)
        const cumulative = totalTasks > 0 ? Math.round(totalTasks * slotIdx / days) : 0;
        const prevCumulative = totalTasks > 0 && slotIdx > 0
          ? Math.round(totalTasks * (slotIdx - 1) / days)
          : 0;

        const slotTasks = tasks.slice(prevCumulative, cumulative);
        const earnings = slotTasks.reduce((s, t) => {
          return s + parseFloat(formatUnits(t.rewardPerNode * BigInt(t.requiredNodes), 18));
        }, 0);

        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          tasks: cumulative,
          nodes: nodeCount,
          earnings: parseFloat(earnings.toFixed(4)),
        });
      }

      return data;
    },
    staleTime: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

export function useEarningsHistory(days: number = 30) {
  const { client, address } = useOARNClient();

  return useQuery({
    queryKey: ['earningsHistory', address, days],
    queryFn: async () => {
      if (!address || !client) return [];

      const events = await client.getRewardDistributedEvents(address);

      if (events.length === 0) {
        const result = [];
        const now = Date.now();
        for (let i = days; i >= 0; i--) {
          const date = new Date(now - i * 24 * 60 * 60 * 1000);
          result.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            earnings: 0,
            tasks: 0,
          });
        }
        return result;
      }

      // Fetch block timestamps for unique blocks
      const uniqueBlocks = Array.from(new Set(
        events.map(e => e.blockNumber).filter((n): n is bigint => n !== null && n !== undefined)
      ));
      const blockTimestamps = await Promise.all(
        uniqueBlocks.map(n => client.getBlockTimestamp(n))
      );
      const blockTimeMap = new Map<string, number>(
        uniqueBlocks.map((n, i) => [n.toString(), blockTimestamps[i]])
      );

      // Group events by UTC date
      const dateMap = new Map<string, { earnings: number; tasks: number }>();
      for (const event of events) {
        const ts = blockTimeMap.get(event.blockNumber?.toString() ?? '');
        if (ts === undefined) continue;
        const dateStr = new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const entry = dateMap.get(dateStr) ?? { earnings: 0, tasks: 0 };
        const amount = event.args?.amount ?? BigInt(0);
        entry.earnings += parseFloat(formatUnits(amount, 18));
        entry.tasks += 1;
        dateMap.set(dateStr, entry);
      }

      // Build result for last `days` days
      const result = [];
      const now = Date.now();
      for (let i = days; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const entry = dateMap.get(dateStr) ?? { earnings: 0, tasks: 0 };
        result.push({
          date: dateStr,
          earnings: parseFloat(entry.earnings.toFixed(4)),
          tasks: entry.tasks,
        });
      }
      return result;
    },
    enabled: !!address && !!client,
    staleTime: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

export function useNodeLeaderboard() {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['nodeLeaderboard'],
    queryFn: async () => {
      if (!client) return [];
      const events = await client.getRewardDistributedEvents();
      const nodeMap = new Map<string, { total: number; matched: number; earnings: bigint }>();

      for (const log of events) {
        const node = log.args?.node?.toLowerCase();
        if (!node) continue;
        const entry = nodeMap.get(node) ?? { total: 0, matched: 0, earnings: BigInt(0) };
        entry.total++;
        if (log.args?.matchedConsensus) entry.matched++;
        entry.earnings += log.args?.amount ?? BigInt(0);
        nodeMap.set(node, entry);
      }

      return Array.from(nodeMap.entries())
        .map(([address, s]) => ({
          address,
          tasksCompleted: s.matched,
          totalEarnings: s.earnings,
          successRate: s.total > 0 ? (s.matched / s.total) * 100 : 0,
        }))
        .sort((a, b) => b.tasksCompleted - a.tasksCompleted);
    },
    enabled: !!client,
    refetchInterval: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

export function useMyCompletedTasks() {
  const { client, address } = useOARNClient();

  return useQuery({
    queryKey: ['myCompletedTasks', address],
    queryFn: async () => {
      if (!client || !address) return 0;
      const events = await client.getRewardDistributedEvents(address);
      return events.filter(log => log.args?.matchedConsensus).length;
    },
    enabled: !!client && !!address,
    refetchInterval: REFRESH_INTERVALS.TASKS,
  });
}

export function useMyCrowdfunderStats() {
  const { client, address } = useOARNClient();

  return useQuery({
    queryKey: ['myCrowdfunderStats', address],
    queryFn: async () => {
      if (!client || !address) {
        return { tasksFunded: 0, totalContributed: BigInt(0), tasksCompleted: 0 };
      }
      const [fundedEvents, tasks] = await Promise.all([
        client.getTaskFundedEvents(address),
        client.getTasks(),
      ]);

      const fundedTaskIds = new Set(
        fundedEvents.map(l => l.args?.taskId?.toString()).filter(Boolean)
      );
      const totalContributed = fundedEvents.reduce(
        (sum, l) => sum + (l.args?.fundingAmount ?? BigInt(0)),
        BigInt(0)
      );
      const tasksCompleted = tasks.filter(
        t => fundedTaskIds.has(t.id.toString()) && t.status === TaskStatus.Completed
      ).length;

      return { tasksFunded: fundedTaskIds.size, totalContributed, tasksCompleted };
    },
    enabled: !!client && !!address,
    refetchInterval: REFRESH_INTERVALS.TASKS,
  });
}
