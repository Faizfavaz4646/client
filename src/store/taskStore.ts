import { create } from 'zustand';
import { ITask, TaskStatus } from '@/types/task.types';
import { TaskService } from '@/lib/services/task.service';

interface TaskState {
  tasks: ITask[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: (channelId: string) => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  
  // Optimistic Optimizations
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  addTask: (task: ITask) => void; // for modals
  updateTaskLocally: (taskId: string, updates: Partial<ITask>) => void;
  deleteTaskLocally: (taskId: string) => Promise<void>;
  deleteTaskPureLocal: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

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

  moveTask: async (taskId: string, newStatus: TaskStatus) => {
    const previousTasks = get().tasks;
    const taskIndex = previousTasks.findIndex((t) => t._id === taskId);
    if (taskIndex === -1) return;

    const originalStatus = previousTasks[taskIndex].status;

    // Optimistic Update
    const newTasks = [...previousTasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], status: newStatus };
    set({ tasks: newTasks });

    try {
      // Background Patch
      await TaskService.updateTaskStatus(taskId, newStatus);
    } catch (err: any) {
      // Revert if error
      const revertedTasks = [...get().tasks];
      const revertIndex = revertedTasks.findIndex((t) => t._id === taskId);
      if (revertIndex !== -1) {
        revertedTasks[revertIndex] = { ...revertedTasks[revertIndex], status: originalStatus };
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
