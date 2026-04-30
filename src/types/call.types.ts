export interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  participant?: any;
  channel?: any;
  workspaceMembers?: any[];
  currentUser?: any;
  isVideoOff?: boolean;
  connectionState?: string;
}

export interface CallRoomProps {
  channelId: string;
  onClose?: () => void;
  isAudioOnly?: boolean;
  channel?: any;
  workspaceMembers?: any[];
}