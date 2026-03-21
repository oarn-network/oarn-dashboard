'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { useOARNClient } from '@/providers/OARNClientProvider';
import type { WetLabConsensus } from '@/providers/OARNClientProvider';
import { formatEth } from '@/lib/formatters';

export default function WetLabPage() {
  const { client, isConnected, address } = useOARNClient();

  // Lookup verified result
  const [lookupTaskId, setLookupTaskId] = useState('');
  const [verifiedResult, setVerifiedResult] = useState<WetLabConsensus | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string>();

  // Submit wet lab result
  const [submitTaskId, setSubmitTaskId] = useState('');
  const [parametersHash, setParametersHash] = useState('');
  const [measuredValue, setMeasuredValue] = useState('');
  const [metric, setMetric] = useState('');
  const [submitError, setSubmitError] = useState<string>();
  const [submitSuccess, setSubmitSuccess] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // Pending rewards
  const [pendingRewards, setPendingRewards] = useState<bigint | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const handleLookup = async () => {
    if (!client || !lookupTaskId) return;
    setLookupLoading(true);
    setLookupError(undefined);
    setVerifiedResult(null);
    try {
      const result = await client.getVerifiedWetLabResult(Number(lookupTaskId));
      if (result.verifiedAt === 0) {
        setLookupError('No verified result on-chain yet for this task.');
      } else {
        setVerifiedResult(result);
      }
    } catch {
      setLookupError('No verified result found. Task may not exist or labs have not submitted yet.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setSubmitError(undefined);
    setSubmitSuccess(undefined);

    if (!submitTaskId || isNaN(Number(submitTaskId))) {
      setSubmitError('Invalid task ID');
      return;
    }
    if (!parametersHash.startsWith('0x') || parametersHash.length !== 66) {
      setSubmitError('Parameters hash must be a 32-byte hex string (0x + 64 hex chars)');
      return;
    }
    const value = parseFloat(measuredValue);
    if (isNaN(value)) {
      setSubmitError('Measured value must be a number');
      return;
    }
    if (!metric.trim()) {
      setSubmitError('Metric name is required');
      return;
    }

    setSubmitting(true);
    try {
      // Scale by 1e6 to preserve 6 decimal places
      const scaledValue = BigInt(Math.round(value * 1_000_000));
      const tx = await client.submitWetLabResult(
        Number(submitTaskId),
        parametersHash,
        scaledValue,
        metric.trim()
      );
      setSubmitSuccess(`Result submitted! Tx hash: ${tx.hash}`);
      setSubmitTaskId('');
      setParametersHash('');
      setMeasuredValue('');
      setMetric('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transaction failed';
      setSubmitError(msg.toLowerCase().includes('user rejected') ? 'Transaction rejected.' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckRewards = async () => {
    if (!client || !address) return;
    setLoadingRewards(true);
    try {
      const rewards = await client.getWetLabPendingRewards(address);
      setPendingRewards(rewards);
    } catch {
      setPendingRewards(BigInt(0));
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!client) return;
    setClaiming(true);
    setClaimSuccess(false);
    try {
      await client.claimWetLabReward();
      setClaimSuccess(true);
      setPendingRewards(BigInt(0));
    } catch {
      // silent — user rejected or not certified lab
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">WetLab Oracle</h1>
        <p className="text-text-muted mt-1">
          Submit physical experiment results on-chain and close the AI prediction loop.
        </p>
      </div>

      {/* Info banner */}
      <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-accent/20 rounded-lg flex-shrink-0">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">Closed-Loop Scientific Discovery</h3>
            <p className="text-sm text-text-muted mt-1">
              The WetLabOracle contract (<span className="font-mono text-xs">0xF8991A56...0094</span>) lets
              certified labs anchor physical experiment results to Arbitrum Sepolia. Multiple labs confirm
              each measurement — consensus on reality, not just computation.
            </p>
            <p className="text-xs text-text-muted mt-2">
              Contract:{' '}
              <a
                href="https://sepolia.arbiscan.io/address/0xF8991A56cB5B9073a3eEC87E95Dfb055fdDF0094"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-mono"
              >
                0xF8991A56cB5B9073a3eEC87E95Dfb055fdDF0094
              </a>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-8">
          {/* Lookup verified result */}
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Verified Result Lookup</h2>
            <p className="text-sm text-text-muted mb-4">
              Check whether a task has reached wet lab consensus on-chain.
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="Task ID (e.g. 42)"
                value={lookupTaskId}
                onChange={(e) => setLookupTaskId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleLookup} isLoading={lookupLoading} disabled={!isConnected || !lookupTaskId}>
                Lookup
              </Button>
            </div>

            {lookupError && (
              <p className="mt-3 text-sm text-error">{lookupError}</p>
            )}

            {verifiedResult && (
              <div className="mt-4 space-y-3 p-4 bg-background-light rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-sm font-semibold text-success">Consensus reached</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Task ID</span>
                    <span className="font-mono text-text">#{verifiedResult.taskId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Agreed Hash</span>
                    <span className="font-mono text-xs text-text truncate max-w-[200px]">
                      {verifiedResult.agreedHash.slice(0, 10)}...{verifiedResult.agreedHash.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Confirming Labs</span>
                    <span className="text-text">{verifiedResult.confirmingLabCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Verified At</span>
                    <span className="text-text">
                      {verifiedResult.verifiedAt > 0
                        ? new Date(verifiedResult.verifiedAt * 1000).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                </div>
                {verifiedResult.confirmingLabs.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Labs:</p>
                    {verifiedResult.confirmingLabs.map((lab) => (
                      <p key={lab} className="text-xs font-mono text-text-muted truncate">
                        {lab}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Pending rewards */}
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Lab Verification Rewards</h2>
            <p className="text-sm text-text-muted mb-4">
              Certified labs earn COMP rewards for each verified result submission.
            </p>
            <Button
              variant="secondary"
              onClick={handleCheckRewards}
              isLoading={loadingRewards}
              disabled={!isConnected}
              className="w-full mb-3"
            >
              Check Pending Rewards
            </Button>

            {pendingRewards !== null && (
              <div className="p-4 bg-background-light rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Pending Rewards</span>
                  <span className="text-lg font-bold text-text">{formatEth(pendingRewards)} COMP</span>
                </div>
                {pendingRewards > BigInt(0) ? (
                  <Button
                    onClick={handleClaimRewards}
                    isLoading={claiming}
                    className="w-full"
                  >
                    Claim Rewards
                  </Button>
                ) : (
                  <p className="text-xs text-text-muted text-center">No rewards to claim yet.</p>
                )}
                {claimSuccess && (
                  <p className="text-sm text-success text-center">Rewards claimed successfully!</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right column — Submit result */}
        <Card>
          <h2 className="text-lg font-semibold text-text mb-2">Submit Wet Lab Result</h2>
          <p className="text-sm text-text-muted mb-4">
            Certified labs only. Submit your physical measurement to validate an AI prediction on-chain.
          </p>

          <form onSubmit={handleSubmitResult} className="space-y-4">
            <Input
              label="Task ID"
              placeholder="e.g. 42"
              value={submitTaskId}
              onChange={(e) => setSubmitTaskId(e.target.value)}
              hint="The OARN task this result corresponds to"
            />

            <Input
              label="Parameters Hash"
              placeholder="0x..."
              value={parametersHash}
              onChange={(e) => setParametersHash(e.target.value)}
              hint="keccak256 hash of the parameter set you tested (32 bytes)"
            />

            <Input
              label="Measured Value"
              placeholder="e.g. 0.604800"
              value={measuredValue}
              onChange={(e) => setMeasuredValue(e.target.value)}
              hint="Numeric result (will be scaled ×1,000,000 on-chain)"
            />

            <Input
              label="Metric Name"
              placeholder="e.g. yield, binding_affinity, ic50"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              hint="Must match the metric used in the compute prediction"
            />

            {submitError && (
              <p className="text-sm text-error">{submitError}</p>
            )}

            {submitSuccess && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success break-all">{submitSuccess}</p>
              </div>
            )}

            <Card className="bg-warning/5 border-warning/20">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-text-muted">
                  Only certified lab addresses can submit. Your wallet must be certified by the oracle
                  owner. Consensus requires{' '}
                  <span className="text-text font-medium">multiple labs</span> to submit matching
                  results.
                </p>
              </div>
            </Card>

            <Button
              type="submit"
              className="w-full"
              isLoading={submitting}
              disabled={!isConnected}
            >
              Submit Result On-Chain
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
