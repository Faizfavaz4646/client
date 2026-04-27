import api from '../api';
import { 
  IWorkspaceSettingsMember, 
  IWorkspaceSettingsPermissions, 
  IWorkspaceSettingsInvite 
} from '@/types/workspaceSettings.types';

export const workspaceSettingsService = {
  // --- General Settings ---
  updateWorkspace: async (workspaceId: string, data: { name?: string; description?: string; avatarUrl?: string }) => {
    const res = await api.patch(`/workspaces/${workspaceId}`, data);
    return res.data;
  },

  deleteWorkspace: async (workspaceId: string) => {
    const res = await api.delete(`/workspaces/${workspaceId}`);
    return res.data;
  },

  // --- Members Management ---
  getMembers: async (workspaceId: string, page = 1, limit = 20, search = '') => {
    const res = await api.get<{ data: { members: IWorkspaceSettingsMember[], pagination: any } }>(
      `/workspaces/${workspaceId}/members`,
      { params: { page, limit, search } }
    );
    return res.data;
  },

  updateMemberRole: async (workspaceId: string, userId: string, role: string) => {
    const res = await api.patch(`/workspaces/${workspaceId}/members/${userId}/role`, { role });
    return res.data;
  },

  removeMember: async (workspaceId: string, userId: string) => {
    const res = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    return res.data;
  },

  // --- Roles & Permissions ---
  updatePermissions: async (workspaceId: string, permissions: IWorkspaceSettingsPermissions) => {
    const res = await api.patch(`/workspaces/${workspaceId}/permissions`, permissions);
    return res.data;
  },

  // --- Invites ---
  getInvites: async (workspaceId: string) => {
    const res = await api.get<{ data: IWorkspaceSettingsInvite[] }>(`/workspaces/${workspaceId}/invites`);
    return res.data;
  },

  createInvite: async (workspaceId: string, expiresInDays: number = 7, maxUses: number = 0) => {
    // Backend expects a string like "7d" or "168h"
    const res = await api.post(`/workspaces/${workspaceId}/invites`, { expiresIn: `${expiresInDays}d`, maxUses });
    return res.data;
  },

  revokeInvite: async (workspaceId: string, inviteId: string) => {
    const res = await api.delete(`/workspaces/${workspaceId}/invites/${inviteId}`);
    return res.data;
  }
};
