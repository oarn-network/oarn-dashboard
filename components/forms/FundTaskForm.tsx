'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { formatEth } from '@/lib/formatters';
import type { Task } from '@/providers/OARNClientProvider';

interface FundTaskFormProps {
  task: Task;
  onSubmit: (amount: string) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function FundTaskForm({ task, onSubmit, isLoading = false, onCancel }: FundTaskFormProps) {
  const [amount, setAmount] = useState('0.1');
  const [error, setError] = useState<string>();

  const totalRequired = BigInt(task.rewardPerNode) * BigInt(task.requiredNodes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setError(undefined);
    await onSubmit(amount);
  };

  const presetAmounts = ['0.01', '0.05', '0.1', '0.5', '1'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Task Info */}
      <div className="p-4 bg-background-light rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Task ID</span>
          <span className="text-sm font-medium text-text">#{task.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Reward per Node</span>
          <span className="text-sm font-medium text-text">{formatEth(task.rewardPerNode)} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Required Nodes</span>
          <span className="text-sm font-medium text-text">{task.requiredNodes}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-text-muted">Total Required</span>
          <span className="text-sm font-bold text-text">{formatEth(totalRequired)} ETH</span>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <Input
          label="Funding Amount (ETH)"
          type="number"
          step="0.001"
          min="0.001"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(undefined);
          }}
          error={error}
          rightAddon={<span className="text-xs">ETH</span>}
        />

        {/* Preset amounts */}
        <div className="flex flex-wrap gap-2 mt-3">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={`
                px-3 py-1.5 text-sm rounded-lg border transition-colors
                ${
                  amount === preset
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface border-border text-text-muted hover:border-primary'
                }
              `}
            >
              {preset} ETH
            </button>
          ))}
        </div>
      </div>

      {/* Contribution Preview */}
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Your Contribution</span>
          <span className="text-lg font-bold gradient-text">{amount || '0'} ETH</span>
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
          Fund Task
        </Button>
      </div>
    </form>
  );
}
