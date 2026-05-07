export enum NotificationType {
    WORKSPACE = "WORKSPACE",
    CHANNEL = "CHANNEL",
    TASK = "TASK",
    MESSAGE = "MESSAGE",
    MENTION = "MENTION",
    SYSTEM = "SYSTEM"
}

export interface INotificationSender {
    _id: string;
    name: string;
    avatar?: string;
}

export interface INotification {
    _id: string;
    recipientId: string;
    senderId: INotificationSender;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface INotificationResponse {
    notifications: INotification[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}
