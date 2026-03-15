'use client';

import { useState, useRef } from 'react';
import { Button, Input, Card } from '@/components/ui';
import type { Task } from '@/providers/OARNClientProvider';

interface SubmitResultFormProps {
  task: Task;
  onSubmit: (data: { resultHash?: string; resultFile?: File }) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function SubmitResultForm({ task, onSubmit, isLoading = false, onCancel }: SubmitResultFormProps) {
  const [submitType, setSubmitType] = useState<'hash' | 'file'>('file');
  const [resultHash, setResultHash] = useState('');
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitType === 'hash') {
      if (!resultHash || !resultHash.startsWith('0x') || resultHash.length !== 66) {
        setError('Invalid result hash. Must be a 32-byte hex string (0x...)');
        return;
      }
      await onSubmit({ resultHash });
    } else {
      if (!resultFile) {
        setError('Please select a result file');
        return;
      }
      await onSubmit({ resultFile });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Task Info */}
      <div className="p-4 bg-background-light rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Task ID</span>
          <span className="text-sm font-medium text-text">#{task.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Model Hash</span>
          <span className="text-xs font-mono text-text truncate max-w-[200px]">
            {task.modelHash.slice(0, 10)}...{task.modelHash.slice(-8)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Input Hash</span>
          <span className="text-xs font-mono text-text truncate max-w-[200px]">
            {task.inputHash.slice(0, 10)}...{task.inputHash.slice(-8)}
          </span>
        </div>
      </div>

      {/* Submit Type Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSubmitType('file')}
          className={`
            flex-1 py-2 px-4 rounded-lg border transition-colors text-sm font-medium
            ${
              submitType === 'file'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface border-border text-text-muted hover:border-primary'
            }
          `}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setSubmitType('hash')}
          className={`
            flex-1 py-2 px-4 rounded-lg border transition-colors text-sm font-medium
            ${
              submitType === 'hash'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface border-border text-text-muted hover:border-primary'
            }
          `}
        >
          Enter Hash
        </button>
      </div>

      {/* File Upload or Hash Input */}
      {submitType === 'file' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".json,.bin,.npy,.npz"
            onChange={(e) => {
              setResultFile(e.target.files?.[0] || null);
              setError(undefined);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`
              w-full p-6 border-2 border-dashed rounded-lg transition-colors
              ${resultFile ? 'border-success bg-success/10' : 'border-border hover:border-primary'}
              ${error ? 'border-error' : ''}
            `}
          >
            {resultFile ? (
              <div className="text-center">
                <svg
                  className="w-8 h-8 mx-auto text-success mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-text font-medium">{resultFile.name}</p>
                <p className="text-xs text-text-muted mt-1">
                  {(resultFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <svg
                  className="w-8 h-8 mx-auto text-text-muted mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-text-muted">Click to upload result file</p>
                <p className="text-xs text-text-muted mt-1">.json, .bin, .npy, .npz</p>
              </div>
            )}
          </button>
        </div>
      ) : (
        <Input
          label="Result Hash"
          placeholder="0x..."
          value={resultHash}
          onChange={(e) => {
            setResultHash(e.target.value);
            setError(undefined);
          }}
          error={error}
          hint="Enter the keccak256 hash of your computation result"
        />
      )}

      {error && submitType === 'file' && <p className="text-sm text-error">{error}</p>}

      {/* Warning */}
      <Card className="bg-warning/5 border-warning/20">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-warning flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm text-warning font-medium">Important</p>
            <p className="text-xs text-text-muted mt-1">
              Ensure your result matches the expected output for this task. Submitting incorrect
              results may affect your reputation score.
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          Submit Result
        </Button>
      </div>
    </form>
  );
}
