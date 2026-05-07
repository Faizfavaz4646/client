# Task Checklist: WebRTC & Task UI Improvements

- [x] Fix WebRTC `toggleMedia` Bug
  - [x] Update `toggleMedia` in `src/lib/services/webrtc.service.ts` to include both `cameraEnabled` and `micEnabled` in the payload.
- [x] Implement Background Call (Hide Grid)
  - [x] Add `isHidden` prop to `CallRoom.tsx`.
  - [x] Handle automatic video mute/unmute when `isHidden` changes.
  - [x] Add `isCallVisible` state to `page.tsx`.
  - [x] Update "Close Grid" button to "Hide Grid" and toggle `isCallVisible(false)`.
  - [x] Update Banner to show "Return to Call" when call is active but hidden.
- [x] Fix Task Modal UI
  - [x] Change `DatePicker.tsx` popover to open upwards (`bottom-full mb-2`).
  - [x] Change Priority and Assignee dropdowns in `TaskModal.tsx` to open upwards.
  - [x] Add click-outside listener to `TaskModal.tsx` to close dropdowns.
  - [x] Ensure opening one dropdown closes the other.
