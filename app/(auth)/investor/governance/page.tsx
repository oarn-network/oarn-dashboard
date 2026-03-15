'use client';

import { Card, Button, Badge } from '@/components/ui';
import { formatAddress, formatRelativeTime } from '@/lib/formatters';

// Mock governance data
const proposals = [
  {
    id: 'OIP-12',
    title: 'Increase node reward rate by 10%',
    description: 'This proposal aims to increase the base reward rate for node operators by 10% to attract more compute providers to the network.',
    proposer: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bEfA',
    status: 'active',
    votesFor: 125000,
    votesAgainst: 48000,
    totalVotes: 173000,
    quorum: 200000,
    endTime: Math.floor(Date.now() / 1000) + 86400 * 3,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 4,
  },
  {
    id: 'OIP-11',
    title: 'Add PyTorch 2.0 support',
    description: 'Enable native PyTorch 2.0 model support with TorchScript and torch.compile optimizations.',
    proposer: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    status: 'active',
    votesFor: 189000,
    votesAgainst: 23000,
    totalVotes: 212000,
    quorum: 200000,
    endTime: Math.floor(Date.now() / 1000) + 86400 * 1,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 6,
  },
  {
    id: 'OIP-10',
    title: 'Reduce minimum stake requirement',
    description: 'Lower the minimum stake requirement from 1000 COMP to 500 COMP to increase node participation.',
    proposer: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    status: 'passed',
    votesFor: 245000,
    votesAgainst: 67000,
    totalVotes: 312000,
    quorum: 200000,
    endTime: Math.floor(Date.now() / 1000) - 86400 * 2,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 9,
  },
  {
    id: 'OIP-9',
    title: 'Treasury allocation for marketing',
    description: 'Allocate 50,000 COMP from treasury for marketing and developer outreach initiatives.',
    proposer: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bEfA',
    status: 'rejected',
    votesFor: 89000,
    votesAgainst: 156000,
    totalVotes: 245000,
    quorum: 200000,
    endTime: Math.floor(Date.now() / 1000) - 86400 * 10,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 17,
  },
];

export default function GovernancePage() {
  const activeProposals = proposals.filter((p) => p.status === 'active');
  const pastProposals = proposals.filter((p) => p.status !== 'active');

  // Mock user's voting power
  const votingPower = 1500;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Governance</h1>
          <p className="text-text-muted mt-1">Participate in OARN network governance</p>
        </div>
        <Card padding="sm" className="flex items-center gap-4">
          <div>
            <p className="text-xs text-text-muted">Your Voting Power</p>
            <p className="text-lg font-bold text-text">{votingPower.toLocaleString()} GOV</p>
          </div>
          <Button size="sm">Delegate</Button>
        </Card>
      </div>

      {/* Active Proposals */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Active Proposals</h2>
        <div className="space-y-4">
          {activeProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
          {activeProposals.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-text-muted">No active proposals</p>
            </Card>
          )}
        </div>
      </div>

      {/* Past Proposals */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Past Proposals</h2>
        <div className="space-y-4">
          {pastProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: string;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  endTime: number;
  createdAt: number;
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const forPercentage = proposal.totalVotes > 0
    ? Math.round((proposal.votesFor / proposal.totalVotes) * 100)
    : 0;

  const quorumPercentage = Math.round((proposal.totalVotes / proposal.quorum) * 100);
  const quorumReached = proposal.totalVotes >= proposal.quorum;

  const statusConfig: Record<string, { variant: 'accent' | 'success' | 'error'; label: string }> = {
    active: { variant: 'accent', label: 'Active' },
    passed: { variant: 'success', label: 'Passed' },
    rejected: { variant: 'error', label: 'Rejected' },
  };

  const { variant, label } = statusConfig[proposal.status] || statusConfig.active;

  const now = Math.floor(Date.now() / 1000);
  const isActive = proposal.status === 'active';
  const timeRemaining = proposal.endTime - now;
  const daysRemaining = Math.floor(timeRemaining / 86400);
  const hoursRemaining = Math.floor((timeRemaining % 86400) / 3600);

  return (
    <Card>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left - Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-primary">{proposal.id}</span>
            <Badge variant={variant} size="sm">{label}</Badge>
            {quorumReached && (
              <Badge variant="success" size="sm">Quorum Reached</Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">{proposal.title}</h3>
          <p className="text-sm text-text-muted mb-3">{proposal.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
            <span>Proposed by {formatAddress(proposal.proposer)}</span>
            <span>•</span>
            <span>Created {formatRelativeTime(proposal.createdAt)}</span>
            {isActive && (
              <>
                <span>•</span>
                <span className="text-warning">
                  {daysRemaining > 0 ? `${daysRemaining}d ` : ''}
                  {hoursRemaining}h remaining
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right - Votes */}
        <div className="lg:w-72 lg:flex-shrink-0">
          {/* Vote bars */}
          <div className="space-y-2 mb-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-success">For</span>
                <span className="text-text">{(proposal.votesFor / 1000).toFixed(0)}K ({forPercentage}%)</span>
              </div>
              <div className="h-2 bg-background-light rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${forPercentage}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-error">Against</span>
                <span className="text-text">{(proposal.votesAgainst / 1000).toFixed(0)}K ({100 - forPercentage}%)</span>
              </div>
              <div className="h-2 bg-background-light rounded-full overflow-hidden">
                <div className="h-full bg-error" style={{ width: `${100 - forPercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Quorum progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-muted">Quorum Progress</span>
              <span className={quorumReached ? 'text-success' : 'text-text'}>
                {quorumPercentage}%
              </span>
            </div>
            <div className="h-1.5 bg-background-light rounded-full overflow-hidden">
              <div
                className={`h-full ${quorumReached ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${Math.min(quorumPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Vote buttons */}
          {isActive && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">Vote For</Button>
              <Button size="sm" variant="secondary" className="flex-1">Vote Against</Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
