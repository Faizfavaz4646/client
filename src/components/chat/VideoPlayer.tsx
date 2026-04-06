"use client";
import { useEffect, useRef } from "react";
import { VideoPlayerProps } from "@/types/call.types"; // Import the type!

export default function VideoPlayer({ stream, isLocal = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} 
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`} 
      />
      {isLocal && (
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium rounded-md text-white border border-white/10">
          You
        </div>
      )}
    </div>
  );
}