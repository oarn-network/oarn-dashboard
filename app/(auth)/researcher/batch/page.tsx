'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, useToast } from '@/components/ui';
import { BatchTaskSubmitForm, type BatchTaskFormData } from '@/components/forms';
import { useOARNClient } from '@/hooks';

export default function BatchSubmitPage() {
  const router = useRouter();
  const { client, isConnected } = useOARNClient();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleSubmit = async (data: BatchTaskFormData) => {
    if (!client || !isConnected) {
      addToast({
        type: 'error',
        title: 'Not Connected',
        message: 'Please connect your wallet to submit tasks',
      });
      return;
    }

    setIsSubmitting(true);
    const totalTasks = data.parameterGrid.length;
    const batchSize = data.parallelBatches;
    const batches = Math.ceil(totalTasks / batchSize);

    setProgress({ current: 0, total: batches });

    try {
      // In a real implementation, this would:
      // 1. Upload model to IPFS once
      // 2. Create input manifests for each batch
      // 3. Call client.submitBatchTaskFromGrid() for each batch

      for (let i = 0; i < batches; i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min((i + 1) * batchSize, totalTasks);
        const batchParams = data.parameterGrid.slice(batchStart, batchEnd);

        // Mock batch submission

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setProgress({ current: i + 1, total: batches });
      }

      addToast({
        type: 'success',
        title: 'Batch Tasks Submitted',
        message: `Successfully submitted ${totalTasks.toLocaleString()} tasks in ${batches} batches`,
      });

      router.push('/researcher/tasks');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Batch Submission Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Batch Task Submission</h1>
        <p className="text-text-muted mt-1">
          Submit thousands of parallel inference tasks with parameter grid sweeps
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-accent/5 border-accent/20">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-text">Parallel Processing at Scale</h3>
            <p className="text-sm text-text-muted mt-1">
              OARN distributed network can process 10,000+ parameter combinations in parallel.
              Define your hyperparameter grid, and nodes will execute each combination independently
              with consensus verification.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-text-muted">Hyperparameter sweeps</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-text-muted">A/B testing at scale</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-text-muted">Monte Carlo simulations</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-text-muted">Grid search optimization</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Overlay */}
      {isSubmitting && progress.total > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <div className="text-center">
            <p className="text-sm text-text-muted mb-2">Submitting batches...</p>
            <div className="h-2 bg-background-light rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-lg font-bold text-text">
              {progress.current} / {progress.total} batches
            </p>
          </div>
        </Card>
      )}

      {/* Batch Submit Form */}
      <BatchTaskSubmitForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
