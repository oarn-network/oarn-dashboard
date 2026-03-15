'use client';

import { useState, useRef } from 'react';
import { Button, Input, Select, Card, Badge } from '@/components/ui';
import { BatchParameterGrid } from './BatchParameterGrid';
import { ConsensusType, CONSENSUS_TYPE_LABELS } from '@/lib/constants';
import { formatEth } from '@/lib/formatters';

interface BatchTaskSubmitFormProps {
  onSubmit: (data: BatchTaskFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface BatchTaskFormData {
  modelFile: File | null;
  baseInputFile: File | null;
  parameterGrid: Record<string, unknown>[];
  rewardPerNode: string;
  requiredNodes: number;
  deadlineHours: number;
  consensusType: ConsensusType;
  parallelBatches: number;
}

export function BatchTaskSubmitForm({ onSubmit, isLoading = false }: BatchTaskSubmitFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<BatchTaskFormData>({
    modelFile: null,
    baseInputFile: null,
    parameterGrid: [],
    rewardPerNode: '0.01',
    requiredNodes: 3,
    deadlineHours: 48,
    consensusType: ConsensusType.Majority,
    parallelBatches: 100,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BatchTaskFormData, string>>>({});
  const modelInputRef = useRef<HTMLInputElement>(null);
  const inputInputRef = useRef<HTMLInputElement>(null);

  const handleGridGenerated = (combinations: Record<string, unknown>[], totalCount: number) => {
    setFormData((prev) => ({ ...prev, parameterGrid: combinations }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof BatchTaskFormData, string>> = {};
    if (!formData.modelFile) newErrors.modelFile = 'Model file is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof BatchTaskFormData, string>> = {};
    if (formData.parameterGrid.length === 0) {
      newErrors.parameterGrid = 'Generate at least one parameter combination';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as 1 | 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const totalTasks = formData.parameterGrid.length;
  const totalRewardPerTask = parseFloat(formData.rewardPerNode || '0') * formData.requiredNodes;
  const totalCost = totalRewardPerTask * totalTasks;
  const estimatedBatches = Math.ceil(totalTasks / formData.parallelBatches);

  const consensusOptions = Object.entries(CONSENSUS_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const handleFileSelect = (type: 'model' | 'input') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      [type === 'model' ? 'modelFile' : 'baseInputFile']: file,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                s === step
                  ? 'bg-gradient-primary text-white'
                  : s < step
                  ? 'bg-success text-white'
                  : 'bg-surface text-text-muted'
              }`}
            >
              {s < step ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div className={`w-16 h-0.5 mx-2 ${s < step ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload Model */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-text">Step 1: Upload Model</h3>
            <p className="text-text-muted">Upload your trained model for batch inference</p>
          </div>

          <Card padding="lg">
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
                w-full p-12 border-2 border-dashed rounded-lg transition-colors
                ${formData.modelFile ? 'border-success bg-success/10' : 'border-border hover:border-primary'}
                ${errors.modelFile ? 'border-error' : ''}
              `}
            >
              {formData.modelFile ? (
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-success mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-lg text-text font-medium">{formData.modelFile.name}</p>
                  <p className="text-sm text-text-muted mt-1">
                    {(formData.modelFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg text-text-muted">Click to upload model file</p>
                  <p className="text-sm text-text-muted mt-1">.onnx, .pt, .pth, .h5, .pb</p>
                </div>
              )}
            </button>
            {errors.modelFile && <p className="mt-3 text-sm text-error text-center">{errors.modelFile}</p>}
          </Card>

          {/* Optional: Base input template */}
          <Card>
            <h4 className="text-sm font-medium text-text mb-3">Base Input Template (Optional)</h4>
            <p className="text-xs text-text-muted mb-3">
              Upload a base input file. Parameters from the grid will be merged into this template.
            </p>
            <input
              ref={inputInputRef}
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleFileSelect('input')}
            />
            <button
              type="button"
              onClick={() => inputInputRef.current?.click()}
              className={`
                w-full p-4 border border-dashed rounded-lg transition-colors text-sm
                ${formData.baseInputFile ? 'border-success bg-success/10' : 'border-border hover:border-primary'}
              `}
            >
              {formData.baseInputFile ? (
                <span className="text-success">{formData.baseInputFile.name}</span>
              ) : (
                <span className="text-text-muted">Click to upload base input (JSON)</span>
              )}
            </button>
          </Card>
        </div>
      )}

      {/* Step 2: Parameter Grid */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-text">Step 2: Define Parameter Grid</h3>
            <p className="text-text-muted">Configure parameters for parallel testing across 10,000+ combinations</p>
          </div>

          <BatchParameterGrid onGridGenerated={handleGridGenerated} />

          {errors.parameterGrid && (
            <p className="text-sm text-error text-center">{errors.parameterGrid}</p>
          )}
        </div>
      )}

      {/* Step 3: Execution Settings */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-text">Step 3: Execution Settings</h3>
            <p className="text-text-muted">Configure rewards and parallel execution</p>
          </div>

          {/* Grid Preview */}
          <Card className="bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Parameter Combinations</p>
                <p className="text-3xl font-bold gradient-text">{totalTasks.toLocaleString()}</p>
              </div>
              <Badge variant="success" size="sm">Grid Generated</Badge>
            </div>
          </Card>

          {/* Execution Parameters */}
          <Card>
            <h4 className="text-sm font-medium text-text mb-4">Task Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Reward per Node (ETH)"
                type="number"
                step="0.001"
                min="0.001"
                value={formData.rewardPerNode}
                onChange={(e) => setFormData((prev) => ({ ...prev, rewardPerNode: e.target.value }))}
                rightAddon={<span className="text-xs">ETH</span>}
                hint="Per node, per task"
              />

              <Input
                label="Required Nodes per Task"
                type="number"
                min="1"
                max="10"
                value={formData.requiredNodes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, requiredNodes: parseInt(e.target.value) || 1 }))
                }
                hint="Nodes for consensus"
              />

              <Input
                label="Deadline (Hours)"
                type="number"
                min="1"
                max="720"
                value={formData.deadlineHours}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deadlineHours: parseInt(e.target.value) || 48 }))
                }
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

          {/* Parallel Execution */}
          <Card>
            <h4 className="text-sm font-medium text-text mb-4">Parallel Execution</h4>
            <Input
              label="Tasks per Batch"
              type="number"
              min="10"
              max="1000"
              value={formData.parallelBatches}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, parallelBatches: parseInt(e.target.value) || 100 }))
              }
              hint={`${estimatedBatches} batches will be submitted sequentially`}
            />
            <div className="mt-4 p-4 bg-background-light rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-text">{totalTasks.toLocaleString()}</p>
                  <p className="text-xs text-text-muted">Total Tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{formData.parallelBatches}</p>
                  <p className="text-xs text-text-muted">Per Batch</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{estimatedBatches}</p>
                  <p className="text-xs text-text-muted">Batches</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Cost Summary */}
          <Card className="bg-warning/5 border-warning/20">
            <h4 className="text-sm font-medium text-text mb-4">Cost Summary</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Reward per task</span>
                <span className="text-text">{totalRewardPerTask.toFixed(4)} ETH × {totalTasks.toLocaleString()} tasks</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-medium text-text">Total Cost</span>
                <span className="text-2xl font-bold gradient-text">{totalCost.toFixed(4)} ETH</span>
              </div>
            </div>
            {totalCost > 10 && (
              <p className="text-xs text-warning mt-3">
                Large batch detected. Ensure you have sufficient ETH balance.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={step === 1}
        >
          Back
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button type="submit" isLoading={isLoading}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Submit {totalTasks.toLocaleString()} Tasks
          </Button>
        )}
      </div>
    </form>
  );
}
