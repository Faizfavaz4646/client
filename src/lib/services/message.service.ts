import { api } from '../api';

export class MessageService {
    static async getMessages(channelId: string) {
        return api.get(`/messages/${channelId}`);
    }

    static async createMessage(data: { channelId: string; content?: string; type?: string; attachments?: any[] }) {
        return api.post('/messages', data);
    }

    static async updateMessage(messageId: string, content: string) {
        return api.put(`/messages/${messageId}`, { content });
    }

    static async deleteMessage(messageId: string) {
        return api.delete(`/messages/${messageId}`);
    }

    static async uploadMedia(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        return api.post('/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
}
