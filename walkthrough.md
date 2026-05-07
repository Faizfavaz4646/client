# Walkthrough: Frontend Real-Time Notifications

The real-time notification system has been successfully integrated into the frontend following the requested architectural pattern.

## Implementation Details

### 1. Robust Architecture for Debugging
As requested, the implementation has been split into dedicated files rather than dumping everything into the components:
- **Types (`src/types/notification.types.ts`)**: Defines `INotification` and `NotificationType` to precisely match the MongoDB schema from the backend.
- **API Service (`src/lib/services/notification.service.ts`)**: A dedicated class to handle `getNotifications`, `markAsRead`, and `markAllAsRead` REST API calls.
- **State Management (`src/store/notificationStore.ts`)**: Created a Zustand global store (`useNotificationStore`). This handles state and logic, ensuring the unread count badge stays perfectly synced across the entire application.

### 2. Real-Time Socket Connection
- Updated `src/lib/services/socket.service.ts` with `onNewNotification` and `offNewNotification`.
- When the backend emits a `new-notification` event (e.g., when a user is `@mentioned`), it instantly arrives at the frontend and is injected into the global Zustand store.

### 3. Premium Bell Dropdown UI
- **File**: `src/components/workspace/NotificationBell.tsx`
- **Design Features**:
  - Replaced the static bell icon in the Top Navigation bar with a fully functional, interactive `NotificationBell` component.
  - Features a glowing, pulsing red dot badge when there are unread notifications.
  - Uses `framer-motion` to smoothly animate the glassmorphic (`backdrop-blur-2xl`) dropdown list.
  - Displays the sender's avatar, notification title, descriptive message, and a relative timestamp (e.g., "5 mins ago").
  - Unread notifications are highlighted with a glowing indigo sidebar.
  - Clicking a notification automatically marks it as read via the backend API.
  - Clicking "Mark all read" instantly clears all unread states.
  - Triggers a beautiful Sonner `toast` popup in the bottom corner of the screen whenever a notification arrives in real-time while you're active.

## Verification
- Run `npm run build` locally: **Success (0 errors)**.
- Start the development server and test mentions/invites to see the glowing badge update instantly!
