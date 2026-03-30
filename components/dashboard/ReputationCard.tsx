'use client';

import { Card } from '@/components/ui';

interface ReputationData {
  reputationScore: number;
  tier: string;
  consensusMatchRate: number;
  submissionRate: number;
  tasksCompleted: number;
  tasksClaimed: number;
}

interface ReputationCardProps {
  data: ReputationData | null | undefined;
  isLoading?: boolean;
}

const TIER_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  New:      { color: 'text-text-muted',  bg: 'bg-text-muted/10',  label: 'New Node' },
  Bronze:   { color: 'text-amber-600',   bg: 'bg-amber-600/10',   label: 'Bronze' },
  Silver:   { color: 'text-slate-400',   bg: 'bg-slate-400/10',   label: 'Silver' },
  Gold:     { color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  label: 'Gold' },
  Platinum: { color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    label: 'Platinum' },
};

function ScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color =
    score >= 90 ? '#22d3ee' :
    score >= 70 ? '#facc15' :
    score >= 45 ? '#94a3b8' :
    score >= 20 ? '#d97706' : '#6b7280';

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-lg font-bold text-text">{score}</span>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="font-medium text-text">{value}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ReputationCard({ data, isLoading }: ReputationCardProps) {
  const tierStyle = TIER_STYLES[data?.tier ?? 'New'] ?? TIER_STYLES['New'];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text">Reputation Score</h3>
        {data && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierStyle.color} ${tierStyle.bg}`}>
            {tierStyle.label}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-text-muted">Connect wallet to view reputation</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={data.reputationScore} />
            <div className="flex-1 space-y-3">
              <MetricBar label="Consensus Rate" value={data.consensusMatchRate} color="#22d3ee" />
              <MetricBar label="Submission Rate" value={data.submissionRate} color="#a78bfa" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-text-muted">Tasks Done</p>
              <p className="text-lg font-bold text-text">{data.tasksCompleted}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-muted">Tasks Claimed</p>
              <p className="text-lg font-bold text-text">{data.tasksClaimed}</p>
            </div>
          </div>

          {data.consensusMatchRate >= 95 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
              <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs text-cyan-400">Eligible for 1.2× COMP multiplier</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
