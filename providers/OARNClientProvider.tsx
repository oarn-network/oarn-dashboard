'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseAbi, parseAbiItem, decodeFunctionData } from 'viem';
import { CONTRACT_ADDRESSES, TaskStatus, ConsensusType, IPFS_CONFIG, TASK_REGISTRY_DEPLOY_BLOCK } from '@/lib/constants';

type PublicClientInstance = NonNullable<ReturnType<typeof usePublicClient>>;

// ABIs (human-readable format, matching TaskRegistryV2)
const TASK_REGISTRY_ABI = parseAbi([
  'function tasks(uint256 taskId) view returns (address requester, bytes32 modelHash, bytes32 inputHash, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 status, uint8 consensusType)',
  'function taskCount() view returns (uint256)',
  'function getConsensusStatus(uint256 taskId) view returns (uint256 totalSubmissions, uint256 uniqueResults, bytes32 leadingResultHash, uint256 leadingCount, bool consensusReached, uint256 requiredForConsensus)',
  'function getTaskNodes(uint256 taskId) view returns (address[])',
  'function getNodeResult(uint256 taskId, address node) view returns (bytes32)',
  'function submitTask(bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 consensusType) payable returns (uint256)',
  'function claimTask(uint256 taskId)',
  'function submitResult(uint256 taskId, bytes32 resultHash)',
  'function cancelTask(uint256 taskId)',
  'function fundTask(uint256 taskId) payable',
]);

const OARN_REGISTRY_ABI = parseAbi([
  'function getActiveRPCProviders() view returns (address[])',
  'function isNodeActive(address node) view returns (bool)',
]);

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
]);

const SUBMIT_TASK_ABI = parseAbi([
  'function submitTask(bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 consensusType) payable returns (uint256)',
]);

const WET_LAB_ORACLE_ABI = parseAbi([
  'function pendingRewards(address) view returns (uint256)',
  'function getVerifiedResult(uint256 taskId) view returns (bytes32 agreedHash, uint256 confirmingLabCount, address[] confirmingLabs, uint256 verifiedAt)',
  'function submitResult(uint256 taskId, bytes32 parametersHash, int256 measuredValue, string metric) nonpayable',
  'function claimReward() nonpayable',
]);

// Types
export interface Task {
  id: number;
  requester: string;
  modelHash: string;
  inputHash: string;
  rewardPerNode: bigint;
  requiredNodes: number;
  deadline: number;
  status: TaskStatus;
  completedNodes?: number;
  consensusType: ConsensusType;
  resultHash?: string;
}

export interface Balance {
  eth: bigint;
  comp: bigint;
  gov: bigint;
}

export interface ConsensusStatus {
  reached: boolean;
  resultHash: string;
  submittedCount: number;
  requiredCount: number;
}

export interface WetLabConsensus {
  taskId: number;
  agreedHash: string;
  confirmingLabCount: number;
  confirmingLabs: string[];
  verifiedAt: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  requester?: string;
  limit?: number;
  offset?: number;
}

export interface SubmitTaskOptions {
  modelHash: string;
  inputHash: string;
  rewardPerNode: bigint;
  requiredNodes: number;
  deadline: number;
  consensusType?: ConsensusType;
}

type WriteContractAsync = ReturnType<typeof useWriteContract>['writeContractAsync'];

// Real OARN Client — reads via viem publicClient, writes via wagmi writeContractAsync
export class OARNClient {
  private _address: string | undefined;
  private _writeContractAsync: WriteContractAsync | null;
  private _publicClient: PublicClientInstance | undefined;

  constructor(options: {
    address?: string;
    writeContractAsync?: WriteContractAsync | null;
    publicClient?: PublicClientInstance;
  }) {
    this._address = options.address;
    this._writeContractAsync = options.writeContractAsync ?? null;
    this._publicClient = options.publicClient;
  }

  private get pc(): PublicClientInstance {
    if (!this._publicClient) throw new Error('Public client not available');
    return this._publicClient;
  }

  getAddress(): string | undefined {
    return this._address;
  }

  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  // ── Read Operations ──

  async getTask(taskId: number): Promise<Task | null> {
    try {
      const result = await this.pc.readContract({
        address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
        abi: TASK_REGISTRY_ABI,
        functionName: 'tasks',
        args: [BigInt(taskId)],
      });

      // viem returns a readonly tuple for multi-output functions
      const [requester, modelHash, inputHash, rewardPerNode, requiredNodes, deadline, status, consensusType] =
        result as unknown as readonly [`0x${string}`, `0x${string}`, `0x${string}`, bigint, bigint, bigint, number, number];

      // Skip zero-address tasks (non-existent)
      if (requester === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      return {
        id: taskId,
        requester,
        modelHash,
        inputHash,
        rewardPerNode,
        requiredNodes: Number(requiredNodes),
        deadline: Number(deadline),
        status: status as TaskStatus,
        consensusType: consensusType as ConsensusType,
      };
    } catch {
      return null;
    }
  }

  async getTaskCount(): Promise<number> {
    const count = await this.pc.readContract({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      abi: TASK_REGISTRY_ABI,
      functionName: 'taskCount',
    });
    return Number(count);
  }

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    const taskCount = await this.getTaskCount();
    const allTasks: Task[] = [];

    for (let i = 1; i <= taskCount; i++) {
      const task = await this.getTask(i);
      if (!task) continue;
      if (filter?.status !== undefined && task.status !== filter.status) continue;
      if (filter?.requester && task.requester.toLowerCase() !== filter.requester.toLowerCase()) continue;
      allTasks.push(task);
    }

    let result = allTasks;
    if (filter?.offset) result = result.slice(filter.offset);
    if (filter?.limit) result = result.slice(0, filter.limit);
    return result;
  }

  async getConsensusStatus(taskId: number): Promise<ConsensusStatus> {
    const result = await this.pc.readContract({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      abi: TASK_REGISTRY_ABI,
      functionName: 'getConsensusStatus',
      args: [BigInt(taskId)],
    });

    const [totalSubmissions, , leadingResultHash, , consensusReached, requiredForConsensus] =
      result as unknown as readonly [bigint, bigint, `0x${string}`, bigint, boolean, bigint];

    return {
      reached: consensusReached,
      resultHash: leadingResultHash,
      submittedCount: Number(totalSubmissions),
      requiredCount: Number(requiredForConsensus),
    };
  }

  async getTaskNodes(taskId: number): Promise<string[]> {
    const nodes = await this.pc.readContract({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      abi: TASK_REGISTRY_ABI,
      functionName: 'getTaskNodes',
      args: [BigInt(taskId)],
    });
    return nodes as string[];
  }

  async getBalance(address: string): Promise<Balance> {
    const addr = address as `0x${string}`;
    const [eth, comp, gov] = await Promise.all([
      this.pc.getBalance({ address: addr }),
      this.pc.readContract({
        address: CONTRACT_ADDRESSES.COMP_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [addr],
      }),
      this.pc.readContract({
        address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [addr],
      }),
    ]);
    return { eth, comp: comp as bigint, gov: gov as bigint };
  }

  async getActiveProviders(): Promise<string[]> {
    const providers = await this.pc.readContract({
      address: CONTRACT_ADDRESSES.OARN_REGISTRY as `0x${string}`,
      abi: OARN_REGISTRY_ABI,
      functionName: 'getActiveRPCProviders',
    });
    return providers as string[];
  }

  async isNodeActive(nodeAddress: string): Promise<boolean> {
    const active = await this.pc.readContract({
      address: CONTRACT_ADDRESSES.OARN_REGISTRY as `0x${string}`,
      abi: OARN_REGISTRY_ABI,
      functionName: 'isNodeActive',
      args: [nodeAddress as `0x${string}`],
    });
    return active as boolean;
  }

  async getRewardDistributedEvents(nodeAddress?: string) {
    return this.pc.getLogs({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      event: parseAbiItem('event RewardDistributed(uint256 indexed taskId, address indexed node, uint256 amount, bool matchedConsensus)'),
      args: nodeAddress ? { node: nodeAddress as `0x${string}` } : undefined,
      fromBlock: TASK_REGISTRY_DEPLOY_BLOCK,
      toBlock: 'latest',
    });
  }

  async getTaskFundedEvents(funderAddress?: string) {
    return this.pc.getLogs({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      event: parseAbiItem('event TaskFunded(uint256 indexed taskId, address indexed funder, uint256 fundingAmount, uint256 newRewardPerNode)'),
      args: funderAddress ? { funder: funderAddress as `0x${string}` } : undefined,
      fromBlock: TASK_REGISTRY_DEPLOY_BLOCK,
      toBlock: 'latest',
    });
  }

  async getBlockTimestamp(blockNumber: bigint): Promise<number> {
    const block = await this.pc.getBlock({ blockNumber });
    return Number(block.timestamp);
  }

  async getTaskClaimedEvents(taskId?: number) {
    return this.pc.getLogs({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      event: parseAbiItem('event TaskClaimed(uint256 indexed taskId, address indexed node)'),
      args: taskId !== undefined ? { taskId: BigInt(taskId) } : undefined,
      fromBlock: TASK_REGISTRY_DEPLOY_BLOCK,
      toBlock: 'latest',
    });
  }

  async getConsensusReachedEvents() {
    return this.pc.getLogs({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      event: parseAbiItem('event ConsensusReached(uint256 indexed taskId, bytes32 consensusHash, uint256 agreeingNodes, uint256 totalNodes)'),
      fromBlock: TASK_REGISTRY_DEPLOY_BLOCK,
      toBlock: 'latest',
    });
  }

  /** Parse modelRequirements JSON from submitTask calldata and tally by framework. */
  async getModelFrameworks(): Promise<Record<string, number>> {
    const logs = await this.pc.getLogs({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      event: parseAbiItem('event TaskCreated(uint256 indexed taskId, address indexed requester, bytes32 modelHash, uint256 rewardPerNode, uint256 requiredNodes, uint8 consensusType)'),
      fromBlock: TASK_REGISTRY_DEPLOY_BLOCK,
      toBlock: 'latest',
    });

    const counts: Record<string, number> = {};
    await Promise.all(logs.map(async (log) => {
      try {
        if (!log.transactionHash) return;
        const tx = await this.pc.getTransaction({ hash: log.transactionHash });
        const { args } = decodeFunctionData({ abi: SUBMIT_TASK_ABI, data: tx.input });
        const modelReq = args[2] as string; // modelRequirements string
        const parsed = JSON.parse(modelReq) as { framework?: string };
        const fw = (parsed.framework ?? 'Unknown').trim();
        const key = fw.charAt(0).toUpperCase() + fw.slice(1).toLowerCase();
        counts[key] = (counts[key] ?? 0) + 1;
      } catch {
        counts['Unknown'] = (counts['Unknown'] ?? 0) + 1;
      }
    }));

    return counts;
  }

  /** Read COMP/GOV token supply and estimate GOV holder count from Transfer events. */
  async getTokenMetrics(): Promise<{ compSupply: bigint; govSupply: bigint; govHolders: number }> {
    const [compSupply, govSupply, govTransfers] = await Promise.all([
      this.pc.readContract({
        address: CONTRACT_ADDRESSES.COMP_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }) as Promise<bigint>,
      this.pc.readContract({
        address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }) as Promise<bigint>,
      this.pc.getLogs({
        address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        fromBlock: BigInt(0),
        toBlock: 'latest',
      }),
    ]);

    // Count unique non-zero recipients of GOV transfers as proxy for holder count
    const holders = new Set<string>();
    for (const log of govTransfers) {
      const to = log.args?.to;
      if (to && to !== '0x0000000000000000000000000000000000000000') {
        holders.add(to.toLowerCase());
      }
    }

    return { compSupply, govSupply, govHolders: holders.size };
  }

  getIPFSUrl(cid: string): string {
    return `${IPFS_CONFIG.gateway}${cid}`;
  }

  async downloadFromIPFS(cid: string): Promise<Uint8Array> {
    const response = await fetch(`${IPFS_CONFIG.gateway}${cid}`);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  // ── Write Operations (require connected wallet) ──

  private requireWallet(): void {
    if (!this._writeContractAsync || !this._address) {
      throw new Error('Wallet not connected');
    }
  }

  async claimTask(taskId: number): Promise<{ hash: string }> {
    this.requireWallet();
    const hash = await this._writeContractAsync!({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      abi: TASK_REGISTRY_ABI,
      functionName: 'claimTask',
      args: [BigInt(taskId)],
    });
    return { hash };
  }

  async submitResult(taskId: number, resultHash: string): Promise<{ hash: string }> {
    this.requireWallet();
    const hash = await this._writeContractAsync!({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      abi: TASK_REGISTRY_ABI,
      functionName: 'submitResult',
      args: [BigInt(taskId), resultHash as `0x${string}`],
    });
    return { hash };
  }

  async cancelTask(taskId: number): Promise<{ hash: string }> {
    this.requireWallet();
    const hash = await this._writeContractAsync!({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      abi: TASK_REGISTRY_ABI,
      functionName: 'cancelTask',
      args: [BigInt(taskId)],
    });
    return { hash };
  }

  async fundTask(taskId: number, amount: bigint): Promise<{ hash: string }> {
    this.requireWallet();
    const hash = await this._writeContractAsync!({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      abi: TASK_REGISTRY_ABI,
      functionName: 'fundTask',
      args: [BigInt(taskId)],
      value: amount,
    });
    return { hash };
  }

  async submitTask(options: SubmitTaskOptions): Promise<{ taskId: number; tx: { hash: string } }> {
    this.requireWallet();
    const {
      modelHash,
      inputHash,
      rewardPerNode,
      requiredNodes,
      deadline,
      consensusType = ConsensusType.Majority,
    } = options;
    const totalReward = rewardPerNode * BigInt(requiredNodes);
    const hash = await this._writeContractAsync!({
      address: CONTRACT_ADDRESSES.TASK_REGISTRY as `0x${string}`,
      abi: TASK_REGISTRY_ABI,
      functionName: 'submitTask',
      args: [
        modelHash as `0x${string}`,
        inputHash as `0x${string}`,
        '',
        rewardPerNode,
        BigInt(requiredNodes),
        BigInt(deadline),
        consensusType,
      ],
      value: totalReward,
    });
    // taskId resolved from on-chain event; caller should refresh task list
    return { taskId: 0, tx: { hash } };
  }

  // ── WetLab Oracle ──

  async getVerifiedWetLabResult(taskId: number): Promise<WetLabConsensus> {
    const result = await this.pc.readContract({
      address: CONTRACT_ADDRESSES.WET_LAB_ORACLE as `0x${string}`,
      abi: WET_LAB_ORACLE_ABI,
      functionName: 'getVerifiedResult',
      args: [BigInt(taskId)],
    });
    const [agreedHash, confirmingLabCount, confirmingLabs, verifiedAt] =
      result as unknown as readonly [`0x${string}`, bigint, readonly `0x${string}`[], bigint];
    return {
      taskId,
      agreedHash,
      confirmingLabCount: Number(confirmingLabCount),
      confirmingLabs: confirmingLabs as string[],
      verifiedAt: Number(verifiedAt),
    };
  }

  async getWetLabPendingRewards(address: string): Promise<bigint> {
    const rewards = await this.pc.readContract({
      address: CONTRACT_ADDRESSES.WET_LAB_ORACLE as `0x${string}`,
      abi: WET_LAB_ORACLE_ABI,
      functionName: 'pendingRewards',
      args: [address as `0x${string}`],
    });
    return rewards as bigint;
  }

  async submitWetLabResult(
    taskId: number,
    parametersHash: string,
    measuredValue: bigint,
    metric: string
  ): Promise<{ hash: string }> {
    this.requireWallet();
    const hash = await this._writeContractAsync!({
      address: CONTRACT_ADDRESSES.WET_LAB_ORACLE as `0x${string}`,
      abi: WET_LAB_ORACLE_ABI,
      functionName: 'submitResult',
      args: [BigInt(taskId), parametersHash as `0x${string}`, measuredValue, metric],
    });
    return { hash };
  }

  async claimWetLabReward(): Promise<{ hash: string }> {
    this.requireWallet();
    const hash = await this._writeContractAsync!({
      address: CONTRACT_ADDRESSES.WET_LAB_ORACLE as `0x${string}`,
      abi: WET_LAB_ORACLE_ABI,
      functionName: 'claimReward',
    });
    return { hash };
  }

  // Stubs for methods not supported in browser context
  async submitResultWithData(): Promise<never> {
    throw new Error('Use submitResult with a pre-computed hash instead');
  }

  async submitTaskWithData(): Promise<never> {
    throw new Error('Use submitTask with pre-computed hashes instead');
  }

  async uploadToIPFS(): Promise<never> {
    throw new Error('IPFS upload not supported in browser. Use the node operator CLI.');
  }

  async approveTaskRegistry(): Promise<never> {
    throw new Error('COMP approval not yet supported');
  }
}

interface OARNClientContextValue {
  client: OARNClient | null;
  isConnected: boolean;
  address: string | undefined;
}

const OARNClientContext = createContext<OARNClientContextValue>({
  client: null,
  isConnected: false,
  address: undefined,
});

export function OARNClientProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const client = useMemo(() => {
    return new OARNClient({
      address,
      writeContractAsync: isConnected ? writeContractAsync : null,
      publicClient,
    });
  }, [address, isConnected, writeContractAsync, publicClient]);

  return (
    <OARNClientContext.Provider value={{ client, isConnected, address }}>
      {children}
    </OARNClientContext.Provider>
  );
}

export function useOARNClient() {
  const context = useContext(OARNClientContext);
  if (!context) {
    throw new Error('useOARNClient must be used within OARNClientProvider');
  }
  return context;
}
