import { io, Socket } from "socket.io-client";

class SocketService {
  public socket: Socket | null = null;

  // 1. Connect to the server
  connect() {
    if (!this.socket) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const backendUrl = apiUrl.replace('/api/v1', '');
      this.socket = io(backendUrl, {
        transports: ['websocket', 'polling']
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected with ID:", this.socket?.id);
      });
    }
    return this.socket;
  }

  // 2. Disconnect from the server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("❌ Socket disconnected");
    }
  }

  // 3. Join a specific channel
  joinChannel(channelId: string) {
    if (this.socket) {
      this.socket.emit("join-channel", channelId);
      console.log(`🚪 Joined channel: ${channelId}`);
    }
  }

  // 4. Send a message
  sendMessage(channelId: string, content: string, type: string = "TEXT", attachments: any[] = []) {
    if (this.socket) {
      this.socket.emit("send-message", { channelId, content, type, attachments });
    }
  }

  deleteMessage(channelId: string, messageId: string) {
    if (this.socket) {
      this.socket.emit("delete-message", { channelId, messageId });
    }
  }

  // 5. Listen for incoming messages
  // We pass a 'callback' function here so it can update the React state in your UI
  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      // .off() prevents React StrictMode from accidentally attaching the listener twice!
      this.socket.off("new-message");
      this.socket.on("new-message", callback);
    }
  }

  onMessageEdited(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.off("message-edited");
      this.socket.on("message-edited", callback);
    }
  }

  onMessageDeleted(callback: (data: { messageId: string }) => void) {
    if (this.socket) {
      this.socket.off("message-deleted");
      this.socket.on("message-deleted", callback);
    }
  }

  onChannelCreated(callback: (channel: any) => void) {
    if (this.socket) {
      this.socket.off("channel-created");
      this.socket.on("channel-created", callback);
    }
  }
}

// Export a single instance of the service to be shared across your whole app
export const socketService = new SocketService();