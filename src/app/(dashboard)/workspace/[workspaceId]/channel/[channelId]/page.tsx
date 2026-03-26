"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Hash, Mic, Video, Music, 
  Send, PlusCircle, Smile, 
  UserPlus, Settings2, Info,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChannelPage() {
  const { workspaceId, channelId } = useParams();
  const [channel, setChannel] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setIsLoading(true);
        // Assuming we have an endpoint for single channel or we can filter from workspace channels
        // For now, let's try to get it from the workspace channels list
        const res = await api.get(`/channels/workspace/${workspaceId}`);
        const currentChannel = res.data.data.channels.find((c: any) => c._id === channelId || c.id === channelId);
        setChannel(currentChannel);
        
        // Mock messages for now
        setMessages([
          { id: 1, user: 'System', text: `Welcome to the beginning of the #${currentChannel?.name || 'channel'} channel.`, type: 'system', timestamp: new Date() },
        ]);
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now(),
      user: 'You',
      text: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

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

  // --- TEXT CHANNEL UI ---
  if (channel.type === 'TEXT') {
    return (
      <div className="flex-1 flex flex-col h-full bg-black relative overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
           <div className="max-w-4xl mx-auto w-full">
             <div className="mb-8 pt-10">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-4">
                   <Hash className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome to #{channel.name}!</h1>
                <p className="text-slate-400">This is the start of the #{channel.name} channel.</p>
                <div className="h-[1px] bg-white/10 w-full mt-8"></div>
             </div>

             <AnimatePresence initial={false}>
               {messages.map((msg) => (
                 <motion.div 
                   key={msg.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`flex gap-4 group hover:bg-white/[0.02] -mx-4 px-4 py-2 rounded-lg transition-colors ${msg.type === 'system' ? 'opacity-60 italic' : ''}`}
                 >
                   <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0 flex items-center justify-center font-bold text-white text-sm">
                      {msg.user.charAt(0)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-[15px]">{msg.user}</span>
                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-200 leading-relaxed break-words">{msg.text}</p>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={handleSendMessage}
              className="bg-[#111] border border-white/10 rounded-md p-2 flex items-center gap-2 focus-within:border-white/20 transition-all shadow-2xl"
            >
              <button type="button" className="p-2 text-slate-500 hover:text-white transition-colors">
                <PlusCircle className="w-5 h-5" />
              </button>
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${channel.name}`}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-slate-200 py-2"
              />
              <div className="flex items-center gap-1 pr-2">
                <button type="button" className="p-2 text-slate-500 hover:text-white transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  disabled={!newMessage.trim()}
                  className="p-2 bg-white text-black rounded-md hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- AUDIO/VOICE/VIDEO CHANNEL UI ---
  const Icon = channel.type === 'VOICE' ? Mic : 
               channel.type === 'VIDEO' ? Video : Music;
  
  const typeLabel = channel.type === 'VOICE' ? 'VOICE CHANNEL' :
                    channel.type === 'VIDEO' ? 'VIDEO CHANNEL' : 'AUDIO CHANNEL';

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black p-8 text-center relative overflow-hidden">
        {/* Background Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 space-y-8 max-w-lg"
        >
          <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-white/5 group">
             <Icon className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              {typeLabel}
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">WELCOME TO THE {channel.type} CHANNEL</h1>
            <p className="text-slate-400 text-lg">You are now in <span className="text-white font-semibold">#{channel.name}</span>. Start a conversation or share your media.</p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-6">
             <button className="px-8 py-3 bg-white text-black font-medium rounded-md hover:bg-slate-200 transition-all shadow-xl active:scale-95">
               Join Call
             </button>
             <button className="p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-md transition-all active:scale-95">
               <UserPlus className="w-5 h-5" />
             </button>
             <button className="p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-md transition-all active:scale-95">
               <Settings2 className="w-5 h-5" />
             </button>
          </div>
        </motion.div>

        {/* User list placeholder */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
           <div className="flex -space-x-3 overflow-hidden p-1">
             {[1,2,3].map(i => (
               <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                 U{i}
               </div>
             ))}
           </div>
           <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">3 Users Active</span>
        </div>
    </div>
  );
}
