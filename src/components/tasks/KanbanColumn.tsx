import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ITask, IStatus } from '@/types/task.types';
import { Circle, CheckCircle2, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import TaskCard from './TaskCard';
import { toast } from 'sonner';

interface KanbanColumnProps {
  status: IStatus;
  tasks: ITask[];
  isPrivileged?: boolean;
  onEditTask: (task: ITask) => void;
}

export default function KanbanColumn({ status, tasks, isPrivileged, onEditTask }: KanbanColumnProps) {
  const { deleteStatus } = useTaskStore();
  const { setNodeRef, isOver } = useDroppable({
    id: status._id,
  });

  return (
    <div 
      className={`flex flex-col flex-1 min-w-[300px] max-w-[320px] h-full rounded-xl overflow-hidden border shadow-2xl relative transition-all ${
        status.isCompleted 
          ? 'bg-emerald-500/5 border-emerald-500/20' 
          : 'bg-[#13172e] border-white/5'
      }`}
      style={{ borderTop: `4px solid ${status.color || (status.isCompleted ? '#10b981' : '#4f46e5')}` }}
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#191f3a]/80 backdrop-blur-md">
        <h3 className="font-semibold text-white/90 flex items-center gap-2">
          {status.isCompleted ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: status.color || '#34d399' }} />
          ) : (
            <Circle className="w-4 h-4" style={{ color: status.color || '#818cf8', fill: status.color ? `${status.color}20` : '#818cf820' }} />
          )}
          <span className="tracking-wide text-[13px] uppercase">{status.name}</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              if (tasks.length > 0) {
                toast.error("Cannot delete a column that contains tasks. Please move the tasks first.");
                return;
              }
              
              toast.warning(`Are you sure you want to delete the "${status.name}" column?`, {
                action: {
                  label: "Delete",
                  onClick: async () => {
                    try {
                      await deleteStatus(status._id);
                      toast.success(`Column "${status.name}" deleted successfully.`);
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Failed to delete column.");
                    }
                  }
                },
                cancel: {
                  label: "Cancel",
                  onClick: () => {}
                }
              });
            }}
            className="text-neutral-500 hover:text-red-400 p-1 hover:bg-white/5 rounded transition-colors"
            title="Delete Column"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto transition-colors duration-200 ${
          isOver ? 'bg-white/5' : ''
        }`}
      >
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 min-h-[50px]">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onEdit={() => onEditTask(task)} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
