'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { usePublicClient, useWriteContract, useAccount } from 'wagmi';
import { parseAbi, formatEther } from 'viem';
import { CONTRACT_ADDRESSES, ProposalState, REFRESH_INTERVALS } from '@/lib/constants';

// ── ABIs ──────────────────────────────────────────────────────────

const GOVERNANCE_ABI = parseAbi([
  'function proposalCount() view returns (uint256)',
  'function getProposalId(uint256 index) view returns (uint256)',
  'function getProposalSummary(uint256 proposalId) view returns (string title, string description, address proposer, uint256 startBlock, uint256 endBlock, uint8 status, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes)',
  'function castVote(uint256 proposalId, uint8 support) returns (uint256 balance)',
  'function hasVoted(uint256 proposalId, address account) view returns (bool)',
  'function votingDelay() view returns (uint256)',
  'function votingPeriod() view returns (uint256)',
  'function quorum(uint256 blockNumber) view returns (uint256)',
  'function proposalThreshold() view returns (uint256)',
]);

const GOV_TOKEN_ABI = parseAbi([
  'function getVotes(address account) view returns (uint256)',
  'function delegates(address account) view returns (address)',
  'function delegate(address delegatee)',
]);

// ── Types ─────────────────────────────────────────────────────────

export interface GovernanceProposal {
  id: string;          // proposalId as hex string
  idBigInt: bigint;
  title: string;
  description: string;
  proposer: string;
  startBlock: bigint;
  endBlock: bigint;
  state: ProposalState;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  totalVotes: bigint;
  forPercent: number;
}

// ── Helpers ───────────────────────────────────────────────────────

function governanceEnabled(): boolean {
  return CONTRACT_ADDRESSES.GOVERNANCE !== '';
}

// ── Hooks ─────────────────────────────────────────────────────────

/**
 * Reads all proposals from the on-chain OARNGovernance contract.
 * Returns an empty array if GOVERNANCE address is not configured.
 */
export function useGovernanceProposals() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['governance', 'proposals'],
    queryFn: async (): Promise<GovernanceProposal[]> => {
      if (!publicClient || !governanceEnabled()) return [];

      const govAddr = CONTRACT_ADDRESSES.GOVERNANCE as `0x${string}`;

      const count = await publicClient.readContract({
        address: govAddr,
        abi: GOVERNANCE_ABI,
        functionName: 'proposalCount',
      }) as bigint;

      if (count === BigInt(0)) return [];

      const proposals: GovernanceProposal[] = [];

      for (let i = BigInt(0); i < count; i++) {
        const proposalId = await publicClient.readContract({
          address: govAddr,
          abi: GOVERNANCE_ABI,
          functionName: 'getProposalId',
          args: [i],
        }) as bigint;

        const summary = await publicClient.readContract({
          address: govAddr,
          abi: GOVERNANCE_ABI,
          functionName: 'getProposalSummary',
          args: [proposalId],
        }) as unknown as readonly [string, string, `0x${string}`, bigint, bigint, number, bigint, bigint, bigint];

        const [title, description, proposer, startBlock, endBlock, status, forVotes, againstVotes, abstainVotes] = summary;
        const totalVotes = forVotes + againstVotes + abstainVotes;

        proposals.push({
          id: proposalId.toString(16),
          idBigInt: proposalId,
          title,
          description,
          proposer,
          startBlock,
          endBlock,
          state: status as ProposalState,
          forVotes,
          againstVotes,
          abstainVotes,
          totalVotes,
          forPercent: totalVotes > BigInt(0)
            ? Math.round(Number((forVotes * BigInt(10000)) / totalVotes) / 100)
            : 0,
        });
      }

      return proposals.reverse(); // newest first
    },
    enabled: !!publicClient,
    refetchInterval: REFRESH_INTERVALS.NETWORK_STATS,
  });
}

/**
 * Reads the connected wallet's GOV voting power (post-delegation).
 */
export function useVotingPower() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['governance', 'votingPower', address],
    queryFn: async (): Promise<{ votes: bigint; formattedVotes: string; isDelegated: boolean }> => {
      if (!publicClient || !address) return { votes: BigInt(0), formattedVotes: '0', isDelegated: false };

      const govAddr = CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`;
      const [votes, delegate] = await Promise.all([
        publicClient.readContract({ address: govAddr, abi: GOV_TOKEN_ABI, functionName: 'getVotes', args: [address] }) as Promise<bigint>,
        publicClient.readContract({ address: govAddr, abi: GOV_TOKEN_ABI, functionName: 'delegates', args: [address] }) as Promise<string>,
      ]);

      return {
        votes,
        formattedVotes: parseFloat(formatEther(votes)).toLocaleString('en', { maximumFractionDigits: 0 }),
        isDelegated: delegate.toLowerCase() === address.toLowerCase(),
      };
    },
    enabled: !!publicClient && !!address,
    refetchInterval: REFRESH_INTERVALS.BALANCE,
  });
}

/**
 * Returns whether the connected account has voted on a given proposal.
 */
export function useHasVoted(proposalId?: bigint) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['governance', 'hasVoted', proposalId?.toString(), address],
    queryFn: async (): Promise<boolean> => {
      if (!publicClient || !address || !proposalId || !governanceEnabled()) return false;
      return publicClient.readContract({
        address: CONTRACT_ADDRESSES.GOVERNANCE as `0x${string}`,
        abi: GOVERNANCE_ABI,
        functionName: 'hasVoted',
        args: [proposalId, address],
      }) as Promise<boolean>;
    },
    enabled: !!publicClient && !!address && !!proposalId,
  });
}

/**
 * Casts a vote on a proposal. support: 0=Against, 1=For, 2=Abstain
 */
export function useCastVote() {
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationFn: async ({ proposalId, support }: { proposalId: bigint; support: 0 | 1 | 2 }) => {
      if (!governanceEnabled()) throw new Error('Governance contract not deployed');
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.GOVERNANCE as `0x${string}`,
        abi: GOVERNANCE_ABI,
        functionName: 'castVote',
        args: [proposalId, support],
      });
      return { hash };
    },
  });
}

/**
 * Delegates GOV voting power to the connected wallet (self-delegate to activate voting).
 */
export function useDelegateGov() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Wallet not connected');
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
        abi: GOV_TOKEN_ABI,
        functionName: 'delegate',
        args: [address],
      });
      return { hash };
    },
  });
}
