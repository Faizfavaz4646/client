# Backend Engineering Tasks: WebRTC & Signaling Hardening

This document outlines the required backend updates to ensure the video/audio calling system is production-ready, secure, and scalable.

---

## 1. Consolidate Signaling Handlers
**Current Issue**: Redundant logic exists in `socket.handler.ts` (using `video:*` prefix) and `webrtc.handler.ts` (using `webrtc:*` prefix).
- **Task**: Remove all calling/signaling logic from `socket.handler.ts` (lines 255–285).
- **Goal**: Centralize all signaling in `webrtc.handler.ts` to prevent event collision and logic duplication.

## 2. Enforce Room Size Limits (Mesh Protection)
**Current Issue**: In the current Mesh architecture, calls with 6+ users will cause high CPU/Bandwidth issues for clients.
- **Task**: Modify `joinRoom` in `call.manager.ts` to check the current participant count.
- **Requirement**: Define a constant `MAX_WEBRTC_PARTICIPANTS = 6`. If a user attempts to join a full room, emit a `webrtc:error` event and prevent the join.
- **Benefit**: Protects users from "Room Bombing" or accidental crashes in large channels.

## 3. Dynamic TURN Credential Generation
**Current Issue**: TURN credentials (username/password) are currently hardcoded in the frontend.
- **Task**: Implement a new socket event `webrtc:get-ice-servers` or a REST endpoint.
- **Requirement**: Use a service like Metered.ca, Twilio, or a local COTURN secret to generate **time-limited, temporary credentials**.
- **Payload Example**:
  ```json
  {
    "iceServers": [
      { "urls": "stun:..." },
      { "urls": "turn:...", "username": "temp-user", "credential": "temp-password" }
    ]
  }
  ```

## 4. Signal Relay Validation (Security)
**Current Issue**: The `webrtc:signal` relay currently sends signals to any `targetSocketId` without verifying if both users are actually in the same room.
- **Task**: Update the `webrtc:signal` event in `webrtc.handler.ts`.
- **Requirement**: Before calling `io.to(targetSocketId).emit`, verify that both the `sender` and the `target` are present in the same `roomId` within the `callManager` state.
- **Benefit**: Prevents malicious users from sending signaling spam to random connected sockets.

## 5. Metadata Enrichment
**Current Issue**: The frontend needs to resolve names/avatars for participants quickly.
- **Task**: When `webrtc:participants` or `webrtc:user-joined` is emitted, ensure the payload includes the `userId`.
- **Optimization**: Consider populating basic user info (name, avatar) from the database once when the user joins, and including it in the `Participant` object in `call.manager.ts`.

## 6. Heartbeat & Cleanup Sync
**Current Issue**: If a socket disconnects abruptly, the `CallManager` might occasionally fall out of sync with the actual Socket.io room state.
- **Task**: Audit the `disconnect` listener in `webrtc.handler.ts`.
- **Requirement**: Ensure `leaveRoom` is called for every room the user was part of. Consider a periodic "Garbage Collection" check for rooms that have no active socket members but still exist in memory.
