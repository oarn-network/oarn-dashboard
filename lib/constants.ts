// Contract addresses for Arbitrum Sepolia (Chain ID: 421614)
export const CONTRACT_ADDRESSES = {
  OARN_REGISTRY: '0x8DD738DBBD4A8484872F84192D011De766Ba5458',
  TASK_REGISTRY: '0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0',
  COMP_TOKEN: '0x24249A523A251E38CB0001daBd54DD44Ea8f1838',
  GOV_TOKEN: '0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3',
  GOVERNANCE: '0x56D2826FF4FaEF8d4Db54eF11e86d0421fc2893B' as string,
} as const;

// Chain configuration
export const ARBITRUM_SEPOLIA = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  network: 'arbitrum-sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
    public: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
  },
  testnet: true,
} as const;

// IPFS configuration
export const IPFS_CONFIG = {
  gateway: 'https://ipfs.io/ipfs/',
  apiUrl: 'http://127.0.0.1:5001/api/v0',
} as const;

// Task statuses — values match on-chain TaskRegistryV2 enum
export enum TaskStatus {
  Pending = 0,
  Active = 1,
  Consensus = 2,
  Completed = 3,
  Disputed = 4,
  Cancelled = 5,
  Expired = 6,
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: 'Pending',
  [TaskStatus.Active]: 'Active',
  [TaskStatus.Consensus]: 'Consensus',
  [TaskStatus.Completed]: 'Completed',
  [TaskStatus.Disputed]: 'Disputed',
  [TaskStatus.Cancelled]: 'Cancelled',
  [TaskStatus.Expired]: 'Expired',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: 'warning',
  [TaskStatus.Active]: 'accent',
  [TaskStatus.Consensus]: 'accent',
  [TaskStatus.Completed]: 'success',
  [TaskStatus.Disputed]: 'error',
  [TaskStatus.Cancelled]: 'error',
  [TaskStatus.Expired]: 'error',
};

// Consensus types — values match on-chain enum
export enum ConsensusType {
  Majority = 0,
  SuperMajority = 1,
  Unanimous = 2,
}

export const CONSENSUS_TYPE_LABELS: Record<ConsensusType, string> = {
  [ConsensusType.Majority]: 'Majority',
  [ConsensusType.SuperMajority]: 'Super Majority',
  [ConsensusType.Unanimous]: 'Unanimous',
};

// Governance — ProposalState values match OpenZeppelin Governor
export enum ProposalState {
  Pending = 0,   // waiting for voting delay
  Active = 1,    // voting open
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

export const PROPOSAL_STATE_LABELS: Record<ProposalState, string> = {
  [ProposalState.Pending]: 'Pending',
  [ProposalState.Active]: 'Active',
  [ProposalState.Canceled]: 'Canceled',
  [ProposalState.Defeated]: 'Defeated',
  [ProposalState.Succeeded]: 'Succeeded',
  [ProposalState.Queued]: 'Queued',
  [ProposalState.Expired]: 'Expired',
  [ProposalState.Executed]: 'Executed',
};

// Model frameworks
export const MODEL_FRAMEWORKS = ['ONNX', 'PyTorch', 'TensorFlow'] as const;
export type ModelFramework = typeof MODEL_FRAMEWORKS[number];

// Role definitions
export const ROLES = {
  NODE_OPERATOR: {
    id: 'node-operator',
    label: 'Node Operator',
    description: 'Run compute tasks and earn COMP tokens',
    icon: 'Server',
    path: '/node-operator',
  },
  RESEARCHER: {
    id: 'researcher',
    label: 'Researcher',
    description: 'Submit AI inference tasks to the network',
    icon: 'FlaskConical',
    path: '/researcher',
  },
  CROWDFUNDER: {
    id: 'crowdfunder',
    label: 'Crowdfunder',
    description: 'Fund research tasks and support projects',
    icon: 'Heart',
    path: '/crowdfunder',
  },
  INVESTOR: {
    id: 'investor',
    label: 'Investor',
    description: 'View network analytics and governance',
    icon: 'TrendingUp',
    path: '/investor',
  },
} as const;

export type RoleId = keyof typeof ROLES;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Deploy block for TaskRegistryV2 (used as fromBlock in getLogs calls)
export const TASK_REGISTRY_DEPLOY_BLOCK = BigInt(0); // TODO: set to actual deploy block

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  TASKS: 30_000, // 30 seconds
  BALANCE: 60_000, // 1 minute
  NETWORK_STATS: 120_000, // 2 minutes
} as const;
