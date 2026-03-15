'use client';

import { useQuery } from '@tanstack/react-query';
import { useOARNClient } from '@/providers/OARNClientProvider';
import { REFRESH_INTERVALS } from '@/lib/constants';

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
        };
      }

      const [taskCount, activeProviders] = await Promise.all([
        client.getTaskCount(),
        client.getActiveProviders(),
      ]);

      // Mock some additional stats
      return {
        totalTasks: taskCount,
        activeNodes: activeProviders.length,
        completedTasks: Math.floor(taskCount * 0.75), // Mock ~75% completion rate
        tvl: BigInt('50000000000000000000'), // Mock 50 ETH TVL
      };
    },
    enabled: !!client,
    refetchInterval: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

// Mock historical data for charts
export function useNetworkHistory(days: number = 30) {
  return useQuery({
    queryKey: ['networkHistory', days],
    queryFn: () => {
      // Generate mock historical data
      const data = [];
      const now = Date.now();

      for (let i = days; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          tasks: Math.floor(50 + Math.random() * 100 + (days - i) * 2),
          nodes: Math.floor(5 + Math.random() * 10 + (days - i) * 0.3),
          earnings: parseFloat((0.5 + Math.random() * 2 + (days - i) * 0.05).toFixed(2)),
        });
      }

      return data;
    },
    staleTime: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

// Mock earnings history for node operators
export function useEarningsHistory(days: number = 30) {
  const { address } = useOARNClient();

  return useQuery({
    queryKey: ['earningsHistory', address, days],
    queryFn: () => {
      if (!address) return [];

      // Generate mock earnings data
      const data = [];
      const now = Date.now();

      for (let i = days; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const hasEarnings = Math.random() > 0.3;

        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          earnings: hasEarnings ? parseFloat((Math.random() * 0.5).toFixed(4)) : 0,
          tasks: hasEarnings ? Math.floor(Math.random() * 5) + 1 : 0,
        });
      }

      return data;
    },
    enabled: !!address,
    staleTime: REFRESH_INTERVALS.NETWORK_STATS,
  });
}
