# Implementation Plan: WebRTC & UI Improvements

## Problem Summary
1. **WebRTC Media Toggle Bug**: Turning off the mic also turns off the camera, and sometimes causes other participants to see "Connection Lost".
2. **Background Call (Hide Grid)**: Users want to hide the video call grid without leaving the call. When hidden, the camera should automatically turn off (to save bandwidth/privacy), but the microphone should remain active. When re-opened, the camera should automatically turn back on.
3. **Task Modal Dropdowns**: The DatePicker and Assignee dropdowns open downwards and get cut off. They should open upwards. They also need click-outside-to-close behavior, and opening one should close the other.

---

## Proposed Changes

### 1. Fix WebRTC `toggleMedia` Bug
**File:** `src/lib/services/webrtc.service.ts`
- **Issue**: The `toggleMedia` function sends a payload with only `cameraEnabled` or `micEnabled`, leaving the other undefined. The backend likely overwrites the missing state to `false`, causing the camera to turn off when the mic is toggled.
- **Fix**: Update the `payload` to always include both current states:
  ```typescript
  const payload: IWebRTCMediaTogglePayload = { 
    roomId: this.currentRoomId,
    cameraEnabled: this.localStream.getVideoTracks()[0]?.enabled ?? false,
    micEnabled: this.localStream.getAudioTracks()[0]?.enabled ?? false
  };
  // Then update the specific toggled type
  ```

### 2. Implement "Hide Grid" / Background Call Functionality
**File:** `src/app/(dashboard)/workspace/[workspaceId]/channel/[channelId]/page.tsx`
- Rename `isCallActive` concept to `isJoinedCall` to represent the WebRTC connection state.
- Introduce `isCallVisible` to represent whether the grid is open or hidden.
- The "Close Grid" button will now set `isCallVisible(false)` instead of unmounting `CallRoom`. 
- The `CallRoom` component will stay mounted (keeping WebRTC alive) but will visually disappear (using CSS `hidden` or width 0).
- The `CallNotificationBanner` will be updated to show a "Return to Call" button when `isJoinedCall` is true but `isCallVisible` is false.

**File:** `src/components/chat/CallRoom.tsx`
- Add an `isHidden` prop.
- When `isHidden` becomes `true`, automatically turn off the video track (if it was on) and notify the backend.
- When `isHidden` becomes `false`, automatically turn the video track back on.
- The microphone will remain untouched so the user can still participate via voice.

### 3. Task Modal UI Fixes
**File:** `src/components/ui/DatePicker.tsx`
- Change the popover positioning classes from `top-full mt-2` to `bottom-full mb-2` so it opens upwards above the input.

**File:** `src/components/tasks/TaskModal.tsx`
- Change the Assignee and Priority dropdowns positioning to `bottom-full mb-2` so they open upwards.
- Implement a `useRef` and `useEffect` click-outside listener on the parent container to close all open dropdowns (`isAssigneeDropdownOpen`, `isPriorityDropdownOpen`).
- When toggling `isAssigneeDropdownOpen`, force `isPriorityDropdownOpen` to `false` (and vice versa) so they cannot be open simultaneously.

---

## User Review Required
- Does the background call logic sound correct? (Camera off when hidden, Mic stays on, Camera restores when unhidden).
- Please approve this plan so I can begin making the code changes!
