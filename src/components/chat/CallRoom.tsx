"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { webrtcService } from "@/lib/services/webrtc.service";
import VideoPlayer from "./VideoPlayer";
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertCircle } from "lucide-react";
import { CallRoomProps } from "@/types/call.types";

export default function CallRoom({ channelId }: CallRoomProps) {
  const router = useRouter();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      try {
        // 1. Ask for Camera/Mic permissions
        const stream = await webrtcService.startLocalMedia(true, true);
        
        // Safety check: if user left the page before clicking "Allow", stop the camera immediately
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setLocalStream(stream);
        
        // 2. Join the signaling room
        webrtcService.joinCall(channelId);
        setHasJoined(true);

      } catch (err) {
        console.error("Camera permissions denied or failed", err);
        if (mounted) {
          setError("Camera or microphone access was denied. Please allow permissions in your browser settings to join.");
        }
      }
    };

    initializeCall();

    // 3. Listen for people arriving
    webrtcService.onRemoteStreamAdd = (socketId, stream) => {
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.set(socketId, stream);
        return newMap;
      });
    };

    // 4. Listen for people leaving
    webrtcService.onRemoteStreamRemove = (socketId) => {
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(socketId);
        return newMap;
      });
    };

    // 5. Cleanup when unmounting (leaving the page)
    return () => {
      mounted = false;
      webrtcService.leaveCall();
      setLocalStream(null);
      setRemoteStreams(new Map());
    };
  }, [channelId]);

  // --- Handlers ---
  
  const toggleVideo = () => {
    webrtcService.toggleMedia('video', !isVideoOn);
    setIsVideoOn(!isVideoOn);
  };

  const toggleMic = () => {
    webrtcService.toggleMedia('audio', !isMicOn);
    setIsMicOn(!isMicOn);
  };

  const handleLeaveCall = () => {
    webrtcService.leaveCall();
    router.back(); // Smoothly takes the user back to the previous screen!
  };

  // --- Render States ---

  // State 1: Permission Denied Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0a] text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold mb-2 tracking-tight">Permission Denied</h3>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-white text-black font-medium px-6 py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // State 2: Waiting for Permissions
  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0a] text-white">
        <div className="w-10 h-10 border-[3px] border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Requesting camera access...</p>
      </div>
    );
  }

  // State 3: Active Call UI
  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] p-4 relative overflow-hidden">
      
      {/* 📹 The Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-[minmax(200px,1fr)] max-h-[calc(100%-80px)] overflow-y-auto custom-scrollbar">
        {/* Local User */}
        {localStream && (
          <VideoPlayer stream={localStream} isLocal={true} />
        )}

        {/* Remote Users */}
        {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
          <VideoPlayer key={socketId} stream={stream} isLocal={false} />
        ))}
      </div>

      {/* 🎛️ Control Bar (Sits at the bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#111]/90 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50">
        
        {/* Mic Toggle */}
        <button 
          onClick={toggleMic}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          className={`p-3.5 rounded-xl transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button 
          onClick={toggleVideo}
          title={isVideoOn ? "Turn off Camera" : "Turn on Camera"}
          className={`p-3.5 rounded-xl transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <div className="w-px h-8 bg-white/10 mx-2" />
        
        {/* Disconnect */}
        <button 
          onClick={handleLeaveCall}
          title="Leave Call"
          className="p-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-900/40 active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
}