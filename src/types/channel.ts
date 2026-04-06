export interface IChannel {
    _id?: string;
    id?: string;
    name: string;
    type?: 'TEXT' | 'VOICE' | 'VIDEO' | 'AUDIO';
    workspaceId?: string;
    members?: any[];
    createdAt?: string;
}

export interface CreateChannelPayload {
    name: string;
    type: 'TEXT' | 'VOICE' | 'AUDIO' | 'VIDEO';
    workspaceId: string;
}
