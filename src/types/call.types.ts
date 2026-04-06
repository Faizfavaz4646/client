

export interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
}

export interface CallRoomProps {
  channelId: string;
}