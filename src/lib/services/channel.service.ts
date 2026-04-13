import { api } from "../api";
import type { IChannel, CreateChannelPayload } from "@/types/channel";

export const ChannelService = {
    // 1. Create a new channel
    createChannel: async (data: CreateChannelPayload): Promise<{ success: boolean; data: { channel: IChannel } }> => {
        const response = await api.post('/channels', data);
        return response.data;
    },

    // 2. Add an organization member to a channel
    addMemberToChannel: async (channelId: string, memberId: string): Promise<{ success: boolean; data: { channel: IChannel } }> => {
        const response = await api.post(`/channels/${channelId}/members`, { memberId });
        return response.data;
    },

    // 3. Delete channel
    deleteChannel: async (channelId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/channels/${channelId}`);
        return response.data;
    },
};
