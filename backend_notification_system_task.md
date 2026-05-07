# Task: Real-Time Notification System Implementation (Backend)

## Objective
Implement a robust, real-time notification system using **Socket.io** and **Redis** (for horizontal scaling) to instantly alert users of critical events across the application. The system should support both **in-app real-time socket emissions** and **persistent database records** (so users can view historical unread notifications).

---

## 1. Architectural Guidelines

### 1.1 Socket & Redis Infrastructure
- Ensure all notification events are broadcasted using the Redis Adapter to support horizontal scaling (already configured for WebRTC/Chat).
- Utilize **Socket Rooms** effectively:
  - Users should automatically join a private room upon connection: `user_room_${userId}` (for direct/personal notifications like mentions or being added to a channel).
  - Users should join workspace rooms: `workspace_room_${workspaceId}` (for global workspace events).

### 1.2 Database Schema (Suggested)
To ensure notifications aren't lost if a user is offline, persist them in the database.
```typescript
interface Notification {
  _id: string;
  recipientId: string; // The user receiving the notification
  senderId?: string; // The user who triggered the action
  type: string; // e.g., 'CHANNEL_MEMBER_ADDED', 'WORKSPACE_JOINED'
  entityId?: string; // ID of the related channel, workspace, or task
  content: string; // Notification text/body
  isRead: boolean; // Default: false
  createdAt: Date;
}
```

---

## 2. Required Notification Events & Triggers

Please implement the backend logic to emit the following socket events. 

### 2.1 Workspace Level Notifications

| Event Name | Trigger Condition | Target Audience (Socket Room) | Payload Example |
| :--- | :--- | :--- | :--- |
| `notification:workspace-created` | When an owner successfully creates a workspace. | `user_room_${ownerId}` | `{ type: 'SUCCESS', message: 'Workspace "Acme Corp" created successfully!', workspaceId: '123' }` |
| `notification:workspace-joined` | When a new member accepts an invite and joins the workspace. | `workspace_room_${workspaceId}` (or just Owners/Admins) | `{ type: 'INFO', message: 'John Doe joined the workspace.', userId: 'abc', workspaceId: '123' }` |
| `notification:workspace-deleted` | When the workspace is permanently deleted. | `workspace_room_${workspaceId}` | `{ type: 'DANGER', message: 'Workspace "Acme Corp" has been deleted by the owner.' }` |

### 2.2 Channel Level Notifications

| Event Name | Trigger Condition | Target Audience (Socket Room) | Payload Example |
| :--- | :--- | :--- | :--- |
| `notification:channel-created` | When a new channel is created. | `workspace_room_${workspaceId}` (if public) | `{ type: 'INFO', message: '#general channel was created.', channelId: '456' }` |
| `notification:channel-added-you` | When a specific user is added to a channel by an admin/owner. | `user_room_${addedUserId}` | `{ type: 'SUCCESS', message: 'You were added to #marketing.', channelId: '456' }` |
| `notification:channel-member-joined`| When a user joins a channel (or is added). | `channel_room_${channelId}` | `{ type: 'INFO', message: 'Sarah joined #marketing.', userId: 'def', channelId: '456' }` |
| `notification:channel-deleted` | When a channel is deleted. | `channel_room_${channelId}` | `{ type: 'WARNING', message: '#marketing channel was deleted.', channelId: '456' }` |

### 2.3 Message & Interaction Notifications

| Event Name | Trigger Condition | Target Audience (Socket Room) | Payload Example |
| :--- | :--- | :--- | :--- |
| `notification:mention` | When a user is explicitly mentioned (e.g., `@john`) in a chat message. | `user_room_${mentionedUserId}` | `{ type: 'MENTION', message: 'Mike mentioned you in #general', messageId: '789', channelId: '456' }` |
| `notification:reply` | When a user replies directly to someone's message (Thread reply). | `user_room_${originalSenderId}` | `{ type: 'REPLY', message: 'Anna replied to your message.', messageId: '790', channelId: '456' }` |

### 2.4 Task / Kanban Notifications

| Event Name | Trigger Condition | Target Audience (Socket Room) | Payload Example |
| :--- | :--- | :--- | :--- |
| `notification:task-assigned` | When a Kanban task is assigned to a specific user. | `user_room_${assigneeId}` | `{ type: 'TASK_ASSIGNED', message: 'You were assigned to task: "Design UI"', taskId: '999' }` |
| `notification:task-status-changed`| When a task is moved (e.g., Todo -> Done). | `channel_room_${channelId}` | `{ type: 'TASK_UPDATE', message: 'Task "Design UI" was moved to Done', taskId: '999' }` |

### 2.5 WebRTC / Call Notifications

| Event Name | Trigger Condition | Target Audience (Socket Room) | Payload Example |
| :--- | :--- | :--- | :--- |
| `notification:call-started` | When a user initiates a voice/video call in a channel. | `channel_room_${channelId}` (excluding the initiator) | `{ type: 'CALL_STARTED', message: 'A meeting started in #general', channelId: '456' }` |

---

## 3. Implementation Steps for Backend Team

1. **Socket Room Management Update**: 
   - Ensure that upon connection, the socket joins a personal room: `socket.join(user_room_${user._id})`.
   - Ensure the socket joins the workspace room upon connection/authentication.

2. **Event Emitters in Controllers/Services**:
   - Inject the Socket/Redis service into your HTTP controllers (e.g., `ChannelController`, `WorkspaceController`).
   - When a database operation succeeds (e.g., `ChannelMember.create(...)`), immediately invoke the socket emission to the relevant room.

3. **Database Persistence**:
   - Create a `Notification` model.
   - Wrap the creation of a notification record and the socket emission in a unified service method (e.g., `NotificationService.sendAndSave(...)`) so they always fire together.

4. **REST API for Notifications**:
   - Create an endpoint `GET /api/v1/notifications` for the frontend to fetch historical notifications (e.g., last 50 unread notifications) upon initial login/page load.
   - Create an endpoint `PUT /api/v1/notifications/:id/read` to mark notifications as read.

---

> [!IMPORTANT]
> **To the Backend Team**: Please ensure all event names are namespaced properly (e.g., prefixing with `notification:`) to prevent conflicts with our existing `webrtc:` or chat events. Once these events are emitting properly and the GET endpoint is ready, let the frontend team know so we can implement the Toast UI and notification dropdown!
