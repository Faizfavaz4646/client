

export interface IWebRTCParticipant {
  socketId: string;
  userId: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
  isScreenSharing: boolean;
}

export interface IWebRTCJoinPayload {
  roomId: string;
  micEnabled?: boolean;
  cameraEnabled?: boolean;
}

export interface IWebRTCParticipantsPayload {
  roomId: string;
  participants: IWebRTCParticipant[];
}

export interface IWebRTCSignalPayload {
  targetSocketId?: string; // Used when sending an offer/answer
  senderSocketId?: string; // Received when getting an offer/answer
  userId?: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit | any;
  roomId: string;
}

export interface IWebRTCMediaTogglePayload {
  roomId: string;
  micEnabled?: boolean;
  cameraEnabled?: boolean;
  isScreenSharing?: boolean;
}

export interface IWebRTCUserLeftPayload {
  socketId: string;
  userId: string;
  roomId: string;
}

export interface IWebRTCLeavePayload {
  roomId: string;
}