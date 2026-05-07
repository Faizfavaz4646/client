# Implementation Plan: Frontend Real-Time Notifications

## Problem Summary
The backend team has deployed a robust real-time notification system. We need to integrate it into the SYNQ frontend with premium styling, following the architectural request for separate service, type, and state files to ensure clean debugging.

## Proposed Changes

### 1. Types & Models
**File:** `src/types/notification.types.ts` [NEW]
- Define `INotification` interface to match the backend structure (`recipientId`, `senderId` (populated), `type`, `title`, `message`, `metadata`, `isRead`, `createdAt`).
- Define `NotificationType` enum.

### 2. API Service
**File:** `src/lib/services/notification.service.ts` [NEW]
- Expose methods: `getNotifications(page, limit, unreadOnly)`, `markAsRead(notificationId)`, and `markAllAsRead()`.

### 3. State Management
**File:** `src/store/notificationStore.ts` [NEW]
- Create a Zustand store (`useNotificationStore`) to manage the global notification state.
- Actions: `setNotifications`, `addNotification`, `markAsRead`, `markAllAsRead`, `setUnreadCount`.

### 4. Socket Integration
**File:** `src/lib/services/socket.service.ts`
- Add listeners for `"new-notification"` to wire up real-time delivery to the Zustand store.

### 5. Premium UI Components
**File:** `src/components/workspace/NotificationBell.tsx` [NEW]
- Create a beautiful, glassmorphic dropdown UI.
- Features: 
  - Bell icon with pulsing unread badge.
  - Dropdown listing notifications.
  - "Mark all as read" button.
  - Premium animations via framer-motion.
  - Visual distinction between read and unread notifications.
- Integrate it into `src/app/(dashboard)/layout.tsx` (replacing the current dummy Bell icon).

**File:** `src/components/workspace/NotificationItem.tsx` [NEW]
- A modular list item component displaying the sender's avatar, title, message, and a timestamp.

---

## User Review Required
- Does this architecture (Zustand global store + explicit service files + Socket integration) align with your expectations for the frontend codebase?
- Please approve this plan so I can start executing!
