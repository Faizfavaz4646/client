'use client';
import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskStatus, ITask } from '@/types/task.types';
import { useTaskStore } from '@/store/taskStore';
import { socketService } from '@/lib/services/socket.service';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { Plus } from 'lucide-react';

export default function KanbanBoard({ channelId, isPrivileged }: { channelId: string; isPrivileged?: boolean }) {
  const { tasks, fetchTasks, moveTask, addTask, updateTaskLocally, deleteTaskPureLocal } = useTaskStore();
  const [activeTask, setActiveTask] = useState<ITask | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITask | null>(null);

  useEffect(() => {
    fetchTasks(channelId);

    socketService.connect();

    const handleTaskCreated = (data: { task: ITask }) => {
      const taskChannelId = typeof data.task.channelId === 'string' 
        ? data.task.channelId 
        : (data.task.channelId as any)?._id;
        
      if (taskChannelId === channelId) {
        addTask(data.task);
      }
    };

    const handleTaskUpdated = (data: { task: ITask }) => {
      const taskChannelId = typeof data.task.channelId === 'string' 
        ? data.task.channelId 
        : (data.task.channelId as any)?._id;
        
      if (taskChannelId === channelId) {
        updateTaskLocally(data.task._id, data.task);
      }
    };

    const handleTaskDeleted = (data: { taskId: string, channelId: string }) => {
      if (data.channelId === channelId) {
        deleteTaskPureLocal(data.taskId);
      }
    };

    socketService.onTaskCreated(handleTaskCreated);
    socketService.onTaskUpdated(handleTaskUpdated);
    socketService.onTaskDeleted(handleTaskDeleted);

    return () => {
      socketService.offTaskCreated(handleTaskCreated);
      socketService.offTaskUpdated(handleTaskUpdated);
      socketService.offTaskDeleted(handleTaskDeleted);
    };
  }, [channelId, addTask, updateTaskLocally, deleteTaskPureLocal, fetchTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Is it dropping over a column?
    if (Object.values(TaskStatus).includes(overId as TaskStatus)) {
      moveTask(activeId, overId as TaskStatus);
      return;
    }

    // Dropping over another task, get its column
    const overTask = tasks.find(t => t._id === overId);
    if (overTask && overTask.status) {
      moveTask(activeId, overTask.status);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0f1f] p-6 rounded-tl-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage project workflow</p>
        </div>
        {isPrivileged && (
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        )}
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={onDragStart} 
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 h-[calc(100vh-160px)] overflow-x-auto pb-4">
          {Object.values(TaskStatus).map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105 opacity-90 cursor-grabbing shadow-2xl">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        task={taskToEdit} 
        channelId={channelId}
      />
    </div>
  );
}
