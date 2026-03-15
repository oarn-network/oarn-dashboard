'use client';

import { useState } from 'react';
import { TaskList } from '@/components/dashboard';
import { Modal, useToast } from '@/components/ui';
import { FundTaskForm } from '@/components/forms';
import { usePendingTasks, useFundTask } from '@/hooks';
import { parseEth } from '@/lib/formatters';
import type { Task } from '@/providers/OARNClientProvider';

export default function BrowseTasksPage() {
  const { data: tasks = [], isLoading } = usePendingTasks();
  const fundTaskMutation = useFundTask();
  const { addToast } = useToast();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);

  const handleFund = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowFundModal(true);
    }
  };

  const handleFundSubmit = async (amount: string) => {
    if (!selectedTask) return;

    try {
      await fundTaskMutation.mutateAsync({
        taskId: selectedTask.id,
        amount: parseEth(amount),
      });

      addToast({
        type: 'success',
        title: 'Task Funded',
        message: `Successfully contributed ${amount} ETH to task #${selectedTask.id}`,
      });

      setShowFundModal(false);
      setSelectedTask(null);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Funding Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Browse Tasks</h1>
        <p className="text-text-muted mt-1">Find and fund research tasks on the OARN network</p>
      </div>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        emptyMessage="No tasks available for funding"
        onFund={handleFund}
      />

      {/* Fund Modal */}
      <Modal
        isOpen={showFundModal}
        onClose={() => {
          setShowFundModal(false);
          setSelectedTask(null);
        }}
        title="Fund Task"
        description="Contribute ETH to help fund this task"
        size="md"
      >
        {selectedTask && (
          <FundTaskForm
            task={selectedTask}
            onSubmit={handleFundSubmit}
            isLoading={fundTaskMutation.isPending}
            onCancel={() => {
              setShowFundModal(false);
              setSelectedTask(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
