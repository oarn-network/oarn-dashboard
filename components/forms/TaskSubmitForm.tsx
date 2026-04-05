'use client';

import { useState, useRef } from 'react';
import { Button, Input, Select, Card } from '@/components/ui';
import { ConsensusType, CONSENSUS_TYPE_LABELS } from '@/lib/constants';
import { parseEth } from '@/lib/formatters';

interface TaskSubmitFormProps {
  onSubmit: (data: TaskFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface TaskFormData {
  modelFile: File | null;
  inputFile: File | null;
  rewardPerNode: string;
  requiredNodes: number;
  deadlineHours: number;
  consensusType: ConsensusType;
  continuous: boolean;
  maxRounds: number;
  maxSpendEth: string;
}

export function TaskSubmitForm({ onSubmit, isLoading = false }: TaskSubmitFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    modelFile: null,
    inputFile: null,
    rewardPerNode: '0.1',
    requiredNodes: 3,
    deadlineHours: 72,
    consensusType: ConsensusType.Majority,
    continuous: false,
    maxRounds: 5,
    maxSpendEth: '1.0',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const modelInputRef = useRef<HTMLInputElement>(null);
  const inputInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.modelFile) {
      newErrors.modelFile = 'Model file is required';
    }

    if (!formData.inputFile) {
      newErrors.inputFile = 'Input file is required';
    }

    const reward = parseFloat(formData.rewardPerNode);
    if (isNaN(reward) || reward <= 0) {
      newErrors.rewardPerNode = 'Reward must be greater than 0';
    }

    if (formData.requiredNodes < 1 || formData.requiredNodes > 100) {
      newErrors.requiredNodes = 'Required nodes must be between 1 and 100';
    }

    if (formData.deadlineHours < 1 || formData.deadlineHours > 720) {
      newErrors.deadlineHours = 'Deadline must be between 1 hour and 30 days';
    }

    if (formData.continuous) {
      if (formData.maxRounds < 2 || formData.maxRounds > 100) {
        newErrors.maxRounds = 'Max rounds must be between 2 and 100';
      }
      const maxSpend = parseFloat(formData.maxSpendEth);
      if (isNaN(maxSpend) || maxSpend <= 0) {
        newErrors.maxSpendEth = 'Max spend must be greater than 0';
      } else if (maxSpend < parseFloat(formData.rewardPerNode || '0') * formData.requiredNodes) {
        newErrors.maxSpendEth = 'Max spend must cover at least one round';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleFileSelect = (type: 'model' | 'input') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      [type === 'model' ? 'modelFile' : 'inputFile']: file,
    }));
    setErrors((prev) => ({
      ...prev,
      [type === 'model' ? 'modelFile' : 'inputFile']: undefined,
    }));
  };

  const totalReward = parseFloat(formData.rewardPerNode || '0') * formData.requiredNodes;

  const consensusOptions = Object.entries(CONSENSUS_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md">
          <h4 className="text-sm font-medium text-text mb-3">Model File</h4>
          <input
            ref={modelInputRef}
            type="file"
            className="hidden"
            accept=".onnx,.pt,.pth,.h5,.pb"
            onChange={handleFileSelect('model')}
          />
          <button
            type="button"
            onClick={() => modelInputRef.current?.click()}
            className={`
              w-full p-6 border-2 border-dashed rounded-lg transition-colors
              ${formData.modelFile ? 'border-success bg-success/10' : 'border-border hover:border-primary'}
              ${errors.modelFile ? 'border-error' : ''}
            `}
          >
            {formData.modelFile ? (
              <div className="text-center">
                <svg
                  className="w-8 h-8 mx-auto text-success mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-text font-medium">{formData.modelFile.name}</p>
                <p className="text-xs text-text-muted mt-1">
                  {(formData.modelFile.size / 1024 / 1024).toFixed(2)} MB
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
                <p className="text-sm text-text-muted">Click to upload model file</p>
                <p className="text-xs text-text-muted mt-1">.onnx, .pt, .pth, .h5, .pb</p>
              </div>
            )}
          </button>
          {errors.modelFile && <p className="mt-2 text-sm text-error">{errors.modelFile}</p>}
        </Card>

        <Card padding="md">
          <h4 className="text-sm font-medium text-text mb-3">Input File</h4>
          <input
            ref={inputInputRef}
            type="file"
            className="hidden"
            accept=".json,.npy,.npz,.bin,.csv"
            onChange={handleFileSelect('input')}
          />
          <button
            type="button"
            onClick={() => inputInputRef.current?.click()}
            className={`
              w-full p-6 border-2 border-dashed rounded-lg transition-colors
              ${formData.inputFile ? 'border-success bg-success/10' : 'border-border hover:border-primary'}
              ${errors.inputFile ? 'border-error' : ''}
            `}
          >
            {formData.inputFile ? (
              <div className="text-center">
                <svg
                  className="w-8 h-8 mx-auto text-success mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-text font-medium">{formData.inputFile.name}</p>
                <p className="text-xs text-text-muted mt-1">
                  {(formData.inputFile.size / 1024).toFixed(2)} KB
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
                <p className="text-sm text-text-muted">Click to upload input file</p>
                <p className="text-xs text-text-muted mt-1">.json, .npy, .npz, .bin, .csv</p>
              </div>
            )}
          </button>
          {errors.inputFile && <p className="mt-2 text-sm text-error">{errors.inputFile}</p>}
        </Card>
      </div>

      {/* Task Parameters */}
      <Card>
        <h4 className="text-sm font-medium text-text mb-4">Task Parameters</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Reward per Node (ETH)"
            type="number"
            step="0.01"
            min="0.001"
            value={formData.rewardPerNode}
            onChange={(e) => setFormData((prev) => ({ ...prev, rewardPerNode: e.target.value }))}
            error={errors.rewardPerNode}
            rightAddon={<span className="text-xs">ETH</span>}
          />

          <Input
            label="Required Nodes"
            type="number"
            min="1"
            max="100"
            value={formData.requiredNodes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, requiredNodes: parseInt(e.target.value) || 1 }))
            }
            error={errors.requiredNodes}
            hint="Number of nodes required to reach consensus"
          />

          <Input
            label="Deadline (Hours)"
            type="number"
            min="1"
            max="720"
            value={formData.deadlineHours}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, deadlineHours: parseInt(e.target.value) || 24 }))
            }
            error={errors.deadlineHours}
            hint="Task will expire after this time"
          />

          <Select
            label="Consensus Type"
            options={consensusOptions}
            value={formData.consensusType.toString()}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                consensusType: parseInt(e.target.value) as ConsensusType,
              }))
            }
          />
        </div>
      </Card>

      {/* Continuous Mode */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-medium text-text">Continuous Mode</h4>
            <p className="text-xs text-text-muted mt-0.5">Automatically re-run this task for multiple rounds</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={formData.continuous}
            onClick={() => setFormData((prev) => ({ ...prev, continuous: !prev.continuous }))}
            className={`
              relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors focus:outline-none
              ${formData.continuous ? 'bg-primary' : 'bg-border'}
            `}
          >
            <span
              className={`
                inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform
                ${formData.continuous ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
        {formData.continuous && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
            <Input
              label="Max Rounds"
              type="number"
              min="2"
              max="100"
              value={formData.maxRounds}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, maxRounds: parseInt(e.target.value) || 2 }))
              }
              error={errors.maxRounds}
              hint="Total number of rounds to allow (2–100)"
            />
            <Input
              label="Max Total Spend (ETH)"
              type="number"
              step="0.01"
              min="0.001"
              value={formData.maxSpendEth}
              onChange={(e) => setFormData((prev) => ({ ...prev, maxSpendEth: e.target.value }))}
              error={errors.maxSpendEth}
              rightAddon={<span className="text-xs">ETH</span>}
              hint="Hard cap on total ETH spent across all rounds"
            />
          </div>
        )}
      </Card>

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <h4 className="text-sm font-medium text-text mb-3">Cost Summary</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">
              {formData.rewardPerNode} ETH × {formData.requiredNodes} nodes
              {formData.continuous && ` × up to ${formData.maxRounds} rounds`}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Deadline: {formData.deadlineHours} hours from submission
            </p>
            {formData.continuous && (
              <p className="text-xs text-text-muted mt-1">
                Max spend cap: {formData.maxSpendEth} ETH
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">{totalReward.toFixed(4)} ETH</p>
            <p className="text-xs text-text-muted">{formData.continuous ? 'Per Round' : 'Total Cost'}</p>
          </div>
        </div>
      </Card>

      {/* Submit */}
      <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
        {formData.continuous ? 'Submit Continuous Task' : 'Submit Task'}
      </Button>
    </form>
  );
}
