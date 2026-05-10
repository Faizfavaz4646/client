'use client';

import React, { useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore';
import TaskCard from '@/components/tasks/TaskCard';


export default function MyTasksPage() {
  const { tasks, isLoading, error, fetchMyTasks } = useTaskStore();

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  return (
    <div className="flex flex-col h-full w-full bg-neutral-950 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">My Tasks</h1>
        <p className="text-neutral-400 mt-2">Tasks assigned strictly to you across all channels.</p>
      </div>

      {isLoading ? (
        <div className="text-neutral-400 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          Loading your tasks...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg font-medium">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard key={task._id} task={task} />
            ))
          ) : (
            <div className="col-span-full py-10 text-center border-2 border-dashed border-white/5 rounded-xl">
              <h3 className="text-neutral-300 font-medium text-lg">No tasks assigned to you</h3>
              <p className="text-neutral-500 mt-1">Enjoy your free time!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
