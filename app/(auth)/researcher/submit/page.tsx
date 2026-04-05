'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, useToast } from '@/components/ui';
import { TaskSubmitForm, type TaskFormData } from '@/components/forms';
import { useOARNClient, useCompPaymentInfo, useSubmitTaskWithCOMP } from '@/hooks';
import { ConsensusType } from '@/lib/constants';

export default function SubmitTaskPage() {
  const router = useRouter();
  const { client, isConnected } = useOARNClient();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useComp, setUseComp] = useState(false);
  const { data: compInfo } = useCompPaymentInfo();
  const submitWithComp = useSubmitTaskWithCOMP();

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
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + data.deadlineHours * 3600;
      const rewardPerNode = BigInt(Math.floor(parseFloat(data.rewardPerNode) * 1e18));

      const modelHash = ('0x' + '0'.repeat(64)) as `0x${string}`; // Placeholder — real impl uploads to IPFS first
      const inputHash = ('0x' + '0'.repeat(64)) as `0x${string}`; // Placeholder

      if (useComp && compInfo?.enabled) {
        // #126 — COMP payment path
        await submitWithComp.mutateAsync({
          modelHash,
          inputHash,
          modelRequirements: '',
          rewardPerNode,
          requiredNodes: data.requiredNodes,
          deadline: deadlineTimestamp,
          consensusType: data.consensusType ?? ConsensusType.Majority,
        });
        addToast({ type: 'success', title: 'Task Submitted with COMP', message: `COMP approved and task created` });
        router.push('/researcher/tasks');
        return;
      }

      const baseOptions = {
        modelHash,
        inputHash,
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

      {/* COMP Payment Toggle */}
      {compInfo?.enabled && (
        <Card className="bg-accent/5 border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text">Pay with COMP</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Save {(compInfo.discountBps / 100).toFixed(0)}% — pay node rewards in COMP instead of ETH.
                Nodes receive COMP, you save {(compInfo.discountBps / 100).toFixed(0)}% on the total cost.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseComp((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${useComp ? 'bg-accent' : 'bg-surface border border-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${useComp ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          {useComp && (
            <p className="text-xs text-accent mt-2">
              COMP mode active — reward amount is in COMP wei. Two wallet confirmations required: approve + submit.
            </p>
          )}
        </Card>
      )}

      {/* Submit Form */}
      <TaskSubmitForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
