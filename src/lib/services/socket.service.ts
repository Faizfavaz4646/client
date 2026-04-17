import { io, Socket } from "socket.io-client";

class SocketService {
  public socket: Socket | null = null;

  // 1. Connect to the server
  connect() {
    if (!this.socket) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                         process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 
                         "http://localhost:5000";
      
      let token = null;
      if (typeof window !== "undefined") {
        const storageStr = localStorage.getItem("synq-auth-storage");
        if (storageStr) {
          try {
            const parsed = JSON.parse(storageStr);
            token = parsed.state.accessToken;
          } catch (e) {}
        }
      }

      this.socket = io(backendUrl, {
        transports: ["websocket", "polling"],
        auth: { token },
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

  private newMessageCallbacks: ((message: any) => void)[] = [];

  // 5. Listen for incoming messages
  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      if (this.newMessageCallbacks.length === 0) {
        this.socket.on("new-message", (message: any) => {
          this.newMessageCallbacks.forEach(cb => cb(message));
        });
      }
      this.newMessageCallbacks.push(callback);
    }
  }

  // Helper to remove listeners when components unmount
  offNewMessage(callback: (message: any) => void) {
    this.newMessageCallbacks = this.newMessageCallbacks.filter(cb => cb !== callback);
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

  // --- Task Events ---

  onTaskCreated(callback: (data: { task: any }) => void) {
    if (this.socket) {
      this.socket.on("task:created", callback);
    }
  }

  offTaskCreated(callback: (data: { task: any }) => void) {
    if (this.socket) {
      this.socket.off("task:created", callback);
    }
  }

  onTaskUpdated(callback: (data: { task: any }) => void) {
    if (this.socket) {
      this.socket.on("task:updated", callback);
    }
  }

  offTaskUpdated(callback: (data: { task: any }) => void) {
    if (this.socket) {
      this.socket.off("task:updated", callback);
    }
  }

  onTaskDeleted(callback: (data: { taskId: string, channelId: string }) => void) {
    if (this.socket) {
      this.socket.on("task:deleted", callback);
    }
  }

  offTaskDeleted(callback: (data: { taskId: string, channelId: string }) => void) {
    if (this.socket) {
      this.socket.off("task:deleted", callback);
    }
  }
}

// Export a single instance of the service to be shared across your whole app
export const socketService = new SocketService();