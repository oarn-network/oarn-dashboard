'use client';

import { useQuery } from '@tanstack/react-query';
import { useOARNClient } from '@/providers/OARNClientProvider';
import { REFRESH_INTERVALS } from '@/lib/constants';

export function useBalance(address?: string) {
  const { client, address: connectedAddress } = useOARNClient();
  const targetAddress = address || connectedAddress;

  return useQuery({
    queryKey: ['balance', targetAddress],
    queryFn: () => {
      if (!client || !targetAddress) return null;
      return client.getBalance(targetAddress);
    },
    enabled: !!client && !!targetAddress,
    refetchInterval: REFRESH_INTERVALS.BALANCE,
  });
}

export function useMyBalance() {
  const { address } = useOARNClient();
  return useBalance(address);
}
