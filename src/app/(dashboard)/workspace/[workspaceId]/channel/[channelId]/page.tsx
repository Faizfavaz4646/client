"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Hash, Mic, Video, Music,
  Send, PlusCircle, Smile,
  UserPlus, Settings2, Info,
  Loader2, X, Phone, PhoneOff, ChevronUp, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatRoom from '@/components/chat/ChatRoom';
import CallRoom from '@/components/chat/CallRoom';
import { useAuthStore } from '@/store/authStore';
import { socketService } from '@/lib/services/socket.service';

export default function ChannelPage() {
  const { workspaceId, channelId } = useParams();
  const [channel, setChannel] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Call state tracking
  const [isCallActive, setIsCallActive] = React.useState(false); // Are they currently in the call grid?
  const [isCallOngoing, setIsCallOngoing] = React.useState(false); // Is there an active call happening in this channel?
  const [isAudioOnlyMode, setIsAudioOnlyMode] = React.useState(false);
  const [isCheckingCall, setIsCheckingCall] = React.useState(true); // Loading state for backend response
  const [bannerState, setBannerState] = React.useState<'visible' | 'hidden' | 'rejected'>('visible'); // Banner display state
  
  const user = useAuthStore((state) => state.user);
  const isPrivileged = user?.organizations?.some(org => org.role === 'admin' || org.role === 'owner');

  // Reset the call state if they switch to a different channel in the sidebar
  React.useEffect(() => {
    setIsCallActive(false);
  }, [channelId]);

  React.useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/channels/workspace/${workspaceId}`);
        const currentChannel = res.data.data.channels.find((c: any) => c._id === channelId || c.id === channelId);
        setChannel(currentChannel);
      } catch (err) {
        console.error("Failed to fetch channel", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId && channelId) {
      fetchChannelData();
    }
  }, [workspaceId, channelId]);

  // Real-time call tracking
  React.useEffect(() => {
    // We now track calls on ALL channels
    if (!socketService.socket) {
      socketService.connect();
    }
    
    const socket = socketService.socket;
    if (!socket) return;

    setIsCheckingCall(true);

    // Ask backend if a call is ongoing
    socket.emit("webrtc:check-call", { roomId: channelId }, (res?: { isOngoing: boolean }) => {
      setIsCallOngoing(prev => {
        if (!prev && res?.isOngoing) setBannerState('visible');
        return res?.isOngoing || false;
      });
      setIsCheckingCall(false);
    });

    // Fallback if backend uses emit instead of direct acknowledgement
    socket.on("webrtc:call-status-response", (data: { roomId: string; isOngoing: boolean }) => {
      if (data.roomId === channelId) {
        setIsCallOngoing(prev => {
          if (!prev && data.isOngoing) setBannerState('visible');
          return data.isOngoing;
        });
        setIsCheckingCall(false);
      }
    });

    // Listen to real-time events from backend
    socket.on("webrtc:call-status-changed", (data: { roomId: string; isOngoing: boolean }) => {
      if (data.roomId === channelId) {
        setIsCallOngoing(prev => {
          if (!prev && data.isOngoing) setBannerState('visible');
          return data.isOngoing;
        });

        // If the call stops (owner/last user left), force close the call room for everyone
        if (!data.isOngoing) {
          setIsCallActive(false);
          setBannerState('visible'); // Reset banner for next time
          setIsAudioOnlyMode(false); // Reset mode for next time
        }
      }
    });

    // Listen for Ghost Messages to sync the call type (Audio vs Video)
    socket.on("new-message", (msg: { channelId: string, content: string }) => {
      if (msg.channelId === channelId) {
        if (msg.content === "@@SYSTEM_CALL_TYPE:AUDIO") {
          setIsAudioOnlyMode(true);
        } else if (msg.content === "@@SYSTEM_CALL_TYPE:VIDEO") {
          setIsAudioOnlyMode(false);
        }
      }
    });

    return () => {
      socket.off("webrtc:call-status-response");
      socket.off("webrtc:call-status-changed");
      socket.off("new-message");
    };
  }, [channelId, channel?.type]);

  // Temporary safety fallback so frontend works immediately even if backend endpoint isn't ready
  React.useEffect(() => {
    const timer = setTimeout(() => setIsCheckingCall(false), 2500);
    return () => clearTimeout(timer);
  }, [channel?.type, channelId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-slate-400">
        <Info className="w-12 h-12 mb-4 opacity-20" />
        <p>Channel not found.</p>
      </div>
    );
  }

  // --- UNIFIED CHANNEL UI ---
  // We use a Split Screen layout: Chat on the left, Call on the right.
  return (
    <div className="flex w-full h-full relative overflow-hidden bg-transparent">
      
      {/* 🚀 Interactive Call Notification Banner (For Members) */}
      <AnimatePresence>
        {isCallOngoing && !isCallActive && bannerState === 'visible' && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] bg-[#111]/95 backdrop-blur-xl border border-emerald-500/30 text-white pl-6 pr-3 py-3 rounded-full shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] flex items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                <Phone className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div className="flex flex-col mr-2">
                <span className="text-sm font-bold leading-tight">
                  Incoming {isAudioOnlyMode ? "Audio" : "Video"} Call...
                </span>
                <span className="text-[11px] text-slate-400 leading-tight">from #{channel.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <button 
                onClick={() => {
                  // Explicitly join as the detected type (Audio vs Video)
                  setIsCallActive(true);
                }}
                title="Join Call"
                className="w-10 h-10 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all active:scale-95 group"
              >
                <Phone className="w-4 h-4 shadow-sm group-hover:scale-110 transition-transform" />
              </button>
              
              <button 
                onClick={() => setBannerState('rejected')}
                title="Reject Call"
                className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all active:scale-95 group"
              >
                <PhoneOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              <button 
                onClick={() => setBannerState('hidden')}
                title="Hide Banner"
                className="w-8 h-8 ml-1 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⏬ Floating minified widget when call notification is hidden */}
      <AnimatePresence>
        {isCallOngoing && !isCallActive && bannerState === 'hidden' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute top-6 right-6 z-[60]"
          >
            <button
               onClick={() => setBannerState('visible')}
               className="flex items-center gap-2 px-3 py-1.5 bg-[#111]/90 backdrop-blur-xl border border-emerald-500/30 rounded-full shadow-lg hover:bg-[#222] transition-all group"
            >
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs font-semibold text-emerald-400 pr-1">Call Ongoing</span>
               <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 Left Panel: Chat Room */}
      <div className={`flex flex-col h-full bg-transparent transition-all duration-500 ease-in-out ${isCallActive ? 'w-full md:w-7/12 lg:w-2/3 md:border-r border-white/10 hidden md:flex' : 'w-full'}`}>
        
        {/* Unified Channel Header & Owner Call Controls */}
        <div className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Hash className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            <span className="text-[15px] font-bold text-slate-200">{channel.name}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Owner Restricted Call Area */}
            {isPrivileged ? (
              <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg p-1">
                <button 
                  onClick={() => { 
                    socketService.sendMessage(channelId as string, "@@SYSTEM_CALL_TYPE:VIDEO");
                    setIsAudioOnlyMode(false); 
                    setIsCallOngoing(true); 
                    setIsCallActive(true); 
                  }}
                  className={`p-1.5 rounded-md transition-all group relative ${isCallOngoing ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  <Video className="w-4 h-4" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                    {isCallOngoing ? "Call in progress" : "Start Video Call"}
                  </span>
                </button>
                <button 
                  onClick={() => { 
                    socketService.sendMessage(channelId as string, "@@SYSTEM_CALL_TYPE:AUDIO");
                    setIsAudioOnlyMode(true); 
                    setIsCallOngoing(true); 
                    setIsCallActive(true); 
                  }}
                  className={`p-1.5 rounded-md transition-all group relative ${isCallOngoing ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  <Phone className="w-4 h-4" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                    {isCallOngoing ? "Call in progress" : "Start Audio Call"}
                  </span>
                </button>
              </div>
            ) : isCallOngoing ? (
              // Member View: Call indicator
              <div className="text-xs font-medium text-slate-500 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                <span className="text-emerald-400 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Call Active</span>
              </div>
            ) : null}
            
            <div className="w-px h-6 bg-white/10 ml-2" />
            <button className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Channel Settings"><Settings2 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* The Actual Chat Area */}
        <div className="flex-1 min-h-0 relative z-10 w-full overflow-hidden">
           <ChatRoom channelId={channelId as string} channel={channel} />
        </div>
      </div>

      {/* 📹 Right Panel: Call Room Grid (Only visible when joined) */}
      <AnimatePresence>
        {isCallActive && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: 50 }}
            animate={{ width: "100%", opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 50 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            className="w-full md:w-5/12 lg:w-1/3 min-w-[320px] max-w-[500px] h-full bg-[#050505] relative z-40 shrink-0 md:border-l border-white/5 overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Call Room header just for nice UX so they can close it */}
            <div className="h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-4 shrink-0 absolute top-0 left-0 right-0 z-50">
               <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 Active Call
               </div>
               <button onClick={() => setIsCallActive(false)} className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-all text-xs font-semibold flex items-center gap-1.5">
                 <X className="w-3.5 h-3.5" /> Close Grid
               </button>
            </div>
            {/* Push down CallRoom slightly to account for the new header */}
            <div className="flex-1 mt-14 relative h-[calc(100%-3.5rem)]">
               <CallRoom channelId={channelId as string} isAudioOnly={isAudioOnlyMode} channel={channel} onClose={() => setIsCallActive(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}