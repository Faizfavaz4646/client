"use client";
import { useEffect, useRef } from "react";
import { VideoPlayerProps } from "@/types/call.types";
import { Loader2, AlertTriangle, WifiOff } from "lucide-react";

export default function VideoPlayer({ stream, isLocal = false, participant, channel, workspaceMembers, currentUser, isVideoOff, connectionState }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Explicitly trigger play to bypass strict browser autoplay audio/video policies
      videoRef.current.play().catch(e => {
        console.warn("Video auto-play was prevented by the browser:", e);
      });
    }
  }, [stream]);

  // Try to find full user details
  let userDetails: any = null;
  if (isLocal && currentUser) {
    userDetails = currentUser;
  } else if (participant?.userId && (channel?.members || workspaceMembers)) {
    // 1. Combine channel members and workspace members for a full identity pool
    const allKnownMembers = [...(channel?.members || []), ...(workspaceMembers || [])];

    // 2. Universal lookup across all potential backend member structures
    const member = allKnownMembers.find((m: any) => {
      // If m is just a string (ID), compare directly
      if (typeof m === 'string') {
        return m.toLowerCase() === String(participant.userId).toLowerCase();
      }

      const ids = [
        m.id, m._id, 
        m.userId?._id, m.userId?.id, m.userId,
        m.user?._id, m.user?.id, m.user,
        m.memberId?._id, m.memberId?.id, m.memberId
      ].map(id => id ? String(id).trim().toLowerCase() : "");
      
      const targetId = String(participant.userId).trim().toLowerCase();
      return ids.includes(targetId);
    });
    
    // Extract populated user info from any of the common fields
    userDetails = member?.user || member?.userId || member?.memberId || member;
    
    // If userDetails is still just an ID string, reset it so we don't use it as a name
    if (typeof userDetails === 'string') userDetails = null;
  }

  // Final fallback chain for the name - check for displayName/username too
  // Priority: 1. Realtime Metadata from WebRTC | 2. Database User details | 3. Fallback
  const rawName = (participant?.name && participant.name !== "Unknown User" && !participant.name.startsWith("User ")) 
    ? participant.name 
    : (userDetails?.name || userDetails?.username || userDetails?.displayName || userDetails?.email);

  const name = rawName || (isLocal ? "You" : "User " + (participant?.userId?.slice(-4) || "Unknown"));
  const avatar = participant?.avatar || userDetails?.avatar || userDetails?.profilePicture;
  const initial = name.charAt(0).toUpperCase();

  const finalDisplayName = isLocal ? "You" : name;

  return (
    <div className="relative w-full aspect-video bg-[#0b0f1f] rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} 
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''} ${isVideoOff ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
      />

      {/* Audio Only / Camera Off Overlay */}
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111]">
          {avatar ? (
            <img src={avatar} alt={finalDisplayName} className="w-24 h-24 rounded-full shadow-2xl border border-white/10 object-cover mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full shadow-2xl border border-white/10 bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
               <span className="text-white text-4xl font-bold">{initial}</span>
            </div>
          )}
          <span className="text-slate-300 font-medium text-[15px] bg-black/50 px-4 py-1.5 rounded-full border border-white/5">
            {finalDisplayName}
          </span>
        </div>
      )}

      {/* Name Badges for active video */}
      {!isVideoOff && (
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium rounded-md text-white border border-white/10 flex items-center gap-2">
          {finalDisplayName}
          {connectionState === 'connecting' && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
          {connectionState === 'failed' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
          {connectionState === 'disconnected' && <WifiOff className="w-3 h-3 text-red-500" />}
        </div>
      )}

      {/* Full Connection State Overlay */}
      {!isLocal && (connectionState === 'connecting' || connectionState === 'checking') && (
        <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center">
           <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
           <span className="text-xs font-medium text-white/80">Connecting...</span>
        </div>
      )}

      {!isLocal && (connectionState === 'failed' || connectionState === 'disconnected') && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
           <WifiOff className="w-10 h-10 text-red-500 mb-3" />
           <span className="text-sm font-semibold text-white mb-1">Connection Lost</span>
           <span className="text-[10px] text-white/60">The participant is reconnecting or has a poor connection.</span>
        </div>
      )}
    </div>
  );
}