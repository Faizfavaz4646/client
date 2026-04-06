"use client";
import { useEffect, useRef } from "react";
import { VideoPlayerProps } from "@/types/call.types";

export default function VideoPlayer({ stream, isLocal = false, participant, channel, currentUser, isVideoOff }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Try to find full user details
  let userDetails: any = null;
  if (isLocal && currentUser) {
    userDetails = currentUser;
  } else if (participant?.userId && channel?.members) {
    userDetails = channel.members.find((m: any) => m.id === participant.userId || m._id === participant.userId || m.userId === participant.userId || (m.userId && m.userId._id === participant.userId));
    if (userDetails?.userId) userDetails = userDetails.userId; // Unwrap populated userId field
  }

  const name = userDetails?.name || userDetails?.username || (isLocal ? "You" : "Unknown User");
  const avatar = userDetails?.avatar;
  const initial = name.charAt(0).toUpperCase();

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
            <img src={avatar} alt={name} className="w-24 h-24 rounded-full shadow-2xl border border-white/10 object-cover mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full shadow-2xl border border-white/10 bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
               <span className="text-white text-4xl font-bold">{initial}</span>
            </div>
          )}
          <span className="text-slate-300 font-medium text-[15px] bg-black/50 px-4 py-1.5 rounded-full border border-white/5">{name}</span>
        </div>
      )}

      {/* Name Badges for active video */}
      {!isVideoOff && (
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium rounded-md text-white border border-white/10">
          {isLocal ? "You" : name}
        </div>
      )}
    </div>
  );
}