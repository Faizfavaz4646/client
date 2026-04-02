export interface UserBasicInfo {
    _id?: string;
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
}

export interface Message {
    _id?: string;
    id?: string;
    content: string;
    type?: string;
    isEdited?: boolean;
    isDeleted?: boolean;
    attachments?: {
        url: string;
        name: string;
        fileType: string;
    }[];
    senderId?: UserBasicInfo;
    createdAt?: string;
    timestamp?: string | Date;
}

export interface Channel {
    _id?: string;
    id?: string;
    name: string;
    type?: 'TEXT' | 'VOICE' | 'VIDEO' | 'AUDIO';
    workspaceId?: string;
    createdAt?: string;
}
