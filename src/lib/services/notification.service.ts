import { api } from '../api';
import { INotificationResponse, INotification } from '@/types/notification.types';

export class NotificationService {
    static async getNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false) {
        const response = await api.get('/notifications', {
            params: { page, limit, unreadOnly }
        });
        return response.data.data as INotificationResponse;
    }

    static async markAsRead(notificationId: string) {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data.data.notification as INotification;
    }

    static async markAllAsRead() {
        const response = await api.patch('/notifications/read-all');
        return response.data.data;
    }
}
