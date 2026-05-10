import { api } from "../api";
import type { IStatus } from "@/types/task.types";

export const StatusService = {
  // Fetch all statuses for a workspace
  getStatusesByWorkspace: async (workspaceId: string): Promise<{ success: boolean; data: { statuses: IStatus[] } }> => {
    const response = await api.get(`/statuses/workspace/${workspaceId}`);
    return response.data;
  },

  // Create a status
  createStatus: async (data: Partial<IStatus>): Promise<{ success: boolean; data: { status: IStatus } }> => {
    const response = await api.post(`/statuses`, data);
    return response.data;
  },

  // Update a status
  updateStatus: async (statusId: string, data: Partial<IStatus>): Promise<{ success: boolean; data: { status: IStatus } }> => {
    const response = await api.put(`/statuses/${statusId}`, data);
    return response.data;
  },

  // Delete a status
  deleteStatus: async (statusId: string): Promise<{ success: boolean; data: {} }> => {
    const response = await api.delete(`/statuses/${statusId}`);
    return response.data;
  }
};
