'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESSES, TaskStatus, ConsensusType, IPFS_CONFIG } from '@/lib/constants';

// Types matching the SDK
export interface Task {
  id: number;
  requester: string;
  modelHash: string;
  inputHash: string;
  rewardPerNode: bigint;
  requiredNodes: number;
  deadline: number;
  status: TaskStatus;
  completedNodes: number;
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

export interface TaskFilter {
  status?: TaskStatus;
  requester?: string;
  limit?: number;
  offset?: number;
}

// Mock OARN Client for demo purposes
// In production, this would use the actual @oarnnetwork/sdk
class OARNClient {
  private address: string | null = null;
  private walletClient: unknown = null;

  constructor(options?: { address?: string; walletClient?: unknown }) {
    this.address = options?.address || null;
    this.walletClient = options?.walletClient || null;
  }

  getAddress(): string | null {
    return this.address;
  }

  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  // Task Operations
  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    // Mock implementation - returns demo data
    const mockTasks: Task[] = [
      {
        id: 1,
        requester: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bEfA',
        modelHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        inputHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        rewardPerNode: BigInt('100000000000000000'), // 0.1 ETH
        requiredNodes: 3,
        deadline: Math.floor(Date.now() / 1000) + 86400,
        status: TaskStatus.Pending,
        completedNodes: 0,
        consensusType: ConsensusType.Majority,
      },
      {
        id: 2,
        requester: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        modelHash: '0x2345678901bcdef01234567890abcdef1234567890abcdef1234567890abcdef',
        inputHash: '0xbcdef01234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        rewardPerNode: BigInt('200000000000000000'), // 0.2 ETH
        requiredNodes: 5,
        deadline: Math.floor(Date.now() / 1000) + 172800,
        status: TaskStatus.Active,
        completedNodes: 2,
        consensusType: ConsensusType.Unanimous,
      },
      {
        id: 3,
        requester: this.address || '0x0000000000000000000000000000000000000000',
        modelHash: '0x3456789012cdef012345678901bcdef01234567890abcdef1234567890abcdef',
        inputHash: '0xcdef012345678901bcdef01234567890abcdef1234567890abcdef1234567890',
        rewardPerNode: BigInt('50000000000000000'), // 0.05 ETH
        requiredNodes: 3,
        deadline: Math.floor(Date.now() / 1000) + 43200,
        status: TaskStatus.Completed,
        completedNodes: 3,
        consensusType: ConsensusType.Majority,
        resultHash: '0xresult123456789012345678901234567890abcdef1234567890abcdef12345678',
      },
    ];

    let filtered = mockTasks;

    if (filter?.status !== undefined) {
      filtered = filtered.filter((t) => t.status === filter.status);
    }

    if (filter?.requester) {
      filtered = filtered.filter(
        (t) => t.requester.toLowerCase() === filter.requester!.toLowerCase()
      );
    }

    if (filter?.offset) {
      filtered = filtered.slice(filter.offset);
    }

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  async getTask(taskId: number): Promise<Task | null> {
    const tasks = await this.getTasks();
    return tasks.find((t) => t.id === taskId) || null;
  }

  async getTaskCount(): Promise<number> {
    return 156; // Mock total task count
  }

  async getConsensusStatus(taskId: number): Promise<ConsensusStatus> {
    return {
      reached: taskId === 3,
      resultHash: taskId === 3 ? '0xresult123...' : '',
      submittedCount: taskId === 2 ? 2 : taskId === 3 ? 3 : 0,
      requiredCount: 3,
    };
  }

  async getTaskNodes(taskId: number): Promise<string[]> {
    if (taskId === 2) {
      return [
        '0xNode1Address1234567890abcdef1234567890ab',
        '0xNode2Address1234567890abcdef1234567890ab',
      ];
    }
    if (taskId === 3) {
      return [
        '0xNode1Address1234567890abcdef1234567890ab',
        '0xNode2Address1234567890abcdef1234567890ab',
        '0xNode3Address1234567890abcdef1234567890ab',
      ];
    }
    return [];
  }

  // Node Operations
  async claimTask(taskId: number): Promise<{ hash: string }> {
    console.log('Claiming task:', taskId);
    // Mock transaction
    return { hash: '0xtx...' };
  }

  async submitResult(taskId: number, resultHash: string): Promise<{ hash: string }> {
    console.log('Submitting result for task:', taskId, 'hash:', resultHash);
    return { hash: '0xtx...' };
  }

  async submitResultWithData(
    taskId: number,
    resultData: Buffer | string
  ): Promise<{ tx: { hash: string }; resultCid: string; resultHash: string }> {
    console.log('Submitting result with data for task:', taskId);
    return {
      tx: { hash: '0xtx...' },
      resultCid: 'QmResult...',
      resultHash: '0xresulthash...',
    };
  }

  // Researcher Operations
  async submitTask(options: {
    modelHash: string;
    inputHash: string;
    rewardPerNode: bigint;
    requiredNodes: number;
    deadline: number;
    consensusType?: ConsensusType;
  }): Promise<{ taskId: number; tx: { hash: string } }> {
    console.log('Submitting task:', options);
    return { taskId: 4, tx: { hash: '0xtx...' } };
  }

  async submitTaskWithData(
    modelData: Buffer | string,
    inputData: Buffer | string,
    rewardPerNode: bigint,
    requiredNodes: number,
    deadline: number,
    consensusType?: ConsensusType
  ): Promise<{ taskId: number; tx: { hash: string }; modelCid: string; inputCid: string }> {
    console.log('Submitting task with data');
    return {
      taskId: 4,
      tx: { hash: '0xtx...' },
      modelCid: 'QmModel...',
      inputCid: 'QmInput...',
    };
  }

  async cancelTask(taskId: number): Promise<{ hash: string }> {
    console.log('Cancelling task:', taskId);
    return { hash: '0xtx...' };
  }

  // Crowdfunding
  async fundTask(taskId: number, amount: bigint): Promise<{ hash: string }> {
    console.log('Funding task:', taskId, 'amount:', amount.toString());
    return { hash: '0xtx...' };
  }

  // Balance & Tokens
  async getBalance(address: string): Promise<Balance> {
    return {
      eth: BigInt('1500000000000000000'), // 1.5 ETH
      comp: BigInt('10000000000000000000000'), // 10,000 COMP
      gov: BigInt('500000000000000000000'), // 500 GOV
    };
  }

  async approveTaskRegistry(amount: bigint): Promise<{ hash: string }> {
    console.log('Approving task registry for:', amount.toString());
    return { hash: '0xtx...' };
  }

  // Network Stats
  async getActiveProviders(): Promise<string[]> {
    return [
      '0xNode1Address1234567890abcdef1234567890ab',
      '0xNode2Address1234567890abcdef1234567890ab',
      '0xNode3Address1234567890abcdef1234567890ab',
      '0xNode4Address1234567890abcdef1234567890ab',
      '0xNode5Address1234567890abcdef1234567890ab',
    ];
  }

  async isNodeActive(nodeAddress: string): Promise<boolean> {
    return true;
  }

  // IPFS Operations
  async uploadToIPFS(data: Buffer | string): Promise<string> {
    console.log('Uploading to IPFS');
    return 'QmMockCID...';
  }

  async downloadFromIPFS(cid: string): Promise<Buffer> {
    console.log('Downloading from IPFS:', cid);
    return Buffer.from('mock data');
  }

  getIPFSUrl(cid: string): string {
    return `${IPFS_CONFIG.gateway}${cid}`;
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
  const { data: walletClient } = useWalletClient();

  const client = useMemo(() => {
    return new OARNClient({
      address: address,
      walletClient: walletClient,
    });
  }, [address, walletClient]);

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

export { OARNClient };
