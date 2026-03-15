'use client';

import Link from 'next/link';
import { TaskList } from '@/components/dashboard';
import { Button } from '@/components/ui';
import { useMyTasks } from '@/hooks';

export default function ResearcherTasksPage() {
  const { data: tasks = [], isLoading } = useMyTasks('requester');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">My Tasks</h1>
          <p className="text-text-muted mt-1">View all tasks you have submitted</p>
        </div>
        <Link href="/researcher/submit">
          <Button
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Submit New Task
          </Button>
        </Link>
      </div>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        emptyMessage="You haven't submitted any tasks yet"
        showActions={false}
        onView={(taskId) => {
          window.location.href = `/researcher/tasks/${taskId}`;
        }}
      />
    </div>
  );
}
