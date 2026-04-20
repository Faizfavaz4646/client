import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskStatus, ITask, TaskPriority } from '@/types/task.types';
import { useTaskStore } from '@/store/taskStore';
import { MoreVertical, Edit2, Trash2, Calendar, UserPlus, CircleDashed, Timer, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: ITask;
  onEdit?: () => void;
}

const priorityColors = {
  [TaskPriority.LOW]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [TaskPriority.MEDIUM]: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  [TaskPriority.HIGH]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  [TaskPriority.URGENT]: 'bg-red-500/10 text-red-500 border-red-500/20',
};

import { Flag } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { deleteTaskLocally } = useTaskStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = useAuthStore(state => state.user);
  const isPrivileged = user?.organizations?.some((org: any) => org.role === 'admin' || org.role === 'owner');


  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { type: 'Task', task },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTaskLocally(task._id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group bg-[#0c0c0e] border overflow-hidden rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-indigo-400/30 transition-all ${
        task.status === TaskStatus.COMPLETED ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-indigo-500/20 shadow-sm'
      } ${
        isDragging ? 'opacity-50 z-50 ring-2 ring-indigo-500 scale-105' : ''
      }`}
    >
        {/* Top-Right Absolute Icon for Completed */}
        {task.status === TaskStatus.COMPLETED && (
          <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-emerald-500/10 rounded-bl-xl border-b border-l border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        )}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-2">
            {/* Status Icon */}
            {task.status === TaskStatus.TODO && (
      <div title="To Do">
        <CircleDashed className="w-4 h-4 text-slate-500" />
      </div>
    )}

    {task.status === TaskStatus.ONGOING && (
      <div title="In Progress">
        <Timer className="w-4 h-4 text-indigo-400" />
      </div>
    )}

    {task.status === TaskStatus.COMPLETED && (
      <div title="Completed">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      </div>
    )}


            <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${priorityColors[task.priority]}`}>
              <Flag size={10} className="stroke-[3px]" />
              {task.priority}
            </div>
          </div>
          
          {isPrivileged && (
            <div className="relative">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-all"
              >
                <MoreVertical size={16} />
              </button>

              {isMenuOpen && (
                <div 
                  className="absolute right-0 top-6 w-32 bg-[#18181b] border border-white/10 rounded-lg shadow-xl z-10 py-1 overflow-hidden"
                  onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking menu
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onEdit && onEdit();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-[#27272a] flex items-center gap-2 transition-colors"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-neutral-400 text-xs line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <Calendar size={12} />
                <span>{format(new Date(task.dueDate), 'MMM d')}</span>
              </div>
            )}
          </div>

          <div className="flex -space-x-2">
            {task.assignees && task.assignees.length > 0 ? (
              task.assignees.slice(0, 3).map((assignee: any, idx: number) => (
                <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#0c0c0e] overflow-hidden bg-[#18181b] flex items-center justify-center relative shrink-0 shadow-sm" title={assignee.name}>
                  {assignee.avatar ? (
                    <img src={assignee.avatar} alt={assignee.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-white uppercase">
                      {assignee.name ? assignee.name.charAt(0) : 'U'}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <button 
                onPointerDown={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
                className="w-6 h-6 rounded-full bg-[#18181b] border-2 border-dashed border-indigo-500/30 flex items-center justify-center text-indigo-300 hover:text-white hover:border-indigo-400 transition-colors cursor-pointer"
                title="Assign User"
              >
                <UserPlus size={10} />
              </button>
            )}
          </div>
        </div>
    </div>
  );
}
