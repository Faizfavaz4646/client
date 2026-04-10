import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, ChevronUp, ChevronDown } from 'lucide-react';

interface CallNotificationBannerProps {
  isCallOngoing: boolean;
  isCallActive: boolean;
  bannerState: 'visible' | 'hidden' | 'rejected';
  isAudioOnlyMode: boolean;
  channel: any;
  setBannerState: (state: 'visible' | 'hidden' | 'rejected') => void;
  setIsAudioOnlyMode: (val: boolean) => void;
  setIsCallActive: (val: boolean) => void;
}

export function CallNotificationBanner({
  isCallOngoing,
  isCallActive,
  bannerState,
  isAudioOnlyMode,
  channel,
  setBannerState,
  setIsAudioOnlyMode,
  setIsCallActive
}: CallNotificationBannerProps) {
  return (
    <>
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
                <span className="text-[11px] text-slate-400 leading-tight">from #{channel?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <button 
                onClick={() => {
                  setIsAudioOnlyMode(isAudioOnlyMode); 
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
    </>
  );
}
