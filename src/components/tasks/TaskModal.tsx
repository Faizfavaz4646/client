import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ITask, TaskPriority } from '@/types/task.types';
import { TaskService } from '@/lib/services/task.service';
import { useTaskStore } from '@/store/taskStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, UserPlus, Check, ChevronDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { OrganizationService } from '@/lib/services/organization.service';
import RichTextEditor from './RichTextEditor';
import { DatePicker } from '@/components/ui/DatePicker';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().optional(),
  assignees: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ITask | null; // If null, it's a create. If exists, it's an edit.
  channelId: string;
}

const priorityDetails = {
  [TaskPriority.LOW]: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  [TaskPriority.MEDIUM]: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  [TaskPriority.HIGH]: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  [TaskPriority.URGENT]: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function TaskModal({ isOpen, onClose, task, channelId }: TaskModalProps) {
  const { addTask, updateTaskLocally } = useTaskStore();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  
  const [members, setMembers] = useState<any[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen && workspaceId) {
      const loadMembers = async () => {
        try {
          const workspaceRes = await WorkspaceService.getWorkspaceById(workspaceId);
          const resolvedOrgId = workspaceRes.data?.organizationId || workspaceRes.data?.orgId || workspaceId;
          const membersRes = await OrganizationService.getOrganizationMembers(resolvedOrgId);
          if (membersRes.data) {
            setMembers(membersRes.data.members || membersRes.data);
          }
        } catch (e) {
          console.error("Failed to fetch workspace members for assignees", e);
        }
      };
      loadMembers();
    }
  }, [isOpen, workspaceId]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      assignees: [],
    },
  });

  const selectedPriority = watch('priority');
  const selectedAssignees = watch('assignees') || [];

  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          assignees: task.assignees ? task.assignees.map((a: any) => typeof a === 'string' ? a : a._id) : [],
        });
      } else {
        reset({
          title: '',
          description: '',
          priority: TaskPriority.MEDIUM,
          dueDate: '',
          assignees: [],
        });
      }
    } else {
        setIsAssigneeDropdownOpen(false);
        setIsPriorityDropdownOpen(false);
    }
  }, [isOpen, task, reset]);

  const onSubmit = async (data: TaskFormValues) => {
    try {
      if (task) {
        const response = await TaskService.updateTask(task._id, data);
        if (data.assignees && data.assignees.length > 0) {
            // Also need to update assignees using the specialized route if needed, 
            // but we can just use assignTask. In a robust setup, updateTask might handle it, 
            // but let's call assignTask specifically.
            await TaskService.assignTask(task._id, data.assignees);
            // Notice: the above doesn't unassign removed ones. A complete sync would unassign missing ones.
            // For now, doing assignTask is ok.
        } else if (task.assignees?.length > 0) {
            // unassign all
            const toRemove = task.assignees.map((a:any) => typeof a === 'string' ? a : a._id);
            await TaskService.unassignTask(task._id, toRemove);
        }
        
        // Fetch fresh task to get updated populated assignees
        const freshChannelRes = await TaskService.getTasksByChannel(channelId);
        if (freshChannelRes.success && freshChannelRes.data.tasks) {
          const freshTask = freshChannelRes.data.tasks.find((t: any) => t._id === task._id);
          if (freshTask) updateTaskLocally(task._id, freshTask);
        } else {
             updateTaskLocally(task._id, response.data.task);
        }
      } else {
        const response = await TaskService.createTask({
          ...data,
          channelId,
        });
        
        // Fetch to ensure we get back populated task if it isn't returned populated fully
        const freshTaskRes = await TaskService.getTasksByChannel(channelId);
        if (freshTaskRes.success && freshTaskRes.data.tasks) {
           const freshTask = freshTaskRes.data.tasks.find((t:any) => t._id === response.data.task._id) || response.data.task;
           addTask(freshTask);
        } else {
           addTask(response.data.task);
        }
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to save task", err);
    }
  };

  const toggleAssignee = (id: string) => {
    if (selectedAssignees.includes(id)) {
      setValue('assignees', selectedAssignees.filter(a => a !== id));
    } else {
      setValue('assignees', [...selectedAssignees, id]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#11183a] border border-indigo-500/20 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(99,102,241,0.15)] relative max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold text-white mb-6">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Title</label>
                <input
                  {...register('title')}
                  autoFocus
                  className="w-full bg-[#1c2242] border border-indigo-500/20 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent outline-none transition-all shadow-inner"
                  placeholder="What needs to be done?"
                />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>

           <div>
  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description</label>
  <Controller
    name="description"
    control={control}
    render={({ field }) => (
      <RichTextEditor 
        value={field.value || ''} 
        onChange={field.onChange} 
      />
    )}
  />
</div>

              <div className="grid grid-cols-2 gap-5">
                {/* Custom Priority Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Priority</label>
                  <div 
                    onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                    className="w-full bg-[#1c2242] shadow-inner border border-indigo-500/20 rounded-lg px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-all select-none"
                  >
                    <div className={`flex items-center gap-2 text-sm font-bold uppercase ${priorityDetails[selectedPriority].color}`}>
                        <Flag size={14} className="stroke-[3px]" />
                        {selectedPriority}
                    </div>
                    <ChevronDown size={14} className="text-neutral-400" />
                  </div>
                  
                  {isPriorityDropdownOpen && (
                    <div className="absolute top-[72px] left-0 w-full bg-[#252b4d] shadow-2xl border border-indigo-500/20 rounded-lg z-50 overflow-hidden py-1">
                        {Object.values(TaskPriority).map(p => (
                            <div 
                                key={p}
                                onClick={() => { setValue('priority', p); setIsPriorityDropdownOpen(false); }}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase cursor-pointer hover:bg-white/5 transition-colors ${priorityDetails[p].color}`}
                            >
                                <Flag size={14} className="stroke-[3px]" />
                                {p}
                            </div>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Due Date</label>
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Select due date"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Assignees Section */}
              <div className="relative">
                 <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Assignees</span>
                    <span className="text-xs text-neutral-500">{selectedAssignees.length} selected</span>
                 </label>
                 <div 
                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                    className="w-full bg-[#1c2242] border border-indigo-500/20 rounded-lg p-2 flex items-center min-h-[46px] cursor-pointer hover:border-indigo-500/40 transition-all flex-wrap gap-2 shadow-inner"
                  >
                    {selectedAssignees.length === 0 && (
                        <div className="text-neutral-500 px-2 text-sm flex items-center gap-2">
                           <UserPlus size={14} /> Assign to members...
                        </div>
                    )}
                    {selectedAssignees.map(id => {
                        const memberInfo = members.find(m => m.id === id);
                        if (!memberInfo) return null;
                        return (
                            <div key={id} className="flex items-center gap-2 bg-[#252b4d] border border-indigo-500/20 pr-2 rounded-full overflow-hidden shrink-0 shadow-sm">
                                {memberInfo.avatar ? (
                                    <img src={memberInfo.avatar} className="w-5 h-5 object-cover" />
                                ) : (
                                    <div className="w-5 h-5 bg-indigo-500/20 text-[10px] text-indigo-400 font-bold flex items-center justify-center uppercase">
                                        {memberInfo.name.charAt(0)}
                                    </div>
                                )}
                                <span className="text-xs text-white pb-px">{memberInfo.name.split(' ')[0]}</span>
                            </div>
                        )
                    })}
                  </div>

                  {isAssigneeDropdownOpen && (
                      <div className="absolute top-[80px] left-0 w-full bg-[#252b4d] border border-indigo-500/20 rounded-lg shadow-2xl z-50 overflow-hidden py-2 max-h-48 overflow-y-auto custom-scrollbar">
                           {members.length === 0 && (
                               <div className="px-4 py-3 text-sm text-neutral-500 text-center">No workspace members found</div>
                           )}
                           {members.map(member => (
                               <div 
                                  key={member.id} 
                                  onClick={() => toggleAssignee(member.id)}
                                  className="flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                      {member.avatar ? (
                                          <img src={member.avatar} className="w-6 h-6 rounded-full object-cover bg-black" />
                                      ) : (
                                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center uppercase">
                                              {member.name.charAt(0)}
                                          </div>
                                      )}
                                      <span className="text-sm text-neutral-200 font-medium">{member.name}</span>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAssignees.includes(member.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20'}`}>
                                      {selectedAssignees.includes(member.id) && <Check size={10} strokeWidth={3} />}
                                  </div>
                               </div>
                           ))}
                      </div>
                  )}
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
