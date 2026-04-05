'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Modal } from '@/components/ui';
import { getBatches, saveBatch, deleteBatch, generateBatchId, decodeBatchShare, type BatchRecord } from '@/lib/batch-storage';

function parsePastedIds(raw: string): number[] {
  return raw
    .split(/[\s,\n]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);
}

export default function ResultsPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [idsInput, setIdsInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [shareInput, setShareInput] = useState('');

  useEffect(() => {
    setBatches(getBatches());
  }, []);

  function refresh() {
    setBatches(getBatches());
  }

  function handleCreate() {
    const ids = parsePastedIds(idsInput);
    if (ids.length === 0) return;
    const batch: BatchRecord = {
      id: generateBatchId(),
      name: batchName.trim() || `Batch ${new Date().toLocaleDateString()}`,
      taskIds: ids,
      createdAt: Date.now(),
    };
    saveBatch(batch);
    setShowCreate(false);
    setBatchName('');
    setIdsInput('');
    refresh();
    router.push(`/researcher/results/${batch.id}`);
  }

  function handleDelete(id: string) {
    deleteBatch(id);
    refresh();
  }

  function handleImportShare() {
    const ids = decodeBatchShare(shareInput.trim());
    if (ids.length === 0) return;
    const batch: BatchRecord = {
      id: generateBatchId(),
      name: `Shared Batch (${ids.length} tasks)`,
      taskIds: ids,
      createdAt: Date.now(),
    };
    saveBatch(batch);
    setImporting(false);
    setShareInput('');
    refresh();
    router.push(`/researcher/results/${batch.id}`);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Batch Results</h1>
          <p className="text-text-muted mt-1">Heatmap, CSV export, and shareable links for task sweeps</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImporting(true)}>
            Import Share Link
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + New Batch
          </Button>
        </div>
      </div>

      {/* Batch List */}
      {batches.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-text mb-2">No batches yet</h3>
            <p className="text-text-muted mb-6 max-w-sm mx-auto">
              Create a batch by pasting a list of task IDs from a parameter sweep.
            </p>
            <Button onClick={() => setShowCreate(true)}>Create Your First Batch</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <Card key={batch.id} variant="interactive" className="group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text truncate">{batch.name}</h3>
                  <p className="text-sm text-text-muted mt-0.5">
                    {batch.taskIds.length} task{batch.taskIds.length !== 1 ? 's' : ''} &middot; {new Date(batch.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(batch.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-error p-1 rounded"
                  title="Delete batch"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
                <span>Tasks: {batch.taskIds[0]}{batch.taskIds.length > 1 ? ` – ${batch.taskIds[batch.taskIds.length - 1]}` : ''}</span>
              </div>

              <Link href={`/researcher/results/${batch.id}`}>
                <Button variant="secondary" size="sm" className="w-full">View Results</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Batch"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Batch Name</label>
            <input
              className="w-full bg-background-light border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Temperature sweep run 1"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Task IDs</label>
            <textarea
              className="w-full bg-background-light border border-border rounded-lg px-3 py-2 text-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={5}
              placeholder="Paste task IDs separated by spaces, commas, or newlines&#10;e.g. 42 43 44 45 46"
              value={idsInput}
              onChange={(e) => setIdsInput(e.target.value)}
            />
            {idsInput && (
              <p className="text-xs text-text-muted mt-1">
                {parsePastedIds(idsInput).length} valid ID{parsePastedIds(idsInput).length !== 1 ? 's' : ''} detected
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={parsePastedIds(idsInput).length === 0}
              onClick={handleCreate}
            >
              Create & View
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Share Link Modal */}
      <Modal
        isOpen={importing}
        onClose={() => setImporting(false)}
        title="Import Shared Batch"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Paste a share token from another researcher to load their batch.
          </p>
          <input
            className="w-full bg-background-light border border-border rounded-lg px-3 py-2 text-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Paste share token..."
            value={shareInput}
            onChange={(e) => setShareInput(e.target.value)}
          />
          {shareInput && (
            <p className="text-xs text-text-muted">
              {decodeBatchShare(shareInput.trim()).length} tasks found in token
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setImporting(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={decodeBatchShare(shareInput.trim()).length === 0}
              onClick={handleImportShare}
            >
              Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
