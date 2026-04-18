import { socketService } from "./socket.service";//for signaling
import { 
  IWebRTCParticipantsPayload, 
  IWebRTCSignalPayload, 
  IWebRTCUserLeftPayload,
  IWebRTCJoinPayload,
  IWebRTCMediaTogglePayload,
  IWebRTCLeavePayload,
  IWebRTCParticipant
} from "@/types/webrtc"; 

// Standard STUN servers to help peers find each other
//NAT hides a device’s private IP behind a public IP, making direct peer-to-peer communication difficult.
//STUN helps a device discover its public IP address so peers can attempt direct communication.”
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

class WebRTCService {
  public localStream: MediaStream | null = null;
  public peers: Map<string, RTCPeerConnection> = new Map();
  public currentRoomId: string | null = null;
  
  // Callbacks so our React UI can update when videos arrive or leave
  public onRemoteStreamAdd: ((socketId: string, stream: MediaStream) => void) | null = null;
  public onRemoteStreamRemove: ((socketId: string) => void) | null = null;
  public onCallForcedEnd: (() => void) | null = null;
  
  // Participant State Tracking
  public participants: Map<string, Pick<IWebRTCParticipant, 'userId' | 'cameraEnabled'>> = new Map();
  public onParticipantMetadataUpdate: ((participants: Map<string, Pick<IWebRTCParticipant, 'userId' | 'cameraEnabled'>>) => void) | null = null;
  public onParticipantJoined: ((socketId: string) => void) | null = null;
  
  // ICE Candidate Queue map to prevent premature injections before remote SDP is set
  private iceQueues: Map<string, any[]> = new Map();

  // 1. Initialize User Media (Camera/Mic)
  async startLocalMedia(video = true, audio = true, options?: { startVideoMuted?: boolean; startAudioMuted?: boolean }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });

      // Apply initial mute states immediately if requested
      if (options?.startVideoMuted) {
        this.localStream.getVideoTracks().forEach(t => t.enabled = false);
      }
      if (options?.startAudioMuted) {
        this.localStream.getAudioTracks().forEach(t => t.enabled = false);
      }

      return this.localStream;
    } catch (error) {
      // Fallback: If camera is requested but missing/denied, try audio-only automatically
      if (video) {
        console.warn("⚠️ Camera failed, trying audio-only fallback...");
        return this.startLocalMedia(false, true, options);
      }
      console.error("🚨 Failed to get local media", error);
      throw error;
    }
  }

  // 2. Stop Media
  stopLocalMedia(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // 3. Join a Room and Setup Listeners
  joinCall(roomId: string): void {
    const socket = socketService.socket;
    if (!socket) return console.error("Socket not connected!");

    this.currentRoomId = roomId;

    const micEnabled = this.localStream?.getAudioTracks()[0]?.enabled ?? false;
    const cameraEnabled = this.localStream?.getVideoTracks()[0]?.enabled ?? false;

    const joinPayload: IWebRTCJoinPayload = { roomId, micEnabled, cameraEnabled };
    socket.emit("webrtc:join", joinPayload);

    // Listen for existing people
    socket.off("webrtc:participants");
    socket.on("webrtc:participants", async (data: IWebRTCParticipantsPayload) => {
      console.log("👥 Existing participants:", data.participants);
      data.participants.forEach(p => {
        this.participants.set(p.socketId, { userId: p.userId, cameraEnabled: p.cameraEnabled });
      });
      this.triggerParticipantUpdate();

      for (const participant of data.participants) {
        if (participant.socketId !== socket.id) {
          await this.initiateCall(participant.socketId);
        }
      }
    });

    socket.off("webrtc:user-joined");
    socket.on("webrtc:user-joined", (data: { roomId: string, participant: IWebRTCParticipant }) => {
      console.log("👋 New participant joined:", data.participant);
      this.participants.set(data.participant.socketId, { userId: data.participant.userId, cameraEnabled: data.participant.cameraEnabled });
      this.triggerParticipantUpdate();
      if (this.onParticipantJoined) {
        this.onParticipantJoined(data.participant.socketId);
      }
    });

    socket.off("webrtc:media-state-changed");
    socket.on("webrtc:media-state-changed", (data: { socketId: string, userId: string, micEnabled: boolean, cameraEnabled: boolean }) => {
      const p = this.participants.get(data.socketId);
      if (p) {
        p.cameraEnabled = data.cameraEnabled;
        this.participants.set(data.socketId, p);
        this.triggerParticipantUpdate();
      }
    });

    // 5. Handle incoming signals
    socket.off("webrtc:signal");
    socket.on("webrtc:signal", async (data: IWebRTCSignalPayload) => {
      // PRO TIP: When the backend relays a signal, it includes the sender's userId.
      // We catch it here so the UI can resolve "Unknown User" immediately!
      if (data.senderSocketId && data.userId) {
        const existing = this.participants.get(data.senderSocketId);
        this.participants.set(data.senderSocketId, { 
          userId: data.userId, 
          cameraEnabled: existing?.cameraEnabled ?? true 
        });
        this.triggerParticipantUpdate();
      }

      if (data.senderSocketId) {
        await this.handleIncomingSignal(data.senderSocketId, data.signal);
      }
    });

    // Listen for users dropping off
    socket.off("webrtc:user-left");
    socket.on("webrtc:user-left", (data: IWebRTCUserLeftPayload) => {
      this.participants.delete(data.socketId);
      this.triggerParticipantUpdate();
      this.removePeer(data.socketId);
    });
  }

  private triggerParticipantUpdate(): void {
    if (this.onParticipantMetadataUpdate) {
      // Pass a clone to ensure React state updates
      this.onParticipantMetadataUpdate(new Map(this.participants));
    }
  }

  // Helper to remove a peer completely
  private removePeer(socketId: string): void {
    const peer = this.peers.get(socketId);
    if (peer) {
      peer.close();
      this.peers.delete(socketId);
    }
    if (this.onRemoteStreamRemove) {
      this.onRemoteStreamRemove(socketId);
    }
  }

  // 4. Create a Peer Connection and Send an Offer
  private async initiateCall(targetSocketId: string): Promise<void> {
    if (!this.currentRoomId) return;

    const peer = this.createPeerConnection(targetSocketId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    const signalPayload: IWebRTCSignalPayload = {
      targetSocketId,
      signal: offer,
      roomId: this.currentRoomId
    };

    socketService.socket?.emit("webrtc:signal", signalPayload);
  }

  // 5. Handle Incoming Signals (Professional Switch Architecture & ICE Queue)
  private async handleIncomingSignal(senderSocketId: string, signal: any): Promise<void> {
    if (!this.currentRoomId) return;

    let peer = this.peers.get(senderSocketId);

    if (!peer) {
      peer = this.createPeerConnection(senderSocketId);
    }

    // A. Handle ICE Candidates immediately with Queueing Strategy
    if (signal.candidate) {
      try {
        if (peer.remoteDescription && peer.remoteDescription.type) {
          await peer.addIceCandidate(new RTCIceCandidate(signal));
        } else {
          // If offer/answer hasn't arrived yet, queue the ICE candidates
          const queue = this.iceQueues.get(senderSocketId) || [];
          queue.push(signal);
          this.iceQueues.set(senderSocketId, queue);
        }
      } catch (err) {
        console.error("Failed to add ICE Candidate:", err);
      }
      return; 
    }

    // B. Clean Switch statement for the SDP signal types
    switch (signal.type) {
      case "system_force_end":
        if (this.onCallForcedEnd) this.onCallForcedEnd();
        return;

      case "offer":
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          
          // Process any queued ICE candidates now that remote is set
          const qOffer = this.iceQueues.get(senderSocketId) || [];
          for (const c of qOffer) {
            await peer.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error("ICE Queue error:", e));
          }
          this.iceQueues.delete(senderSocketId);

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          
          const signalPayload: IWebRTCSignalPayload = {
            targetSocketId: senderSocketId,
            signal: answer,
            roomId: this.currentRoomId
          };
          socketService.socket?.emit("webrtc:signal", signalPayload);
        } catch (err) {
          console.error("Failed to handle offer SDP:", err);
        }
        break;

      case "answer":
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          
          // Process any queued ICE candidates for the answer
          const qAnswer = this.iceQueues.get(senderSocketId) || [];
          for (const c of qAnswer) {
            await peer.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error("ICE Queue error:", e));
          }
          this.iceQueues.delete(senderSocketId);
        } catch (err) {
            console.error("Failed to handle answer SDP:", err);
        }
        break;

      default:
        console.warn("⚠️ Received unknown WebRTC signal type:", signal?.type);
        break;
    }
  }

  // 6. The WebRTC Engine Room
  private createPeerConnection(targetSocketId: string): RTCPeerConnection {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(targetSocketId, peer);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peer.addTrack(track, this.localStream!);
      });
    }

    peer.ontrack = (event) => {
      if (this.onRemoteStreamAdd) {
        this.onRemoteStreamAdd(targetSocketId, event.streams[0]);
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && this.currentRoomId) {
        const signalPayload: IWebRTCSignalPayload = {
          targetSocketId,
          signal: event.candidate,
          roomId: this.currentRoomId
        };
        socketService.socket?.emit("webrtc:signal", signalPayload);
      }
    };

    return peer;
  }

  // 7. Toggle Media
  toggleMedia(type: 'video' | 'audio', isEnabled: boolean): void {
    if (!this.localStream || !this.currentRoomId) return;
    
    const payload: IWebRTCMediaTogglePayload = { roomId: this.currentRoomId };

    if (type === 'video') {
      const track = this.localStream.getVideoTracks()[0];
      if (track) track.enabled = isEnabled;
      payload.cameraEnabled = isEnabled;
    } else {
      const track = this.localStream.getAudioTracks()[0];
      if (track) track.enabled = isEnabled;
      payload.micEnabled = isEnabled;
    }

    socketService.socket?.emit("webrtc:toggle-media", payload);
  }

  // 8. Screen Sharing
  public screenStream: MediaStream | null = null;

  async startScreenShare(): Promise<MediaStream | null> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      
      const track = this.screenStream.getVideoTracks()[0];
      
      // Replace the camera feed with screen share in all active connections
      this.peers.forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(track);
      });

      // Broadcast state to UI
      if (this.currentRoomId) {
        socketService.socket?.emit("webrtc:toggle-screen-share", { roomId: this.currentRoomId, isSharing: true });
      }

      // Automatically revert to camera if user clicks browser's native "Stop sharing" button
      track.onended = () => this.stopScreenShare();
      
      return this.screenStream;
    } catch (err) {
      console.error("Screen sharing cancelled or failed", err);
      return null;
    }
  }

  stopScreenShare(): void {
    if (!this.screenStream) return;
    
    // Stop the explicit screen track
    this.screenStream.getTracks().forEach(t => t.stop());
    this.screenStream = null;

    // Grab original camera feed
    const localVideoTrack = this.localStream?.getVideoTracks()[0];
    if (localVideoTrack) {
      this.peers.forEach(peer => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(localVideoTrack);
      });
    }

    if (this.currentRoomId) {
      socketService.socket?.emit("webrtc:toggle-screen-share", { roomId: this.currentRoomId, isSharing: false });
    }
  }

  // 9. Global Kick
  forceEndCallGlobally(): void {
    if (!this.currentRoomId) return;

    // Send the kill signal explicitly to all peers we are connected to
    this.peers.forEach((peer, targetSocketId) => {
      socketService.socket?.emit("webrtc:signal", {
        targetSocketId,
        signal: { type: "system_force_end" },
        roomId: this.currentRoomId
      });
    });

    this.leaveCall();
  }

  // 10. Cleanup
  //closes all peers
//stops media
//clears state
  leaveCall(): void {
    if (this.currentRoomId) {
      const payload: IWebRTCLeavePayload = { roomId: this.currentRoomId };
      socketService.socket?.emit("webrtc:leave", payload);
    }

    this.stopScreenShare();
    this.peers.forEach(peer => peer.close());
    this.peers.clear();
    this.stopLocalMedia();
    this.currentRoomId = null;
  }
}

export const webrtcService = new WebRTCService();