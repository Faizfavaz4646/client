import { api } from "../api";
import type { CreateWorkspacePayload } from "@/types/workspace";

export const WorkspaceService = {
  // 1. Create a new workspace (Org Founder only)
  createWorkspace: async (data: CreateWorkspacePayload) => {
    const response = await api.post('/workspaces', data);
    return response.data;
  },

  // 2. Get all workspaces for the current organization
  getOrgWorkspaces: async (orgId: string) => {
    const response = await api.get(`/workspaces/org/${orgId}`);
    return response.data;
  },

  // 3. Get specific workspace details
  getWorkspaceById: async (workspaceId: string) => {
    const response = await api.get(`/workspaces/${workspaceId}`);
    return response.data;
  },
};
