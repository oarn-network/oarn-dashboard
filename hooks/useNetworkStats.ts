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

      // Avg time from first TaskClaimed to ConsensusReached per task (in minutes)
      let avgConsensusTimeMin: number | null = null;
      try {
        const [claimedLogs, consensusLogs] = await Promise.all([
          client.getTaskClaimedEvents(),
          client.getConsensusReachedEvents(),
        ]);

        if (consensusLogs.length > 0) {
          // First claim block per taskId
          const firstClaimBlock = new Map<string, bigint>();
          for (const log of claimedLogs) {
            const id = log.args?.taskId?.toString() ?? '';
            if (!id || log.blockNumber === null) continue;
            const cur = firstClaimBlock.get(id);
            if (cur === undefined || log.blockNumber < cur) {
              firstClaimBlock.set(id, log.blockNumber);
            }
          }

          // Pair with ConsensusReached events
          const deltas: number[] = [];
          const uniqueBlocks = new Set<bigint>();
          for (const log of consensusLogs) {
            const id = log.args?.taskId?.toString() ?? '';
            const claimBlock = firstClaimBlock.get(id);
            if (!claimBlock || log.blockNumber === null) continue;
            uniqueBlocks.add(claimBlock);
            uniqueBlocks.add(log.blockNumber);
          }

          const blockTsMap = new Map<string, number>();
          await Promise.all(Array.from(uniqueBlocks).map(async (bn) => {
            const ts = await client.getBlockTimestamp(bn);
            blockTsMap.set(bn.toString(), ts);
          }));

          for (const log of consensusLogs) {
            const id = log.args?.taskId?.toString() ?? '';
            const claimBlock = firstClaimBlock.get(id);
            if (!claimBlock || log.blockNumber === null) continue;
            const claimTs = blockTsMap.get(claimBlock.toString());
            const consensusTs = blockTsMap.get(log.blockNumber.toString());
            if (claimTs !== undefined && consensusTs !== undefined && consensusTs > claimTs) {
              deltas.push((consensusTs - claimTs) / 60);
            }
          }

          if (deltas.length > 0) {
            avgConsensusTimeMin = parseFloat(
              (deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1)
            );
          }
        }
      } catch {
        // Non-critical — leave as null
      }

      return {
        totalTasks: tasks.length,
        activeNodes: providers.length,
        completedTasks,
        tvl,
        avgReward,
        avgConsensusTimeMin,
        tasks,
      };
    },
    enabled: !!client,
    refetchInterval: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

export function useModelFrameworks() {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['modelFrameworks'],
    queryFn: async () => {
      if (!client) return {};
      return client.getModelFrameworks();
    },
    enabled: !!client,
    staleTime: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

export function useTokenMetrics() {
  const { client } = useOARNClient();

  return useQuery({
    queryKey: ['tokenMetrics'],
    queryFn: async () => {
      if (!client) return { compSupply: BigInt(0), govSupply: BigInt(0), govHolders: 0 };
      return client.getTokenMetrics();
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
      if (!client) return [];

      const now = Date.now();
      const cutoffMs = now - days * 24 * 60 * 60 * 1000;

      const [createdEvents, rewardEvents, providers] = await Promise.all([
        client.getTaskCreatedEvents(),
        client.getRewardDistributedEvents(),
        client.getActiveProviders(),
      ]);

      const nodeCount = providers.length;

      // Collect unique block numbers across both event sets
      const uniqueBlocks = Array.from(new Set([
        ...createdEvents.map(e => e.blockNumber),
        ...rewardEvents.map(e => e.blockNumber),
      ].filter((n): n is bigint => n !== null && n !== undefined)));

      const timestamps = await Promise.all(uniqueBlocks.map(n => client.getBlockTimestamp(n)));
      const blockTimeMap = new Map<string, number>(
        uniqueBlocks.map((n, i) => [n.toString(), timestamps[i]])
      );

      // Build date-keyed buckets for the window
      const bucketKeys: string[] = [];
      const buckets = new Map<string, { newTasks: number; earnings: number }>();
      for (let i = days; i >= 0; i--) {
        const key = new Date(now - i * 24 * 60 * 60 * 1000)
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        bucketKeys.push(key);
        buckets.set(key, { newTasks: 0, earnings: 0 });
      }

      // Bin TaskCreated events
      for (const event of createdEvents) {
        const ts = blockTimeMap.get(event.blockNumber?.toString() ?? '');
        if (!ts || ts * 1000 < cutoffMs) continue;
        const key = new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const b = buckets.get(key);
        if (b) b.newTasks++;
      }

      // Bin RewardDistributed events
      for (const event of rewardEvents) {
        const ts = blockTimeMap.get(event.blockNumber?.toString() ?? '');
        if (!ts || ts * 1000 < cutoffMs) continue;
        const key = new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const b = buckets.get(key);
        if (b) b.earnings += parseFloat(formatUnits(event.args?.amount ?? BigInt(0), 18));
      }

      return bucketKeys.map((date) => {
        const b = buckets.get(date)!;
        return {
          date,
          tasks: b.newTasks,
          nodes: nodeCount,
          earnings: parseFloat(b.earnings.toFixed(4)),
        };
      });
    },
    staleTime: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

export function useFundedTasks() {
  const { client, address } = useOARNClient();

  return useQuery({
    queryKey: ['fundedTasks', address],
    queryFn: async () => {
      if (!client || !address) return [];

      const events = await client.getTaskFundedEvents(address);
      if (events.length === 0) return [];

      const taskIds = Array.from(new Set(
        events.map(e => Number(e.args?.taskId ?? 0)).filter(Boolean)
      ));
      const uniqueBlocks = Array.from(new Set(
        events.map(e => e.blockNumber).filter((n): n is bigint => n !== null && n !== undefined)
      ));

      const [tasks, timestamps] = await Promise.all([
        Promise.all(taskIds.map(id => client.getTask(id))),
        Promise.all(uniqueBlocks.map(n => client.getBlockTimestamp(n))),
      ]);

      const taskMap = new Map(tasks.filter(Boolean).map(t => [t!.id, t!]));
      const blockTimeMap = new Map(uniqueBlocks.map((n, i) => [n.toString(), timestamps[i]]));

      // Sum contributions per taskId, keep earliest timestamp
      const contribMap = new Map<number, { amount: bigint; timestamp: number }>();
      for (const event of events) {
        const taskId = Number(event.args?.taskId ?? 0);
        if (!taskId) continue;
        const ts = blockTimeMap.get(event.blockNumber?.toString() ?? '') ?? 0;
        const existing = contribMap.get(taskId);
        contribMap.set(taskId, {
          amount: (existing?.amount ?? BigInt(0)) + (event.args?.fundingAmount ?? BigInt(0)),
          timestamp: existing ? Math.min(existing.timestamp, ts) : ts,
        });
      }

      return Array.from(contribMap.entries())
        .map(([taskId, contrib]) => ({
          taskId,
          amount: contrib.amount,
          timestamp: contrib.timestamp,
          task: taskMap.get(taskId) ?? null,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: !!client && !!address,
    refetchInterval: REFRESH_INTERVALS.TASKS,
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

export function useNodeReputation(nodeAddress?: string | null) {
  const { client, address: connectedAddress } = useOARNClient();
  const addr = nodeAddress ?? connectedAddress;

  return useQuery({
    queryKey: ['nodeReputation', addr],
    queryFn: async () => {
      if (!client || !addr) return null;

      const [rewardEvents, claimedEvents, submittedEvents] = await Promise.all([
        client.getRewardDistributedEvents(addr),
        client.getTaskClaimedEvents(),
        client.getResultSubmittedEvents(addr),
      ]);

      // Filter claimed events to this node
      const claimed = claimedEvents.filter(
        (e) => e.args?.node?.toLowerCase() === addr.toLowerCase()
      );

      const tasksClaimed = claimed.length;
      const tasksSubmitted = submittedEvents.length;
      const totalSubmissions = rewardEvents.length;
      const consensusMatches = rewardEvents.filter((e) => e.args?.matchedConsensus).length;
      const totalEarned = rewardEvents.reduce(
        (sum, e) => sum + (e.args?.amount ?? BigInt(0)),
        BigInt(0)
      );

      const consensusMatchRate = totalSubmissions > 0 ? consensusMatches / totalSubmissions : 0;
      const submissionRate = tasksClaimed > 0 ? Math.min(tasksSubmitted / tasksClaimed, 1) : 0;
      // Volume component: scales linearly to 1 at 50 completed tasks
      const volumeScore = Math.min(consensusMatches / 50, 1);

      const reputationScore = Math.round(
        (0.4 * consensusMatchRate + 0.3 * submissionRate + 0.3 * volumeScore) * 100
      );

      const tier =
        reputationScore >= 90 ? 'Platinum' :
        reputationScore >= 70 ? 'Gold' :
        reputationScore >= 45 ? 'Silver' :
        reputationScore >= 20 ? 'Bronze' : 'New';

      return {
        reputationScore,
        tier,
        consensusMatchRate: Math.round(consensusMatchRate * 100),
        submissionRate: Math.round(submissionRate * 100),
        tasksCompleted: consensusMatches,
        tasksClaimed,
        totalEarned,
      };
    },
    enabled: !!client && !!addr,
    refetchInterval: REFRESH_INTERVALS.TASKS,
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
