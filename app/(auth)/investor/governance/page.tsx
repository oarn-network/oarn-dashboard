'use client';

import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { formatAddress } from '@/lib/formatters';
import { CONTRACT_ADDRESSES, ProposalState, PROPOSAL_STATE_LABELS } from '@/lib/constants';
import {
  useGovernanceProposals,
  useVotingPower,
  useHasVoted,
  useCastVote,
  useDelegateGov,
  type GovernanceProposal,
} from '@/hooks/useGovernance';

// ── Proposal state → badge variant mapping ────────────────────────

const STATE_BADGE: Record<ProposalState, { variant: 'accent' | 'success' | 'error' | 'warning'; label: string }> = {
  [ProposalState.Pending]:   { variant: 'warning', label: 'Pending' },
  [ProposalState.Active]:    { variant: 'accent',  label: 'Active' },
  [ProposalState.Canceled]:  { variant: 'error',   label: 'Canceled' },
  [ProposalState.Defeated]:  { variant: 'error',   label: 'Defeated' },
  [ProposalState.Succeeded]: { variant: 'success', label: 'Succeeded' },
  [ProposalState.Queued]:    { variant: 'warning', label: 'Queued' },
  [ProposalState.Expired]:   { variant: 'error',   label: 'Expired' },
  [ProposalState.Executed]:  { variant: 'success', label: 'Executed' },
};

// ── Govenance not yet deployed banner ─────────────────────────────

function NotDeployedBanner() {
  return (
    <Card className="border border-warning/40 bg-warning/5">
      <div className="flex items-start gap-3">
        <span className="text-warning text-lg">⚠</span>
        <div>
          <p className="text-sm font-medium text-text">Governance Contract Not Yet Deployed</p>
          <p className="text-xs text-text-muted mt-1">
            The DAO governance contract is being activated on Arbitrum Sepolia. Once deployed,
            live proposals and voting will appear here.
          </p>
          <p className="text-xs text-text-muted mt-1 font-mono">
            Deploy: <code>npx hardhat run scripts/deploy-governance.ts --network arbitrumSepolia</code>
          </p>
        </div>
      </div>
    </Card>
  );
}

// ── Vote button group ─────────────────────────────────────────────

function VoteButtons({ proposal }: { proposal: GovernanceProposal }) {
  const { data: hasVoted } = useHasVoted(proposal.idBigInt);
  const { mutate: castVote, isPending } = useCastVote();
  const [voted, setVoted] = useState(false);

  if (hasVoted || voted) {
    return <p className="text-xs text-text-muted text-center">You have voted on this proposal.</p>;
  }

  const vote = (support: 0 | 1 | 2) => {
    castVote({ proposalId: proposal.idBigInt, support }, { onSuccess: () => setVoted(true) });
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" className="flex-1" onClick={() => vote(1)} disabled={isPending}>Vote For</Button>
      <Button size="sm" variant="secondary" className="flex-1" onClick={() => vote(0)} disabled={isPending}>Vote Against</Button>
      <Button size="sm" variant="secondary" onClick={() => vote(2)} disabled={isPending}>Abstain</Button>
    </div>
  );
}

// ── Proposal card ─────────────────────────────────────────────────

function ProposalCard({ proposal }: { proposal: GovernanceProposal }) {
  const isActive = proposal.state === ProposalState.Active;
  const quorumGov = 4_000_000; // 4% of 100M
  const totalVotesNum = Number(proposal.totalVotes) / 1e18;
  const quorumPercent = Math.min(Math.round((totalVotesNum / quorumGov) * 100), 100);
  const quorumReached = totalVotesNum >= quorumGov;
  const { variant, label } = STATE_BADGE[proposal.state] ?? STATE_BADGE[ProposalState.Pending];

  return (
    <Card>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left – info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-sm font-mono text-primary">#{proposal.id.slice(0, 8)}…</span>
            <Badge variant={variant} size="sm">{label}</Badge>
            {quorumReached && <Badge variant="success" size="sm">Quorum Reached</Badge>}
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">{proposal.title}</h3>
          <p className="text-sm text-text-muted mb-3 line-clamp-2">{proposal.description.split('\n')[0]}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span>Proposed by {formatAddress(proposal.proposer)}</span>
            <span>•</span>
            <span>Voting block: {proposal.startBlock.toString()}–{proposal.endBlock.toString()}</span>
          </div>
        </div>

        {/* Right – votes */}
        <div className="lg:w-72 lg:flex-shrink-0">
          <div className="space-y-2 mb-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-success">For</span>
                <span className="text-text">
                  {(Number(proposal.forVotes) / 1e18).toLocaleString('en', { maximumFractionDigits: 0 })} ({proposal.forPercent}%)
                </span>
              </div>
              <div className="h-2 bg-background-light rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${proposal.forPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-error">Against</span>
                <span className="text-text">
                  {(Number(proposal.againstVotes) / 1e18).toLocaleString('en', { maximumFractionDigits: 0 })} ({100 - proposal.forPercent}%)
                </span>
              </div>
              <div className="h-2 bg-background-light rounded-full overflow-hidden">
                <div className="h-full bg-error" style={{ width: `${100 - proposal.forPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Quorum */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-muted">Quorum (4M GOV needed)</span>
              <span className={quorumReached ? 'text-success' : 'text-text'}>{quorumPercent}%</span>
            </div>
            <div className="h-1.5 bg-background-light rounded-full overflow-hidden">
              <div
                className={`h-full ${quorumReached ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${quorumPercent}%` }}
              />
            </div>
          </div>

          {isActive && <VoteButtons proposal={proposal} />}
        </div>
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function GovernancePage() {
  const { data: proposals = [], isLoading } = useGovernanceProposals();
  const { data: votingPower } = useVotingPower();
  const { mutate: delegate, isPending: isDelegating } = useDelegateGov();


  const governanceDeployed = CONTRACT_ADDRESSES.GOVERNANCE !== '';

  const activeProposals = proposals.filter((p) =>
    p.state === ProposalState.Active || p.state === ProposalState.Pending,
  );
  const pastProposals = proposals.filter((p) =>
    p.state !== ProposalState.Active && p.state !== ProposalState.Pending,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Governance</h1>
          <p className="text-text-muted mt-1">Participate in OARN network governance with GOV tokens</p>
        </div>
        <Card padding="sm" className="flex items-center gap-4">
          <div>
            <p className="text-xs text-text-muted">Your Voting Power</p>
            <p className="text-lg font-bold text-text">
              {votingPower?.formattedVotes ?? '0'} GOV
            </p>
          </div>
          {votingPower && !votingPower.isDelegated && (
            <Button size="sm" onClick={() => delegate()} disabled={isDelegating}>
              {isDelegating ? 'Delegating…' : 'Activate'}
            </Button>
          )}
          {votingPower?.isDelegated && (
            <span className="text-xs text-success">Active</span>
          )}
        </Card>
      </div>

      {/* Not-deployed banner */}
      {!governanceDeployed && <NotDeployedBanner />}

      {/* Voting power hint */}
      {votingPower && !votingPower.isDelegated && votingPower.votes > BigInt(0) && (
        <Card className="border border-accent/30 bg-accent/5">
          <p className="text-sm text-text">
            You hold GOV tokens but have not activated voting. Click <strong>Activate</strong> to delegate to yourself and enable voting.
          </p>
        </Card>
      )}

      {/* Active proposals */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Active Proposals</h2>
        <div className="space-y-4">
          {isLoading && (
            <Card className="text-center py-8">
              <p className="text-text-muted">Loading proposals…</p>
            </Card>
          )}
          {!isLoading && activeProposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
          {!isLoading && activeProposals.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-text-muted">
                {governanceDeployed ? 'No active proposals' : 'Governance not yet deployed'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Past proposals */}
      {pastProposals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">Past Proposals</h2>
          <div className="space-y-4">
            {pastProposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <Card className="bg-background-elevated">
        <h3 className="font-semibold text-text mb-2">How Governance Works</h3>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• Hold GOV tokens and click <strong>Activate</strong> to enable voting power</li>
          <li>• 1,000 GOV required to create a proposal</li>
          <li>• Proposals wait 1 day before voting opens</li>
          <li>• Voting period: 1 week</li>
          <li>• Quorum: 4% of total supply (4,000,000 GOV)</li>
          <li>• Passing: simple majority of cast votes</li>
        </ul>
      </Card>
    </div>
  );
}
