'use client';

import { useState } from 'react';
import { StatCard, StatGrid, TaskList, WalletBalances } from '@/components/dashboard';
import { AreaChart } from '@/components/charts';
import { Modal, useToast } from '@/components/ui';
import { SubmitResultForm } from '@/components/forms';
import {
  usePendingTasks,
  useActiveTasks,
  useClaimTask,
  useMyBalance,
  useEarningsHistory,
} from '@/hooks';
import { formatEth } from '@/lib/formatters';
import type { Task } from '@/providers/OARNClientProvider';

export default function NodeOperatorDashboard() {
  const { data: pendingTasks = [], isLoading: loadingPending } = usePendingTasks();
  const { data: activeTasks = [], isLoading: loadingActive } = useActiveTasks();
  const { data: balance, isLoading: loadingBalance } = useMyBalance();
  const { data: earningsHistory = [] } = useEarningsHistory(30);
  const { addToast } = useToast();

  const claimTaskMutation = useClaimTask();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [claimingTaskId, setClaimingTaskId] = useState<number | null>(null);

  const handleClaimTask = async (taskId: number) => {
    setClaimingTaskId(taskId);
    try {
      await claimTaskMutation.mutateAsync(taskId);
      addToast({
        type: 'success',
        title: 'Task Claimed',
        message: `Successfully claimed task #${taskId}`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Claim Task',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setClaimingTaskId(null);
    }
  };

  const handleSubmitResult = (taskId: number) => {
    const task = activeTasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowResultModal(true);
    }
  };

  const handleResultSubmit = async (data: { resultHash?: string; resultFile?: File }) => {
    // Handle result submission
    addToast({
      type: 'success',
      title: 'Result Submitted',
      message: 'Your computation result has been submitted',
    });
    setShowResultModal(false);
    setSelectedTask(null);
  };

  // Calculate stats
  const totalEarnings = balance?.comp ?? BigInt(0);
  const completedTasks = 12; // Mock
  const activeTaskCount = activeTasks.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Node Operator Dashboard</h1>
        <p className="text-text-muted mt-1">Claim tasks, submit results, and track your earnings</p>
      </div>

      {/* Stats */}
      <StatGrid>
        <StatCard
          title="Tasks Completed"
          value={completedTasks}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Active Tasks"
          value={activeTaskCount}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Earnings"
          value={`${formatEth(totalEarnings)} COMP`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Uptime"
          value="99.2%"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
      </StatGrid>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Available Tasks */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4">Available Tasks</h2>
            <TaskList
              tasks={pendingTasks}
              isLoading={loadingPending}
              emptyMessage="No available tasks at the moment"
              onClaim={handleClaimTask}
              claimingTaskId={claimingTaskId}
            />
          </div>

          {/* My Active Tasks */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4">My Active Tasks</h2>
            <TaskList
              tasks={activeTasks}
              isLoading={loadingActive}
              emptyMessage="You have no active tasks"
              showFilters={false}
              onSubmitResult={handleSubmitResult}
            />
          </div>
        </div>

        {/* Right Column - Earnings & Balance */}
        <div className="space-y-8">
          <WalletBalances balance={balance ?? null} isLoading={loadingBalance} />

          <AreaChart
            title="Earnings (30 Days)"
            data={earningsHistory}
            xKey="date"
            areaKey="earnings"
            color="#22d3ee"
            gradientFrom="#22d3ee"
            height={200}
          />
        </div>
      </div>

      {/* Submit Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setSelectedTask(null);
        }}
        title="Submit Result"
        description="Submit your computation result for this task"
        size="lg"
      >
        {selectedTask && (
          <SubmitResultForm
            task={selectedTask}
            onSubmit={handleResultSubmit}
            onCancel={() => {
              setShowResultModal(false);
              setSelectedTask(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
