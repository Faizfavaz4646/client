import { useState, useEffect } from 'react';
import { socketService } from '@/lib/services/socket.service';
import { webrtcService } from '@/lib/services/webrtc.service';

export function useChannelCallTracker(
  channelId: string, 
  channelType: string, 
  isPrivileged: boolean, 
  isCallActive: boolean,
  setIsCallActive: (active: boolean) => void
) {
  const [isCallOngoing, setIsCallOngoing] = useState(false);
  const [isCheckingCall, setIsCheckingCall] = useState(true);
  const [bannerState, setBannerState] = useState<'visible' | 'hidden' | 'rejected'>('visible');
  
  const [isAudioOnlyMode, setIsAudioOnlyMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`call_type_${channelId}`);
      return saved === 'AUDIO';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`call_type_${channelId}`, isAudioOnlyMode ? 'AUDIO' : 'VIDEO');
    }
  }, [isAudioOnlyMode, channelId]);

  useEffect(() => {
    if (!socketService.socket) {
      socketService.connect();
    }
    
    const socket = socketService.socket;
    if (!socket) return;

    setIsCheckingCall(true);

    socket.emit("webrtc:check-call", { roomId: channelId }, (res?: { isOngoing: boolean }) => {
      const ongoing = !!res?.isOngoing;
      setIsCallOngoing(ongoing);
      if (ongoing) {
        setBannerState('visible');
      }
      setIsCheckingCall(false);
    });

    const handleCallStatusResponse = (data: { roomId: string; isOngoing: boolean }) => {
      if (data.roomId === channelId) {
        setIsCallOngoing(prev => {
          if (!prev && data.isOngoing) setBannerState('visible');
          return data.isOngoing;
        });
        setIsCheckingCall(false);
      }
    };

    const handleCallStatusChanged = (data: { roomId: string; isOngoing: boolean }) => {
      if (data.roomId === channelId) {
        setIsCallOngoing(prev => {
          if (!prev && data.isOngoing) setBannerState('visible');
          return data.isOngoing;
        });

        if (!data.isOngoing) {
          setIsCallActive(false);
          setBannerState('visible');
          setIsAudioOnlyMode(false);
        }
      }
    };

    const handleNewMessage = (msg: { channelId: string, content: string }) => {
      if (msg.channelId === channelId) {
        if (msg.content === "@@SYSTEM_CALL_TYPE:AUDIO") {
          setIsAudioOnlyMode(true);
        } else if (msg.content === "@@SYSTEM_CALL_TYPE:VIDEO") {
          setIsAudioOnlyMode(false);
        }
      }
    };

    socket.on("webrtc:call-status-response", handleCallStatusResponse);
    socket.on("webrtc:call-status-changed", handleCallStatusChanged);
    socket.on("new-message", handleNewMessage);

    webrtcService.onParticipantJoined = () => {
      if (isPrivileged && isCallActive) {
        const typeStr = isAudioOnlyMode ? "AUDIO" : "VIDEO";
        socketService.sendMessage(channelId, `@@SYSTEM_CALL_TYPE:${typeStr}`);
      }
    };

    return () => {
      socket.off("webrtc:call-status-response", handleCallStatusResponse);
      socket.off("webrtc:call-status-changed", handleCallStatusChanged);
      socket.off("new-message", handleNewMessage);
      webrtcService.onParticipantJoined = null;
    };
  }, [channelId, channelType, isPrivileged, isCallActive, isAudioOnlyMode, setIsCallActive]);

  useEffect(() => {
    const timer = setTimeout(() => setIsCheckingCall(false), 2500);
    return () => clearTimeout(timer);
  }, [channelType, channelId]);

  return {
    isCallOngoing,
    setIsCallOngoing,
    isCheckingCall,
    bannerState,
    setBannerState,
    isAudioOnlyMode,
    setIsAudioOnlyMode
  };
}
