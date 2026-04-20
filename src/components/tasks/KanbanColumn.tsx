import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskStatus, ITask } from '@/types/task.types';
import { CircleDashed, Timer, CheckCircle2 } from 'lucide-react';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: ITask[];
  onEditTask: (task: ITask) => void;
}

export default function KanbanColumn({ status, tasks, onEditTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col flex-1 min-w-[300px] h-full bg-[#13172e] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      <div className="p-4 border-b border-indigo-500/20 flex items-center justify-between bg-[#191f3a]">
        <h3 className="font-semibold text-white/90 flex items-center gap-2">
          {status === TaskStatus.TODO && <><CircleDashed className="w-4 h-4 text-slate-400" /> To Do</>}
          {status === TaskStatus.ONGOING && <><Timer className="w-4 h-4 text-indigo-400" /> In Progress</>}
          {status === TaskStatus.COMPLETED && <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed</>}
        </h3>
        <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
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
