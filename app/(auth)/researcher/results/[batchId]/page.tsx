'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Modal, Spinner } from '@/components/ui';
import { useBatchResults, computeBatchMetrics, generateCSV, type TaskResult } from '@/hooks/useBatchResults';
import { getBatch, saveBatch, encodeBatchShare, type BatchRecord } from '@/lib/batch-storage';
import { TaskStatus, TASK_STATUS_LABELS } from '@/lib/constants';
import { formatEth, formatHash } from '@/lib/formatters';

// ── Heatmap cell helpers ─────────────────────────────────────────────────────

function cellColor(r: TaskResult): string {
  if (r.status === TaskStatus.Completed && r.reached) return 'bg-success/80 border-success/40';
  if (r.status === TaskStatus.Completed && !r.reached) return 'bg-warning/60 border-warning/40';
  if (r.status === TaskStatus.Disputed) return 'bg-error/60 border-error/40';
  if (r.status === TaskStatus.Cancelled || r.status === TaskStatus.Expired) return 'bg-surface border-border';
  if (r.status === TaskStatus.Active || r.status === TaskStatus.Consensus) return 'bg-primary/30 border-primary/30';
  return 'bg-background-light border-border';
}

function cellLabel(r: TaskResult): string {
  if (r.status === TaskStatus.Completed && r.reached) return 'Consensus';
  if (r.status === TaskStatus.Completed && !r.reached) return 'No consensus';
  return TASK_STATUS_LABELS[r.status];
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = use(params);
  const router = useRouter();

  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showFork, setShowFork] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskResult | null>(null);

  useEffect(() => {
    const b = getBatch(batchId);
    setBatch(b);
    setNameInput(b?.name ?? '');
  }, [batchId]);

  const { data: results = [], isLoading } = useBatchResults(batch?.taskIds ?? []);
  const metrics = computeBatchMetrics(results);

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleRenameSave() {
    if (!batch || !nameInput.trim()) return;
    const updated = { ...batch, name: nameInput.trim() };
    saveBatch(updated);
    setBatch(updated);
    setEditingName(false);
  }

  function handleDownloadCSV() {
    const csv = generateCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch?.name ?? 'batch'}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const shareToken = batch ? encodeBatchShare(batch.taskIds) : '';

  function handleCopyToken() {
    navigator.clipboard.writeText(shareToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFork() {
    if (!results.length) return;
    const first = results[0];
    const url = `/researcher/submit?modelHash=${first.modelHash}&inputHash=${first.inputHash}&nodes=${first.requiredNodes}&fromBatch=${batchId}`;
    router.push(url);
  }

  // ── Loading / not found ────────────────────────────────────────────────────

  if (!batch) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-text mb-2">Batch Not Found</h2>
        <p className="text-text-muted mb-4">This batch does not exist or was deleted.</p>
        <Link href="/researcher/results"><Button>Back to Results</Button></Link>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/researcher/results">
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </Link>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="bg-background-light border border-border rounded-lg px-3 py-1.5 text-text font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); if (e.key === 'Escape') setEditingName(false); }}
              />
              <Button size="sm" onClick={handleRenameSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancel</Button>
            </div>
          ) : (
            <button
              className="text-2xl font-bold text-text hover:text-primary transition-colors text-left"
              onClick={() => setEditingName(true)}
              title="Click to rename"
            >
              {batch.name}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setShowFork(true)}>
            Fork Sweep
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowShare(true)}>
            Share
          </Button>
          <Button size="sm" onClick={handleDownloadCSV} disabled={results.length === 0}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-text">{metrics.total}</div>
          <div className="text-xs text-text-muted mt-1">Total Tasks</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-success">{metrics.consensusReached}</div>
          <div className="text-xs text-text-muted mt-1">Consensus</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-warning">{metrics.pending}</div>
          <div className="text-xs text-text-muted mt-1">Pending</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-error">{metrics.disputed}</div>
          <div className="text-xs text-text-muted mt-1">Disputed</div>
        </Card>
      </div>

      {/* Progress bar */}
      {metrics.total > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-text-muted">Overall progress</span>
            <span className="text-text font-medium">
              {metrics.completed} / {metrics.total} completed ({Math.round(metrics.completed / metrics.total * 100)}%)
            </span>
          </div>
          <div className="h-2 bg-background-light rounded-full overflow-hidden flex">
            <div className="bg-success transition-all duration-500" style={{ width: `${metrics.total > 0 ? (metrics.consensusReached / metrics.total) * 100 : 0}%` }} />
            <div className="bg-warning/70 transition-all duration-500" style={{ width: `${metrics.total > 0 ? ((metrics.completed - metrics.consensusReached) / metrics.total) * 100 : 0}%` }} />
            <div className="bg-primary/50 transition-all duration-500" style={{ width: `${metrics.total > 0 ? (metrics.pending / metrics.total) * 100 : 0}%` }} />
            <div className="bg-error/60 transition-all duration-500" style={{ width: `${metrics.total > 0 ? (metrics.disputed / metrics.total) * 100 : 0}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-text-muted flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-success inline-block" />Consensus</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-warning/70 inline-block" />No consensus</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/50 inline-block" />Pending</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-error/60 inline-block" />Disputed</span>
          </div>
        </Card>
      )}

      {/* Heatmap */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Result Heatmap</h2>
          <span className="text-sm text-text-muted">{batch.taskIds.length} tasks</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-text-muted">No results loaded</div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid gap-1.5 min-w-0"
              style={{ gridTemplateColumns: `repeat(${Math.min(results.length, 20)}, minmax(2.5rem, 1fr))` }}
            >
              {results.map((r) => (
                <button
                  key={r.taskId}
                  title={`Task #${r.taskId} — ${cellLabel(r)}\nConsensus: ${r.reached ? 'Yes' : 'No'}\nAgreeing: ${r.agreeingNodes}/${r.totalSubmissions}`}
                  className={`h-10 rounded border text-xs font-mono font-medium transition-all hover:scale-110 hover:z-10 hover:shadow-glow ${cellColor(r)}`}
                  onClick={() => setSelectedTask(r)}
                >
                  #{r.taskId}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid too wide: show as table instead */}
        {results.length > 20 && !isLoading && (
          <p className="text-xs text-text-muted mt-3">
            Showing all {results.length} tasks in grid — click any cell for details.
          </p>
        )}
      </Card>

      {/* Results Table */}
      {results.length > 0 && (
        <Card padding="none">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text">Task Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-light">
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Task ID</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Consensus</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Agreement</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Unique Results</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Result Hash</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={r.taskId}
                    className={`border-b border-border last:border-0 hover:bg-surface transition-colors ${i % 2 === 0 ? '' : 'bg-background-light/30'}`}
                  >
                    <td className="px-4 py-3 font-mono text-text font-medium">#{r.taskId}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          r.status === TaskStatus.Completed ? 'success'
                            : r.status === TaskStatus.Active ? 'primary'
                            : r.status === TaskStatus.Disputed ? 'error'
                            : 'default'
                        }
                        size="sm"
                      >
                        {TASK_STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {r.totalSubmissions > 0 ? (
                        <span className={r.reached ? 'text-success font-medium' : 'text-warning'}>
                          {r.reached ? 'Reached' : 'No'}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text">
                      {r.totalSubmissions > 0
                        ? `${r.agreeingNodes} / ${r.totalSubmissions}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.totalSubmissions > 0 ? (
                        <span className={r.uniqueResults > 1 ? 'text-warning' : 'text-text-muted'}>
                          {r.uniqueResults}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                      {r.consensusHash && r.consensusHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'
                        ? formatHash(r.consensusHash, 8)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/researcher/tasks/${r.taskId}`}
                        className="text-primary hover:text-primary-light text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={`Task #${selectedTask?.taskId} — Details`}
      >
        {selectedTask && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Status</span>
              <Badge
                variant={selectedTask.reached ? 'success' : selectedTask.status === TaskStatus.Disputed ? 'error' : 'default'}
                size="sm"
              >
                {cellLabel(selectedTask)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Agreeing nodes</span>
              <span className="text-text font-medium">{selectedTask.agreeingNodes} / {selectedTask.totalSubmissions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Unique results</span>
              <span className={selectedTask.uniqueResults > 1 ? 'text-warning font-medium' : 'text-text'}>{selectedTask.uniqueResults}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Reward / node</span>
              <span className="text-text">{formatEth(selectedTask.rewardPerNode)} ETH</span>
            </div>
            {selectedTask.consensusHash && selectedTask.consensusHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
              <div>
                <p className="text-text-muted mb-1">Consensus Hash</p>
                <code className="block p-2 bg-background-light rounded text-xs font-mono break-all text-text">
                  {selectedTask.consensusHash}
                </code>
              </div>
            )}
            <div className="pt-2">
              <Link href={`/researcher/tasks/${selectedTask.taskId}`}>
                <Button size="sm" variant="secondary" className="w-full">Open Task Detail</Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShare} onClose={() => setShowShare(false)} title="Share Batch">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Share this token with other researchers. They can import it on the Results page to load the same batch.
          </p>
          <div>
            <label className="block text-xs text-text-muted mb-1">Share Token</label>
            <div className="flex gap-2">
              <input
                readOnly
                className="flex-1 bg-background-light border border-border rounded-lg px-3 py-2 text-text text-xs font-mono focus:outline-none"
                value={shareToken}
              />
              <Button size="sm" variant="secondary" onClick={handleCopyToken}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Token encodes {batch.taskIds.length} task ID{batch.taskIds.length !== 1 ? 's' : ''}.
            On-chain data is always fetched live.
          </p>
        </div>
      </Modal>

      {/* Fork Modal */}
      <Modal isOpen={showFork} onClose={() => setShowFork(false)} title="Fork This Sweep">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Create a new batch task submission using the same model and parameters as this sweep.
          </p>
          {results.length > 0 ? (
            <>
              <div className="bg-background-light rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Model Hash</span>
                  <code className="text-text text-xs font-mono">{formatHash(results[0].modelHash, 8)}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Required Nodes</span>
                  <span className="text-text">{results[0].requiredNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Tasks in original batch</span>
                  <span className="text-text">{batch.taskIds.length}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowFork(false)}>Cancel</Button>
                <Button className="flex-1" onClick={() => { setShowFork(false); handleFork(); }}>
                  Open Submit Form
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-warning">Load results first to fork this sweep.</p>
          )}
        </div>
      </Modal>

    </div>
  );
}
