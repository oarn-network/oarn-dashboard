'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { parseAbi } from 'viem';
import { useOARNClient } from '@/providers/OARNClientProvider';
import { CONTRACT_ADDRESSES, ConsensusType } from '@/lib/constants';

const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);

const TASK_REGISTRY_ABI = parseAbi([
  'function compPaymentEnabled() view returns (bool)',
  'function compDiscountBps() view returns (uint256)',
  'function submitTaskWithCOMP(bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 consensusType) returns (uint256)',
]);

/** Fetch COMP payment settings from chain */
export function useCompPaymentInfo() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['compPaymentInfo'],
    queryFn: async () => {
      if (!publicClient) return { enabled: false, discountBps: 1000 };

      const [enabled, discountBps] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.TASK_REGISTRY_V2 as `0x${string}`,
          abi: TASK_REGISTRY_ABI,
          functionName: 'compPaymentEnabled',
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.TASK_REGISTRY_V2 as `0x${string}`,
          abi: TASK_REGISTRY_ABI,
          functionName: 'compDiscountBps',
        }),
      ]);

      return { enabled: enabled as boolean, discountBps: Number(discountBps) };
    },
    enabled: !!publicClient,
    staleTime: 60_000,
  });
}

/** Current COMP allowance for TaskRegistryV2 */
export function useCompAllowance() {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  return useQuery({
    queryKey: ['compAllowance', address],
    queryFn: async () => {
      if (!publicClient || !address) return BigInt(0);
      return publicClient.readContract({
        address: CONTRACT_ADDRESSES.COMP_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, CONTRACT_ADDRESSES.TASK_REGISTRY_V2 as `0x${string}`],
      }) as Promise<bigint>;
    },
    enabled: !!publicClient && !!address,
    refetchInterval: 15_000,
  });
}

export interface SubmitTaskWithCOMPParams {
  modelHash: `0x${string}`;
  inputHash: `0x${string}`;
  modelRequirements: string;
  rewardPerNode: bigint;  // in COMP wei — nodes receive this amount each
  requiredNodes: number;
  deadline: number;       // unix timestamp
  consensusType: ConsensusType;
}

/**
 * Approve COMP + submit task in COMP payment mode.
 * The researcher pays (rewardPerNode * requiredNodes) * (1 - discountBps/10000) COMP.
 * Nodes are rewarded rewardPerNode COMP each.
 */
export function useSubmitTaskWithCOMP() {
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitTaskWithCOMPParams) => {
      const totalPool = params.rewardPerNode * BigInt(params.requiredNodes);

      // Step 1 — Approve COMP spend (approve full pool; discount held by contract)
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMP_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.TASK_REGISTRY_V2 as `0x${string}`, totalPool],
      });

      // Step 2 — Submit task with COMP
      return writeContractAsync({
        address: CONTRACT_ADDRESSES.TASK_REGISTRY_V2 as `0x${string}`,
        abi: TASK_REGISTRY_ABI,
        functionName: 'submitTaskWithCOMP',
        args: [
          params.modelHash,
          params.inputHash,
          params.modelRequirements,
          params.rewardPerNode,
          BigInt(params.requiredNodes),
          BigInt(params.deadline),
          params.consensusType,
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['compAllowance'] });
    },
  });
}
