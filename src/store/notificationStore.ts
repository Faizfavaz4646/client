import { create } from 'zustand';
import { INotification } from '@/types/notification.types';
import { NotificationService } from '@/lib/services/notification.service';

interface NotificationState {
    notifications: INotification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    } | null;
    
    // Actions
    fetchNotifications: (page?: number, limit?: number) => Promise<void>;
    addNotification: (notification: INotification) => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    pagination: null,

    fetchNotifications: async (page = 1, limit = 20) => {
        try {
            set({ isLoading: true, error: null });
            const response = await NotificationService.getNotifications(page, limit);
            
            // Calculate initial unread count
            const currentUnread = response.notifications.filter(n => !n.isRead).length;

            set((state) => ({
                notifications: page === 1 ? response.notifications : [...state.notifications, ...response.notifications],
                pagination: response.pagination,
                unreadCount: page === 1 ? currentUnread : state.unreadCount + currentUnread,
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch notifications', isLoading: false });
        }
    },

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
        }));
    },

    markAsRead: async (id) => {
        try {
            const updated = await NotificationService.markAsRead(id);
            set((state) => ({
                notifications: state.notifications.map(n => n._id === id ? updated : n),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    },

    markAllAsRead: async () => {
        try {
            await NotificationService.markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    },

    setUnreadCount: (count) => set({ unreadCount: count })
}));
