/**
 * Batch metadata storage (localStorage).
 * On-chain data (results, consensus) is always fetched live.
 */

export interface BatchRecord {
  id: string;
  name: string;
  taskIds: number[];
  createdAt: number; // unix ms
  modelHash?: string;
}

const KEY = 'oarn:batches';

function load(): BatchRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(batches: BatchRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(batches));
}

export function getBatches(): BatchRecord[] {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function getBatch(id: string): BatchRecord | null {
  return load().find((b) => b.id === id) ?? null;
}

export function saveBatch(batch: BatchRecord): void {
  const batches = load().filter((b) => b.id !== batch.id);
  batches.push(batch);
  save(batches);
}

export function deleteBatch(id: string): void {
  save(load().filter((b) => b.id !== id));
}

export function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Encode task IDs for shareable URL (base64) */
export function encodeBatchShare(taskIds: number[]): string {
  return btoa(taskIds.join(','));
}

/** Decode shareable URL param back to task IDs */
export function decodeBatchShare(encoded: string): number[] {
  try {
    return atob(encoded)
      .split(',')
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
  } catch {
    return [];
  }
}
