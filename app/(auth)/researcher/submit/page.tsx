'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, useToast } from '@/components/ui';
import { TaskSubmitForm, type TaskFormData } from '@/components/forms';
import { useOARNClient } from '@/hooks';

export default function SubmitTaskPage() {
  const router = useRouter();
  const { client, isConnected } = useOARNClient();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: TaskFormData) => {
    if (!client || !isConnected) {
      addToast({
        type: 'error',
        title: 'Not Connected',
        message: 'Please connect your wallet to submit tasks',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would:
      // 1. Upload model and input files to IPFS
      // 2. Call client.submitTaskWithData()

      const deadlineTimestamp = Math.floor(Date.now() / 1000) + data.deadlineHours * 3600;
      const rewardPerNode = BigInt(Math.floor(parseFloat(data.rewardPerNode) * 1e18));

      const baseOptions = {
        modelHash: '0x' + '0'.repeat(64), // Placeholder — real impl uploads to IPFS first
        inputHash: '0x' + '0'.repeat(64), // Placeholder
        rewardPerNode,
        requiredNodes: data.requiredNodes,
        deadline: deadlineTimestamp,
        consensusType: data.consensusType,
      };

      const result = data.continuous
        ? await client.submitContinuousTask({
            ...baseOptions,
            maxRounds: data.maxRounds,
            maxSpendWei: BigInt(Math.floor(parseFloat(data.maxSpendEth) * 1e18)),
          })
        : await client.submitTask(baseOptions);

      addToast({
        type: 'success',
        title: 'Task Submitted',
        message: `Task #${result.taskId} has been created`,
      });

      router.push(`/researcher/tasks/${result.taskId}`);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Submit New Task</h1>
        <p className="text-text-muted mt-1">
          Upload your model and input data to run inference on the OARN network
        </p>
      </div>

      {/* Instructions */}
      <Card className="bg-primary/5 border-primary/20">
        <h3 className="text-sm font-medium text-text mb-2">How it works</h3>
        <ol className="text-sm text-text-muted space-y-2 list-decimal list-inside">
          <li>Upload your trained model file (ONNX, PyTorch, or TensorFlow)</li>
          <li>Upload your input data file (JSON, NumPy, or binary)</li>
          <li>Set the reward per node and number of required nodes</li>
          <li>Submit the task and pay the total reward</li>
          <li>Nodes will claim and process your task</li>
          <li>Once consensus is reached, download your results</li>
        </ol>
      </Card>

      {/* Submit Form */}
      <TaskSubmitForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
