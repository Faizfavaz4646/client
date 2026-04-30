import { api } from "../api";

export const InviteService = {
  // 1. Validate Invite Code (Public)
  validateInvite: async (code: string) => {
    const response = await api.get(`/invites/validate/${code}`);
    return response.data;
  },

  // 2. Join a workspace with invite code (Authenticated)
  joinWorkspace: async (code: string) => {
    const response = await api.post("/invites/join", { inviteCode: code });
    return response.data;
  },

  getWorkspaceInvite: async (workspaceId: string) => {
    const response = await api.get(`/invites/workspace/${workspaceId}`);
    return response.data;
  },

  // 4. Refresh/Rotate the invite code for a workspace
  refreshWorkspaceInvite: async (workspaceId: string) => {
    const response = await api.post(`/invites/workspace/${workspaceId}/refresh`, {});
    return response.data;
  }
};
