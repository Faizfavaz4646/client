import { api } from "../api";
import type { ITask, TaskPriority } from "@/types/task.types";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  channelId: string;
  assignees?: string[];
  dueDate?: string;
  statusId?: string;
}

export const TaskService = {
  // 1. Fetch all tasks for a channel
  getTasksByChannel: async (channelId: string, params?: { status?: string; priority?: string }): Promise<{ success: boolean; data: { tasks: ITask[] } }> => {
    const response = await api.get(`/tasks/channel/${channelId}`, { params });
    return response.data;
  },

  // 2. Fetch My Tasks
  getMyTasks: async (): Promise<{ success: boolean; data: { tasks: ITask[] } }> => {
    const response = await api.get(`/tasks/my-tasks`);
    return response.data;
  },

  // 3. Create a task
  createTask: async (data: CreateTaskPayload): Promise<{ success: boolean; data: { task: ITask } }> => {
    const response = await api.post(`/tasks`, data);
    return response.data;
  },

  // 4. Update task details (title, description, etc)
  updateTask: async (taskId: string, data: Partial<CreateTaskPayload>): Promise<{ success: boolean; data: { task: ITask } }> => {
    const response = await api.patch(`/tasks/${taskId}`, data);
    return response.data;
  },

  // 5. Update task status (for drag and drop)
  updateTaskStatus: async (taskId: string, statusId: string): Promise<{ success: boolean; data: { task: ITask } }> => {
    const response = await api.patch(`/tasks/${taskId}/status`, { statusId });
    return response.data;
  },

  // 6. Delete a task
  deleteTask: async (taskId: string): Promise<{ success: boolean; data: {} }> => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // 7. Assign users to task
  assignTask: async (taskId: string, assignees: string[]): Promise<{ success: boolean; data: { task: ITask } }> => {
    const response = await api.patch(`/tasks/${taskId}/assign`, { assignees });
    return response.data;
  },

  // 8. Unassign users from task
  unassignTask: async (taskId: string, assignees: string[]): Promise<{ success: boolean; data: { task: ITask } }> => {
    const response = await api.patch(`/tasks/${taskId}/unassign`, { assignees });
    return response.data;
  }
};
