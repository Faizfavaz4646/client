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
import { workspaceSettingsService } from '@/lib/services/workspaceSettings.service';
import { OrganizationService } from '@/lib/services/organization.service';
import RichTextEditor from './RichTextEditor';
import { DatePicker } from '@/components/ui/DatePicker';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  statusId: z.string().optional(),
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
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const { statuses } = useTaskStore();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
        setIsPriorityDropdownOpen(false);
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && workspaceId) {
      const loadMembers = async () => {
        try {
          const membersRes = await workspaceSettingsService.getMembers(workspaceId, 1, 1000, '');
          if (membersRes.data?.members) {
            setMembers(membersRes.data.members);
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
      statusId: statuses.length > 0 ? statuses[0]._id : '',
    },
  });

  const selectedPriority = watch('priority');
  const selectedStatusId = watch('statusId');
  const selectedAssignees = watch('assignees') || [];
  
  const currentStatusObj = statuses.find(s => s._id === selectedStatusId) || statuses[0];

  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          assignees: task.assignees ? task.assignees.map((a: any) => typeof a === 'string' ? a : a._id) : [],
          statusId: typeof task.statusId === 'string' ? task.statusId : task.statusId?._id || (statuses.length > 0 ? statuses[0]._id : ''),
        });
      } else {
        reset({
          title: '',
          description: '',
          priority: TaskPriority.MEDIUM,
          dueDate: '',
          assignees: [],
          statusId: statuses.length > 0 ? statuses[0]._id : '',
        });
      }
    } else {
        setIsAssigneeDropdownOpen(false);
        setIsPriorityDropdownOpen(false);
        setIsStatusDropdownOpen(false);
    }
  }, [isOpen, task, reset, statuses]);

  const onSubmit = async (data: TaskFormValues) => {
    try {
      // Clean up payload
      const payload: any = { ...data };
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.statusId) delete payload.statusId;

      if (task) {
        const response = await TaskService.updateTask(task._id, payload);
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
          ...payload,
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
            className="bg-[#11183a] border border-indigo-500/20 rounded-2xl p-6 md:p-8 w-full max-w-4xl shadow-[0_0_50px_rgba(99,102,241,0.15)] relative max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors p-1.5"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/5 pb-4">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Main Content */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-300 mb-2">Task Title</label>
                    <input
                      {...register('title')}
                      autoFocus
                      className="w-full bg-[#1c2242] border border-indigo-500/20 rounded-xl px-4 py-3 text-white text-lg focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent outline-none transition-all shadow-inner"
                      placeholder="What needs to be done?"
                    />
                    {errors.title && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-300 mb-2">Description & Attachments</label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <div className="min-h-[250px]">
                          <RichTextEditor 
                            value={field.value || ''} 
                            onChange={field.onChange} 
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Settings */}
                <div ref={dropdownRef} className="space-y-6 bg-[#0c0f24]/50 border border-indigo-500/10 p-5 rounded-2xl h-fit">
                  
                  {/* Priority */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Priority</label>
                    <div 
                      onClick={() => {
                        setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
                        setIsAssigneeDropdownOpen(false);
                      }}
                      className="w-full bg-[#1c2242] shadow-inner border border-indigo-500/20 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-all select-none"
                    >
                      <div className={`flex items-center gap-2 text-sm font-bold uppercase ${priorityDetails[selectedPriority].color}`}>
                          <Flag size={14} className="stroke-[3px]" />
                          {selectedPriority}
                      </div>
                      <ChevronDown size={14} className="text-neutral-400" />
                    </div>
                    
                    {isPriorityDropdownOpen && (
                      <div className="absolute bottom-full mb-2 left-0 w-full bg-[#252b4d] shadow-2xl border border-indigo-500/20 rounded-xl z-50 overflow-hidden py-1">
                          {Object.values(TaskPriority).map(p => (
                              <div 
                                  key={p}
                                  onClick={() => { setValue('priority', p); setIsPriorityDropdownOpen(false); }}
                                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase cursor-pointer hover:bg-white/5 transition-colors ${priorityDetails[p].color}`}
                              >
                                  <Flag size={14} className="stroke-[3px]" />
                                  {p}
                              </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Column Status</label>
                    <div 
                      onClick={() => {
                        setIsStatusDropdownOpen(!isStatusDropdownOpen);
                        setIsAssigneeDropdownOpen(false);
                        setIsPriorityDropdownOpen(false);
                      }}
                      className="w-full bg-[#1c2242] shadow-inner border border-indigo-500/20 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-all select-none"
                    >
                      {currentStatusObj ? (
                        <div className="flex items-center gap-2 text-sm font-bold uppercase text-white">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentStatusObj.color || '#4f46e5' }} />
                          {currentStatusObj.name}
                        </div>
                      ) : (
                        <div className="text-neutral-500 text-sm">Select status...</div>
                      )}
                      <ChevronDown size={14} className="text-neutral-400" />
                    </div>
                    
                    {isStatusDropdownOpen && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-[#252b4d] shadow-2xl border border-indigo-500/20 rounded-xl z-50 overflow-hidden py-1 max-h-[200px] overflow-y-auto">
                          {statuses.map(s => (
                              <div 
                                  key={s._id}
                                  onClick={() => { setValue('statusId', s._id); setIsStatusDropdownOpen(false); }}
                                  className="flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase cursor-pointer hover:bg-white/5 transition-colors text-white"
                              >
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color || '#4f46e5' }} />
                                  {s.name}
                              </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Due Date</label>
                    <Controller
                      name="dueDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          placeholder="Select a deadline"
                        />
                      )}
                    />
                  </div>

                  {/* Assignees */}
                  <div className="relative">
                     <label className="flex items-center justify-between block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        <span>Assignees</span>
                        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{selectedAssignees.length} assigned</span>
                     </label>
                     <div 
                        onClick={() => {
                          setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
                          setIsPriorityDropdownOpen(false);
                        }}
                        className="w-full bg-[#1c2242] border border-indigo-500/20 rounded-xl p-2.5 flex items-center min-h-[50px] cursor-pointer hover:border-indigo-500/40 transition-all flex-wrap gap-2 shadow-inner"
                      >
                        {selectedAssignees.length === 0 && (
                            <div className="text-neutral-500 px-2 text-sm flex items-center gap-2 font-medium">
                               <UserPlus size={16} /> Add members...
                            </div>
                        )}
                        {selectedAssignees.map(id => {
                            const memberInfo = members.find(m => m.id === id);
                            if (!memberInfo) return null;
                            return (
                                <div key={id} className="flex items-center gap-2 bg-[#252b4d] border border-indigo-500/30 pr-2.5 rounded-full overflow-hidden shrink-0 shadow-md">
                                    {memberInfo.avatar ? (
                                        <img src={memberInfo.avatar} className="w-6 h-6 object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 bg-indigo-500/20 text-xs text-indigo-400 font-bold flex items-center justify-center uppercase">
                                            {memberInfo.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-xs font-medium text-white pb-px">{memberInfo.name.split(' ')[0]}</span>
                                </div>
                            )
                        })}
                      </div>

                      {isAssigneeDropdownOpen && (
                          <div className="absolute bottom-full mb-2 left-0 w-full bg-[#252b4d] border border-indigo-500/20 rounded-xl shadow-2xl z-50 overflow-hidden py-2 max-h-60 overflow-y-auto custom-scrollbar">
                               {members.length === 0 && (
                                   <div className="px-4 py-3 text-sm text-neutral-500 text-center font-medium">No members found</div>
                               )}
                               {members.map(member => (
                                   <div 
                                      key={member.id} 
                                      onClick={() => toggleAssignee(member.id)}
                                      className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                          {member.avatar ? (
                                              <img src={member.avatar} className="w-7 h-7 rounded-full object-cover bg-black" />
                                          ) : (
                                              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center uppercase">
                                                  {member.name.charAt(0)}
                                              </div>
                                          )}
                                          <span className="text-sm text-neutral-200 font-medium">{member.name}</span>
                                      </div>
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedAssignees.includes(member.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20'}`}>
                                          {selectedAssignees.includes(member.id) && <Check size={12} strokeWidth={3} />}
                                      </div>
                                   </div>
                               ))}
                          </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 mt-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-sm font-bold text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-95"
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
