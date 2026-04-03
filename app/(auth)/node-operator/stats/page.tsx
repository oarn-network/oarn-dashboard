'use client';

import { Card } from '@/components/ui';
import { StatCard, StatGrid, ReputationCard } from '@/components/dashboard';
import { useNodeLeaderboard, useNodeReputation } from '@/hooks';
import { useOARNClient } from '@/providers/OARNClientProvider';
import { formatEth } from '@/lib/formatters';

const TIER_ORDER = ['Platinum', 'Gold', 'Silver', 'Bronze', 'New'];

function tierBadge(tier: string) {
  const styles: Record<string, string> = {
    Platinum: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    Gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Silver: 'bg-slate-400/10 text-slate-400 border-slate-400/30',
    Bronze: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    New: 'bg-surface text-text-muted border-border',
  };
  const emoji: Record<string, string> = {
    Platinum: '💎',
    Gold: '🥇',
    Silver: '🥈',
    Bronze: '🥉',
    New: '▫️',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${styles[tier] ?? styles['New']}`}
    >
      {emoji[tier] ?? ''} {tier}
    </span>
  );
}

function rankBadge(rank: number) {
  if (rank === 1) return <span className="text-yellow-400 font-bold text-base">🥇</span>;
  if (rank === 2) return <span className="text-slate-400 font-bold text-base">🥈</span>;
  if (rank === 3) return <span className="text-orange-400 font-bold text-base">🥉</span>;
  return <span className="text-sm text-text-muted font-medium">#{rank}</span>;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function ProgressBar({ value, max = 100, color = 'bg-primary' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
      <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function OperatorStatsPage() {
  const { address } = useOARNClient();
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useNodeLeaderboard();
  const { data: myReputation, isLoading: loadingReputation } = useNodeReputation();

  // Compute tier for leaderboard entries based on tasksCompleted
  function computeTier(tasksCompleted: number, successRate: number): string {
    const score = Math.round(
      (0.4 * (successRate / 100) + 0.3 * Math.min(tasksCompleted / 50, 1)) * 100
    );
    if (score >= 90) return 'Platinum';
    if (score >= 70) return 'Gold';
    if (score >= 45) return 'Silver';
    if (score >= 20) return 'Bronze';
    return 'New';
  }

  const myEntry = address
    ? leaderboard.find((e) => e.address.toLowerCase() === address.toLowerCase())
    : null;

  const myRank = myEntry
    ? leaderboard.findIndex((e) => e.address.toLowerCase() === address?.toLowerCase()) + 1
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Operator Stats</h1>
        <p className="text-text-muted mt-1">
          Your performance metrics and the network-wide leaderboard
        </p>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reputation Card */}
        <ReputationCard data={myReputation ?? null} isLoading={loadingReputation} />

        {/* My Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard
            title="My Rank"
            value={myRank ? `#${myRank}` : '—'}
            subtitle={`of ${leaderboard.length} operators`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <StatCard
            title="Tasks Completed"
            value={myReputation?.tasksCompleted ?? 0}
            subtitle="consensus matches"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Consensus Rate"
            value={myReputation ? `${myReputation.consensusMatchRate}%` : '—'}
            subtitle="result matches"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Earned"
            value={myReputation ? `${formatEth(myReputation.totalEarned)} ETH` : '—'}
            subtitle="testnet rewards"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* My Performance Breakdown */}
      {myReputation && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-text mb-5">Performance Breakdown</h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-muted">Consensus Match Rate</span>
                <span className="text-text font-medium">{myReputation.consensusMatchRate}%</span>
              </div>
              <ProgressBar value={myReputation.consensusMatchRate} color="bg-primary" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-muted">Submission Rate</span>
                <span className="text-text font-medium">{myReputation.submissionRate}%</span>
              </div>
              <ProgressBar value={myReputation.submissionRate} color="bg-success" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-muted">Volume Score</span>
                <span className="text-text font-medium">
                  {myReputation.tasksCompleted} / 50 tasks to max
                </span>
              </div>
              <ProgressBar value={myReputation.tasksCompleted} max={50} color="bg-cyan-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-muted">Reputation Score</span>
                <span className="text-text font-medium">{myReputation.reputationScore} / 100</span>
              </div>
              <ProgressBar
                value={myReputation.reputationScore}
                color={
                  myReputation.reputationScore >= 90 ? 'bg-cyan-400' :
                  myReputation.reputationScore >= 70 ? 'bg-yellow-400' :
                  myReputation.reputationScore >= 45 ? 'bg-slate-400' :
                  myReputation.reputationScore >= 20 ? 'bg-orange-400' : 'bg-border'
                }
              />
            </div>
          </div>

          <div className="mt-6 p-3 bg-background rounded-lg border border-border">
            <p className="text-xs text-text-muted">
              <span className="text-text font-medium">Score formula: </span>
              40% consensus rate + 30% submission rate + 30% volume (max at 50 completed tasks)
            </p>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <Card padding="none">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">Leaderboard</h2>
            <p className="text-sm text-text-muted mt-0.5">All node operators ranked by tasks completed</p>
          </div>
          {leaderboard.length > 0 && (
            <span className="text-sm text-text-muted">{leaderboard.length} operators</span>
          )}
        </div>

        {loadingLeaderboard ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-text-muted mt-3">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-text-muted/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-text-muted">No operators yet — be the first!</p>
            <a href="/node-operator/setup" className="text-sm text-primary hover:text-primary/80 mt-2 inline-block">
              Run a node →
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-text-muted uppercase tracking-wide border-b border-border">
                  <th className="text-left px-6 py-3 font-medium">Rank</th>
                  <th className="text-left px-6 py-3 font-medium">Operator</th>
                  <th className="text-left px-6 py-3 font-medium">Tier</th>
                  <th className="text-right px-6 py-3 font-medium">Tasks</th>
                  <th className="text-right px-6 py-3 font-medium">Success Rate</th>
                  <th className="text-right px-6 py-3 font-medium">Earned</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe = address && entry.address.toLowerCase() === address.toLowerCase();
                  const tier = computeTier(entry.tasksCompleted, entry.successRate);

                  return (
                    <tr
                      key={entry.address}
                      className={`border-b border-border last:border-0 transition-colors ${
                        isMe ? 'bg-primary/5' : 'hover:bg-surface/50'
                      }`}
                    >
                      <td className="px-6 py-4 w-16">
                        <div className="flex items-center justify-start">{rankBadge(rank)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-text font-mono">{shortenAddress(entry.address)}</code>
                          {isMe && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{tierBadge(tier)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-text">{entry.tasksCompleted}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-sm font-medium ${
                            entry.successRate >= 80
                              ? 'text-success'
                              : entry.successRate >= 50
                              ? 'text-warning'
                              : 'text-error'
                          }`}
                        >
                          {entry.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-text-muted font-mono">
                          {formatEth(entry.totalEarnings)} ETH
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Early Bird Banner */}
      <Card padding="lg" className="border-primary/30 bg-primary/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text">Early Bird 1.5× Multiplier active until April 30</p>
            <p className="text-sm text-text-muted mt-1">
              GOV points earned now convert to GOV tokens at mainnet TGE (Q3 2026) with a 1.5× bonus.
              The more tasks you complete now, the more tokens you earn at launch.
            </p>
          </div>
          <a href="/node-operator/setup" className="flex-shrink-0">
            <button className="text-sm px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
              Run a Node →
            </button>
          </a>
        </div>
      </Card>
    </div>
  );
}
