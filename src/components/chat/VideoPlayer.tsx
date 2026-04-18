"use client";
import { useEffect, useRef } from "react";
import { VideoPlayerProps } from "@/types/call.types";

export default function VideoPlayer({ stream, isLocal = false, participant, channel, workspaceMembers, currentUser, isVideoOff }: VideoPlayerProps) {
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
      const ids = [
        m.id, m._id, 
        m.userId?._id, m.userId?.id, m.userId,
        m.user?._id, m.user?.id, m.user
      ].map(id => String(id || ""));
      
      return ids.includes(String(participant.userId));
    });
    
    // Extract populated user info from any of the common fields
    userDetails = member?.user || member?.userId || member;
  }

  // Final fallback chain for the name - check for displayName/username too
  const rawName = userDetails?.name || userDetails?.username || userDetails?.displayName || userDetails?.email;
  const name = rawName || (isLocal ? "You" : "User " + (participant?.userId?.slice(-4) || "Unknown"));
  const avatar = userDetails?.avatar || userDetails?.profilePicture;
  const initial = name.charAt(0).toUpperCase();

  const finalDisplayName = isLocal ? "You" : name;

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg">
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
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium rounded-md text-white border border-white/10">
          {finalDisplayName}
        </div>
      )}
    </div>
  );
}