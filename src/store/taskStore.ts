import { create } from 'zustand';
import { ITask, IStatus } from '@/types/task.types';
import { TaskService } from '@/lib/services/task.service';
import { StatusService } from '@/lib/services/status.service';

interface TaskState {
  tasks: ITask[];
  statuses: IStatus[];
  isLoading: boolean;
  error: string | null;

  fetchStatuses: (workspaceId: string) => Promise<void>;
  createStatus: (data: Partial<IStatus>) => Promise<void>;
  deleteStatus: (statusId: string) => Promise<void>;
  addStatusLocally: (status: IStatus) => void;
  updateStatusLocally: (statusId: string, updates: Partial<IStatus>) => void;
  deleteStatusLocally: (statusId: string) => void;
  fetchTasks: (channelId: string) => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  
  // Optimistic Optimizations
  moveTask: (taskId: string, newStatusId: string) => Promise<void>;
  addTask: (task: ITask) => void; // for modals
  updateTaskLocally: (taskId: string, updates: Partial<ITask>) => void;
  deleteTaskLocally: (taskId: string) => Promise<void>;
  deleteTaskPureLocal: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  statuses: [],
  isLoading: false,
  error: null,

  fetchStatuses: async (workspaceId: string) => {
    try {
      const response = await StatusService.getStatusesByWorkspace(workspaceId);
      // Sort statuses by order
      const sortedStatuses = response.data.statuses.sort((a, b) => a.order - b.order);
      set({ statuses: sortedStatuses });
    } catch (err: any) {
      console.error("Failed to fetch statuses", err);
    }
  },

  createStatus: async (data: Partial<IStatus>) => {
    try {
      const response = await StatusService.createStatus(data);
      if (response.success && response.data.status) {
        set((state) => {
          if (state.statuses.some(s => s._id === response.data.status._id)) return state;
          return { statuses: [...state.statuses, response.data.status] };
        });
      }
    } catch (err: any) {
      console.error("Failed to create status", err);
      throw err;
    }
  },

  deleteStatus: async (statusId: string) => {
    try {
      const response = await StatusService.deleteStatus(statusId);
      if (response.success) {
        set((state) => ({ statuses: state.statuses.filter(s => s._id !== statusId) }));
      }
    } catch (err: any) {
      console.error("Failed to delete status", err);
      // The backend will throw a 400 error if there are tasks inside it. Let's rethrow to show an alert in UI.
      throw err;
    }
  },

  deleteStatusLocally: (statusId: string) => {
    set((state) => ({ 
      statuses: state.statuses.filter(s => s._id !== statusId) 
    }));
  },

  addStatusLocally: (status: IStatus) => {
    set((state) => {
      // Avoid duplicates
      if (state.statuses.some(s => s._id === status._id)) return state;
      return { statuses: [...state.statuses, status] };
    });
  },

  updateStatusLocally: (statusId: string, updates: Partial<IStatus>) => {
    set((state) => ({
      statuses: state.statuses.map(s => s._id === statusId ? { ...s, ...updates } : s)
    }));
  },

  fetchTasks: async (channelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await TaskService.getTasksByChannel(channelId);
      set({ tasks: response.data.tasks, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await TaskService.getMyTasks();
      set({ tasks: response.data.tasks, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  moveTask: async (taskId: string, newStatusId: string) => {
    const previousTasks = get().tasks;
    const taskIndex = previousTasks.findIndex((t) => t._id === taskId);
    if (taskIndex === -1) return;

    const originalStatusId = previousTasks[taskIndex].statusId;

    // Optimistic Update
    const newTasks = [...previousTasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], statusId: newStatusId };
    set({ tasks: newTasks });

    try {
      // Background Patch
      await TaskService.updateTaskStatus(taskId, newStatusId);
    } catch (err: any) {
      // Revert if error
      const revertedTasks = [...get().tasks];
      const revertIndex = revertedTasks.findIndex((t) => t._id === taskId);
      if (revertIndex !== -1) {
        revertedTasks[revertIndex] = { ...revertedTasks[revertIndex], statusId: originalStatusId };
        set({ tasks: revertedTasks, error: "Failed to move task. Reverted changes." });
      }
    }
  },

  addTask: (task: ITask) => {
    set((state) => {
      // Prevent duplicates if we already added it optimistically
      if (state.tasks.some(t => t._id === task._id)) {
        return state;
      }
      return { tasks: [task, ...state.tasks] };
    });
  },

  updateTaskLocally: (taskId: string, updates: Partial<ITask>) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task._id === taskId ? { ...task, ...updates } : task
      ),
    }));
  },

  deleteTaskLocally: async (taskId: string) => {
    const previousTasks = get().tasks;
    
    // Optimistic Delete
    set({ tasks: previousTasks.filter((t) => t._id !== taskId) });

    try {
      await TaskService.deleteTask(taskId);
    } catch (err: any) {
      // Revert if error
      set({ tasks: previousTasks, error: "Failed to delete task. Reverted changes." });
    }
  },

  deleteTaskPureLocal: (taskId: string) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== taskId) }));
  },
}));
