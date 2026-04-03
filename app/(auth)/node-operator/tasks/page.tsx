'use client';

import { useState } from 'react';
import { TaskList } from '@/components/dashboard';
import { Modal, useToast } from '@/components/ui';
import { SubmitResultForm } from '@/components/forms';
import { useMyTasks } from '@/hooks';
import type { Task } from '@/providers/OARNClientProvider';

export default function NodeOperatorTasksPage() {
  // Fetch all tasks this wallet has ever claimed (including completed), via event history
  const { data: tasks = [], isLoading } = useMyTasks('node');
  const { addToast } = useToast();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const handleSubmitResult = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowResultModal(true);
    }
  };

  const handleResultSubmit = async (data: { resultHash?: string; resultFile?: File }) => {
    addToast({
      type: 'success',
      title: 'Result Submitted',
      message: 'Your computation result has been submitted',
    });
    setShowResultModal(false);
    setSelectedTask(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">My Tasks</h1>
        <p className="text-text-muted mt-1">All tasks claimed by this wallet — pending, active, and completed</p>
      </div>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        emptyMessage="No tasks claimed by this wallet yet"
        onSubmitResult={handleSubmitResult}
      />

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
