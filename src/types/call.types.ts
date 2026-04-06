

export interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  participant?: any;
  channel?: any;
  currentUser?: any;
  isVideoOff?: boolean;
}

export interface CallRoomProps {
  channelId: string;
  onClose?: () => void;
  isAudioOnly?: boolean;
  channel?: any;
}