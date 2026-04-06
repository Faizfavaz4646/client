import { api } from "../api";

export const InviteService = {
  // 1. Validate Invite Code (Public)
  validateInvite: async (code: string) => {
    const response = await api.get(`/invites/validate/${code}`);
    return response.data;
  },

  // 2. Join a workspace with invite code (Authenticated)
  joinWorkspace: async (inviteCode: string) => {
    const response = await api.post("/invites/join", { inviteCode });
    return response.data;
  },
};
