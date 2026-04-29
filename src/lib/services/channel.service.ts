import { api } from "../api";
import type { IChannel, CreateChannelPayload } from "@/types/channel";

export const ChannelService = {
    // 1. Create a new channel
    createChannel: async (data: CreateChannelPayload): Promise<{ success: boolean; data: { channel: IChannel } }> => {
        const response = await api.post('/channels', data);
        return response.data;
    },

    // 2. Add an organization member to a channel
    addMemberToChannel: async (channelId: string, userId: string): Promise<{ success: boolean; data: { channel: IChannel } }> => {
        const response = await api.post(`/channels/${channelId}/members`, { userId });
        return response.data;
    },

    // 3. Remove a member from a channel
    removeMemberFromChannel: async (channelId: string, userId: string): Promise<{ success: boolean; data: { channel: IChannel } }> => {
        const response = await api.delete(`/channels/${channelId}/members/${userId}`);
        return response.data;
    },

    // 4. Delete channel
    deleteChannel: async (channelId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/channels/${channelId}`);
        return response.data;
    },

    // 5. Update channel
    updateChannel: async (channelId: string, data: Partial<IChannel> & { allowedRoles?: string[] }): Promise<{ success: boolean; data: { channel: IChannel } }> => {
        const response = await api.patch(`/channels/${channelId}`, data);
        return response.data;
    },
};
