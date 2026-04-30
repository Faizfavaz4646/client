"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/store/authStore";
import { socketService } from "@/lib/services/socket.service";
import { Send, Image as ImageIcon, Paperclip, Smile, Hash, Edit2, Trash2, X, Check, MoreVertical, Download, ChevronLeft, Loader2, Camera, FileText, Pin, Reply, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { MessageService } from "@/lib/services/message.service";
import type { Message } from "@/types/chat";
import MediaPickerPopover from "./MediaPickerPopover";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatRoom({ channelId, channel, workspaceMembers }: { channelId: string; channel?: any; workspaceMembers?: any[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [pendingFile, setPendingFile] = useState<{ file: File; url: string; type: string } | null>(null);
  const [mobileActionMessageId, setMobileActionMessageId] = useState<string | null>(null);
  const [activeReactMenuId, setActiveReactMenuId] = useState<string | null>(null);
  const [reactMediaPickerMessageId, setReactMediaPickerMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Add a mount state to fix Next.js hydration issues
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const user = useAuthStore((state) => state.user);
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const isPrivileged = user?.organizations?.some(org => 
    org.role?.toLowerCase() === 'admin' || 
    org.role?.toLowerCase() === 'owner' || 
    org.role?.toLowerCase() === 'founder'
  ) || user?.workspaces?.some((w: any) => 
    (w.workspaceId === workspaceId || w._id === workspaceId) && 
    (w.role?.toLowerCase() === 'admin' || w.role?.toLowerCase() === 'owner')
  );
  const isOrgFounder = user?.organizations?.some(org => 
    org.role?.toLowerCase() === 'admin' || 
    org.role?.toLowerCase() === 'owner' || 
    org.role?.toLowerCase() === 'founder'
  );

  // Robust ID extraction helper
  const getID = (obj: any) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj.trim().toLowerCase();
    const possibleId = obj?._id || obj?.id || obj?.userId || obj?.UserId || obj?.authorId || (obj as any)?.senderId?._id;
    return possibleId ? String(possibleId).trim().toLowerCase() : null;
  };

  // 2. Tell React when the component has safely mounted in the browser
  useEffect(() => {
    setIsMounted(true);

    // Attempt to fetch history
    const fetchHistory = async () => {
      try {
        const res = await MessageService.getMessages(channelId);
        if (res.data?.success && res.data?.data) {
          // Support { data: { messages: [] } } format
          setMessages(res.data.data.messages || res.data.data);
        } else if (res.data && Array.isArray(res.data)) {
          // Support direct array format
          setMessages(res.data);
        } else if (res.data?.messages) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.log("No history found, starting fresh.");
      }
    };
    fetchHistory();
  }, [channelId]);

  useEffect(() => {
    // 3. Stop everything if the browser hasn't finished loading Local Storage yet
    if (!isMounted) return;

    // Connect to the socket server using cookies
    socketService.connect();
    socketService.joinChannel(channelId);

    const newMessageCallback = (incomingData: Message) => {
      console.log("📨 New message arrived!", incomingData);
      setMessages((prev) => {
        if (incomingData._id && prev.some(m => m._id === incomingData._id)) return prev;
        const isOptimisticDupe = prev.some(m => !m._id && m.content === incomingData.content);
        if (isOptimisticDupe) {
          return prev.map(m => (!m._id && m.content === incomingData.content) ? incomingData : m);
        }
        return [...prev, incomingData];
      });
    };

    // Listen for new messages
    socketService.onNewMessage(newMessageCallback);

    // Listen for real-time edits (if backend decides to broadcast them later)
    socketService.onMessageEdited((updatedMsg: Message) => {
      setMessages(prev => prev.map(m => (m._id || m.id) === (updatedMsg._id || updatedMsg.id) ? updatedMsg : m));
    });

    // Listen for real-time deletes
    socketService.onMessageDeleted((data: { messageId: string }) => {
      setMessages(prev => prev.map(m => (m._id || m.id) === data.messageId ? { ...m, isDeleted: true, content: "", attachments: [] } : m));
    });

    // Listen for real-time Pins
    socketService.onMessagePinned((populatedMsg: Message) => {
      setMessages(prev => prev.map(m => (m._id || m.id) === (populatedMsg._id || populatedMsg.id) ? populatedMsg : m));
    });

    // Listen for real-time Reactions
    socketService.onMessageReaction((data: { messageId: string, reactions: any[] }) => {
      setMessages(prev => prev.map(m => (m._id || m.id) === data.messageId ? { ...m, reactions: data.reactions } : m));
    });

    return () => {
      socketService.offNewMessage(newMessageCallback);
    };
  }, [channelId, isMounted]); // Add isMounted to dependency array

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !pendingFile) return;

    const messageText = inputMessage;
    const fileToSend = pendingFile;

    setInputMessage("");
    setPendingFile(null);
    const cachedReplyTo = replyingToMessage ? (replyingToMessage._id || replyingToMessage.id) : undefined;
    setReplyingToMessage(null);

    const activeUserId = user?.id || (user as any)?._id || (user as any)?.userId;


    // If there's a file WITH OR WITHOUT text, send as ONE message
    if (fileToSend) {
      const tempId = "temp-" + Date.now();
      const optimisticMsg: Message = {
        _id: tempId,
        content: messageText,
        type: fileToSend.type,
        attachments: [{ url: fileToSend.url, name: fileToSend.file.name, fileType: fileToSend.type }],
        senderId: { _id: activeUserId, id: activeUserId, name: user?.name, avatar: user?.avatar },
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);
      setIsUploading(true);

      try {
        const res = await MessageService.uploadMedia(fileToSend.file);
        if (res.data?.success && res.data.data.attachment) {
          const attachment = res.data.data.attachment;
          const realType = attachment.fileType?.includes("image") ? "IMAGE" : "FILE";

          setMessages(prev => prev.map(m => m._id === tempId ? { ...m, _id: undefined, attachments: [attachment] } : m));
          // Provide an empty string fallback since sending a pure image has no text content
          socketService.sendMessage(channelId, messageText || "", realType, [attachment], cachedReplyTo);
        }
      } catch (err) {
        console.error("Upload failed", err);
        setMessages(prev => prev.filter(m => m._id !== tempId));
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(fileToSend.url);
      }
      return;
    }

    // Only text
    if (messageText.trim()) {
      const activeUserId = user?.id || (user as any)?._id || (user as any)?.userId;
      const optimisticText: Message = { content: messageText, type: "TEXT", senderId: { _id: activeUserId, id: activeUserId, name: user?.name, avatar: user?.avatar }, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, optimisticText]);
      socketService.sendMessage(channelId, messageText, "TEXT", [], cachedReplyTo);
    }
  };

  const handlePinToggle = (msg: Message) => {
    const newIsPinned = !msg.isPinned;
    // Optimistic UI jumps the message to the top instantly
    setMessages(prev => prev.map(m => (m._id || m.id) === (msg._id || msg.id) ? { ...m, isPinned: newIsPinned, pinnedAt: newIsPinned ? new Date().toISOString() : undefined } : m));
    socketService.pinMessage(channelId, (msg._id || msg.id) as string, newIsPinned);
  };

  const handleEditInit = (msg: Message) => {
    setEditingMessageId(msg._id || msg.id || null);
    setEditContent(msg.content);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleEditSave = async (messageId: string) => {
    if (!editContent.trim()) return;

    // Optimistic UI update
    setMessages(prev => prev.map(m => (m._id || m.id) === messageId ? { ...m, content: editContent, isEdited: true } : m));
    setEditingMessageId(null);

    try {
      await MessageService.updateMessage(messageId, editContent);
    } catch (err) {
      console.error("Failed to edit", err);
    }
  };

  const handleDeleteForMe = (messageId: string) => {
    setHiddenMessageIds(prev => [...prev, messageId]);
    setActiveMenuId(null);
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    // Optimistic WhatsApp-style local soft delete
    setMessages(prev => prev.map(m => (m._id || m.id) === messageId ? { ...m, isDeleted: true, content: "", attachments: [] } : m));
    setActiveMenuId(null);
    try {
      socketService.deleteMessage(channelId, messageId);
      // Wait for socket to broadcast 'message-edited' back with the isDeleted flag
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  // Sticker execution bypasses normal flow
  const handleRichMediaSend = (url: string, type: 'STICKER' | 'GIF') => {
    setIsMediaPickerOpen(false);
    const cachedReplyTo = replyingToMessage ? (replyingToMessage._id || replyingToMessage.id) : undefined;
    setReplyingToMessage(null);
    socketService.sendMessage(channelId, "", type, [{ url, name: type.toLowerCase(), fileType: "image/gif" }], cachedReplyTo);
  };

  const handleTouchStart = (msgId: string) => {
    touchTimerRef.current = setTimeout(() => {
      setMobileActionMessageId(msgId);
    }, 500); // 500ms long press threshold
  };

  const handleTouchEndOrMove = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAttachmentMenuOpen(false);
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("image/") ? "IMAGE" : "FILE";
    setPendingFile({ file, url, type });

    if (fileInputRef.current) fileInputRef.current.value = "";
    const cameraInput = document.getElementById('cameraInput') as HTMLInputElement;
    if (cameraInput) cameraInput.value = "";
    const documentInput = document.getElementById('documentInput') as HTMLInputElement;
    if (documentInput) documentInput.value = "";
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-white overflow-hidden relative">
      {/* Background glow for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative z-10 space-y-4">
        {/* Desktop Menu Clickaway */}
        {/* Global Clickaway for Menus */}
        {(activeMenuId || activeReactMenuId) && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => { 
              setActiveMenuId(null); 
              setActiveReactMenuId(null); 
            }} 
          />
        )}
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 max-w-lg mx-auto pb-20">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
              <Hash className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome to #{channel?.name || 'general'}!</h1>
            <p className="text-slate-400 text-center">This is the start of the #{channel?.name || 'general'} channel. Start a conversation or share your media.</p>
          </div>
        ) : (
          (() => {
            const validMessages = messages
              .filter(msg => !hiddenMessageIds.includes((msg._id || msg.id) as string))
              .filter(msg => !msg.content?.startsWith("@@SYSTEM_CALL_TYPE:"));

            const pinnedMessages = validMessages
              .filter(m => m.isPinned)
              .sort((a,b) => new Date(a.pinnedAt || 0).getTime() - new Date(b.pinnedAt || 0).getTime());
              
            const regularMessages = validMessages
              .sort((a, b) => new Date(a.createdAt || a.timestamp || 0).getTime() - new Date(b.createdAt || b.timestamp || 0).getTime());

            const renderMessageBubble = (msg: Message, i: number) => {

            const getID = (obj: any) => obj?._id || obj?.id || (typeof obj === 'string' ? obj : null);
            const senderObj = msg.senderId || (msg as any).sender || {};
            const senderIdString = getID(msg.senderId) || getID((msg as any).sender);
            const activeUserId = getID(user);
            
            let senderName = senderObj.name || senderObj.username;
            if (!senderName) {
              const knownMember = workspaceMembers?.find((m: any) => getID(m) === senderIdString);
              senderName = knownMember?.name || knownMember?.username || "Unknown User";
            }

            // DUAL-IDENTITY FALLBACK: Match by ID OR by Exact Name Match
            const isMeById = !!senderIdString && !!activeUserId && senderIdString === activeUserId;
            const isMeByName = !!senderName && !!user?.name && senderName === user.name;
            
            if (isMeById || isMeByName) senderName = "You";
            const isMe = isMeById || isMeByName || senderName === "You";

            const initial = senderName.charAt(0).toUpperCase();
            const avatarUrl = senderObj.avatar || (isMe ? user?.avatar : null);

            const timeString = msg.createdAt || msg.timestamp
              ? new Date(msg.createdAt || msg.timestamp as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "Just now";

            return (
              <div 
                key={msg._id || msg.id || i} 
                className={`flex w-full mb-4 px-2 group items-end relative ${isMe ? 'justify-end' : 'justify-start'}`}
                onTouchStart={() => handleTouchStart((msg._id || msg.id) as string)}
                onTouchMove={handleTouchEndOrMove}
                onTouchEnd={handleTouchEndOrMove}
              >
                <div className={`flex items-end gap-2.5 max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar (Hidden for 'isMe') */}
                  {!isMe && (
                    avatarUrl ? (
                      <img src={avatarUrl} alt={senderName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#0a0a0a] shadow-[0_2px_10px_rgba(0,0,0,0.5)] mb-1" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 border border-[#0a0a0a] shadow-[0_2px_10px_rgba(0,0,0,0.5)] mb-1">
                        <span className="text-white text-xs font-bold">{initial}</span>
                      </div>
                    )
                  )}

                  {/* Message Content Area */}
                  <div className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}>
                    
                    {/* Name and Time (Hidden for 'isMe') */}
                    {!isMe && (
                       <div className="flex items-baseline gap-2 mb-1 px-1">
                         <span className="text-[13px] font-bold text-slate-300 cursor-default">{senderName}</span>
                         <span className="text-[10px] font-medium text-slate-500">{timeString}</span>
                       </div>
                    )}
                    
                    {/* Text Bubble */}
                    <div className={`relative flex flex-col shadow-md
                      ${isMe 
                        ? 'bg-[#2a2a2a] border border-white/10 text-slate-200 rounded-2xl rounded-br-sm' 
                        : 'bg-[#1e1e1e]/90 backdrop-blur-md border border-white/5 text-slate-200 rounded-2xl rounded-bl-sm'
                      }
                      ${(msg.type === "IMAGE" || msg.type === "STICKER" || msg.type === "GIF") && !msg.content ? 'p-1.5' : 'px-3.5 py-2.5'}
                    `}>

                        {/* Three Dots More Menu (Visible across all devices) */}
                        {!editingMessageId && (msg._id || msg.id) && !msg._id?.startsWith('temp-') && !msg.isDeleted && (
                          <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-12' : '-right-12'} ${activeMenuId === (msg._id || msg.id) ? 'opacity-100 z-50' : 'opacity-40 md:opacity-0 md:group-hover:opacity-100 z-20'} transition-all flex items-center justify-center`}>
                            <button
                              onClick={() => {
                                const mId = (msg._id || msg.id) as string;
                                setActiveMenuId(activeMenuId === mId ? null : mId);
                                setActiveReactMenuId(null);
                              }}
                              className="p-2 text-slate-300 hover:text-white bg-[#1a1a1a]/80 hover:bg-[#2a2a2a] border border-white/10 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Options */}
                            {activeMenuId === (msg._id || msg.id) && (
                              <div className={`absolute ${isMe ? 'right-full mr-3 slide-in-from-right-2' : 'left-full ml-3 slide-in-from-left-2'} top-0 w-48 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-[100] overflow-hidden animate-in fade-in duration-200`}>
                                
                                {/* Quick Reactions */}
                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/20">
                                  {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                                    <button key={emoji} onClick={() => { socketService.reactMessage(channelId, (msg._id || msg.id) as string, emoji); setActiveMenuId(null); }} className="hover:scale-125 transition-transform text-lg">{emoji}</button>
                                  ))}
                                </div>

                                <div className="py-1.5">
                                  <button onClick={() => { handlePinToggle(msg); setActiveMenuId(null); }} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs ${msg.isPinned ? 'text-amber-500 hover:bg-amber-500/10' : 'text-slate-200 hover:text-white hover:bg-white/5'} transition-colors font-medium`}>
                                    <Pin className="w-3.5 h-3.5" /> {msg.isPinned ? "Unpin Message" : "Pin Message"}
                                  </button>
                                  
                                  <div className="h-px bg-white/5 my-1" />

                                  {/* Edit: Only for TEXT messages AND isMe */}
                                  {isMe && msg.type !== "IMAGE" && msg.type !== "FILE" && msg.type !== "GIF" && msg.type !== "STICKER" && (
                                    <button onClick={() => { handleEditInit(msg); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-colors font-medium">
                                      <Edit2 className="w-3.5 h-3.5" /> Edit Message
                                    </button>
                                  )}

                                  {isMe && (
                                    <button onClick={() => handleDeleteForMe((msg._id || msg.id) as string)} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" /> Delete for me
                                    </button>
                                  )}

                                  {(isMe || isPrivileged) && (
                                    <button onClick={() => handleDeleteForEveryone((msg._id || msg.id) as string)} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors font-medium">
                                      <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {editingMessageId === (msg._id || msg.id) ? (
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              autoFocus
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleEditSave((msg._id || msg.id) as string)}
                              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-[15px] text-white focus:outline-none focus:border-indigo-500 min-w-[200px]"
                            />
                            <button onClick={() => handleEditSave((msg._id || msg.id) as string)} className="p-1.5 text-green-400 hover:bg-white/10 rounded-md"><Check className="w-4 h-4" /></button>
                            <button onClick={handleEditCancel} className="p-1.5 text-red-400 hover:bg-white/10 rounded-md"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isMe ? 'text-slate-200 font-medium' : 'text-slate-300'}`}>
                            
                            {msg.replyTo && !msg.isDeleted && (
                              <div className={`mb-1.5 px-2 py-1 rounded border-l-[3px] ${isMe ? 'bg-black/20 border-slate-500' : 'bg-black/20 border-indigo-500'} text-[11px] opacity-90 cursor-pointer overflow-hidden`}>
                                <div className={`font-bold tracking-wide truncate ${isMe ? 'text-slate-300' : 'text-indigo-400'}`}>{(msg.replyTo.senderId as any)?.name || 'Replying to...'}</div>
                                <div className="truncate opacity-75 mt-0.5 max-w-[200px]">
                                  {msg.replyTo.type === 'IMAGE' ? '📷 Image' : msg.replyTo.type === 'GIF' ? '🎞️ GIF' : msg.replyTo.type === 'STICKER' ? '✨ Sticker' : msg.replyTo.type === 'FILE' ? '📎 File' : msg.replyTo.content || "Attachment"}
                                </div>
                              </div>
                            )}

                            {msg.isDeleted ? (
                              <div className={`flex items-center gap-1.5 text-[13px] italic ${isMe ? 'text-slate-500' : 'text-white/50'}`}>
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                                <span>This message was deleted</span>
                              </div>
                            ) : (msg.type === "IMAGE" || msg.type === "STICKER" || msg.type === "GIF") ? (
                              <div className="relative group/image max-w-xs md:max-w-sm flex flex-col gap-2">
                                <img
                                  src={msg.attachments?.[0]?.url || msg.content}
                                  alt="Attachment"
                                  className={`w-full transition-all ${msg.type === 'IMAGE' ? 'rounded-xl border border-white/10 shadow-sm cursor-pointer hover:opacity-90' : 'cursor-pointer hover:scale-105'} ${msg._id?.startsWith('temp-') ? 'opacity-50 blur-sm' : ''}`}
                                  onClick={() => msg.type !== 'STICKER' && !msg._id?.startsWith('temp-') && setPreviewImage(msg.attachments?.[0]?.url || msg.content)}
                                />
                                {/* Loading Spinner overlay */}
                                {msg._id?.startsWith('temp-') && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl pointer-events-none transition-opacity">
                                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                    <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full shadow-lg backdrop-blur-md">Sending...</span>
                                  </div>
                                )}
                                {msg.content && msg.content !== msg.attachments?.[0]?.url && (
                                  <div className="text-[15px] px-2 pb-1.5">{msg.content}</div>
                                )}
                              </div>
                            ) : msg.type === "FILE" ? (
                              <a href={msg.content} target="_blank" rel="noreferrer" className="text-indigo-200 hover:text-white underline underline-offset-2 flex items-center gap-1"><Paperclip className="w-4 h-4" /> Download Attachment</a>
                            ) : (
                              <div className="flex flex-col">
                                {msg.content || (msg as any).text}
                                {isMe && <span className={`text-[9px] self-end mt-1 font-medium ${isMe ? 'text-slate-400' : 'text-white/50'}`}>{timeString} {msg.isEdited && "(edited)"}</span>}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                    
                    {/* Reactions array & Quick React Button */}
                    <div className={`flex flex-wrap gap-1 mt-1 z-10 ${isMe ? 'justify-end' : 'justify-start'} ${(msg.reactions && msg.reactions.length > 0) || activeReactMenuId === (msg._id || msg.id) ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 transition-opacity'}`}>
                      {msg.reactions?.map(r => {
                         const hasReacted = r.users?.some(u => {
                           const possibleId = u?._id || u?.id;
                           return activeUserId && possibleId && String(possibleId).trim().toLowerCase() === activeUserId;
                         });
                         
                         // Tooltip text showing who reacted
                         const reactorNames = r.users?.map((u: any) => {
                           const reactorId = u?._id || u?.id;
                           const myId = user?.id || (user as any)?._id || (user as any)?.userId;
                           return (reactorId && myId && String(reactorId) === String(myId)) ? "You" : (u.name || "Someone");
                         }).join(", ") || "Someone";

                         return (
                           <div key={r._id || r.emoji} className="relative group/reaction">
                             <button 
                               onClick={() => socketService.reactMessage(channelId, (msg._id || msg.id) as string, r.emoji)} 
                               className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] font-bold border transition-all hover:scale-105 active:scale-95 shadow-sm
                                 ${hasReacted 
                                   ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 ring-1 ring-indigo-500/20' 
                                   : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                                 }`}
                             >
                               <span>{r.emoji}</span>
                               <span className={hasReacted ? 'text-indigo-200' : 'text-slate-500'}>{r.users?.length || 1}</span>
                             </button>

                             {/* Tooltip on Hover */}
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1a] border border-white/10 text-[10px] text-white rounded-md whitespace-nowrap opacity-0 group-hover/reaction:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl">
                               {reactorNames}
                             </div>
                           </div>
                         );
                      })}
                      
                      {/* Quick React Desktop Hover Button */}
                      <div className="relative flex items-center gap-1.5">
                        <button 
                          onClick={() => {
                            const mId = (msg._id || msg.id) as string;
                            setActiveReactMenuId(activeReactMenuId === mId ? null : mId);
                            setActiveMenuId(null);
                          }} 
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-black/40 border border-white/10 text-slate-300 hover:bg-white/10 transition-all hover:scale-110 shadow group/btn"
                        >
                           <Smile className="w-3.5 h-3.5" /> <Plus className="w-3 h-3 opacity-50 group-hover/btn:opacity-100 transition-opacity -ml-0.5" />
                        </button>
                        
                        <button onClick={() => setReplyingToMessage(msg)} className="flex items-center justify-center w-6 h-6 rounded-full bg-black/40 border border-white/10 text-slate-300 hover:bg-white/10 transition-all hover:scale-110 shadow">
                           <Reply className="w-3.5 h-3.5" />
                        </button>
                        
                        {activeReactMenuId === (msg._id || msg.id) && (
                          <div className={`absolute bottom-full mb-1 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] border border-white/10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-bottom-2`}>
                            {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                              <button key={emoji} onClick={() => { socketService.reactMessage(channelId, (msg._id || msg.id) as string, emoji); setActiveReactMenuId(null); }} className="hover:scale-125 transition-transform text-lg">{emoji}</button>
                            ))}
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button onClick={() => { setReactMediaPickerMessageId((msg._id || msg.id) as string); setActiveReactMenuId(null); }} className="hover:bg-white/10 p-1.5 rounded-full text-slate-400 hover:text-white transition-colors bg-white/5">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            };

            return (
              <div className="flex flex-col relative w-full">
                {/* STICKY PINNED MESSAGES HEADER */}
                {pinnedMessages.length > 0 && (
                  <div className="sticky top-0 z-[60] flex justify-center w-full mb-6 mt-1">
                    <div className="bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl p-2.5 max-w-sm w-full flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="p-2 bg-white/10 rounded-full text-slate-300 shrink-0">
                        <Pin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          Pinned Message
                          {pinnedMessages.length > 1 && <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-1.5 py-0.5 rounded-full">{pinnedMessages.length}</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {pinnedMessages[pinnedMessages.length - 1].content || (pinnedMessages[pinnedMessages.length - 1].type === "IMAGE" ? "📷 Image" : "Attachment")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* STANDARD CHAT HISTORY */}
                <div className="flex-1">
                  {regularMessages.map((msg, i) => renderMessageBubble(msg, i))}
                </div>
              </div>
            );
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mobile Long Press Action Modal */}
      <AnimatePresence>
        {mobileActionMessageId && (
          <div className="fixed inset-0 z-[200] md:hidden flex items-end">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setMobileActionMessageId(null)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="w-full bg-[#1e1e1e] border-t border-white/10 rounded-t-3xl pb-8 pt-2 px-4 shadow-2xl relative z-10 flex flex-col"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              
              {(() => {
                const m = messages.find(msg => (msg._id || msg.id) === mobileActionMessageId);
                if (!m) return null;
                
                const getID = (obj: any) => {
                  if (!obj) return null;
                  if (typeof obj === 'string') return obj.trim().toLowerCase();
                  return String(obj?._id || obj?.id || obj?.userId || obj?.UserId || obj?.authorId || (obj as any)?.senderId?._id).trim().toLowerCase() || null;
                };
                const activeUserId = getID(user);
                const senderIdString = getID(m.senderId) || getID((m as any).sender);
                const isMeById = !!senderIdString && !!activeUserId && senderIdString === activeUserId;
                const isMeByName = !!user?.name && !!m.senderId?.name && m.senderId.name === user.name;
                const mIsMe = isMeById || isMeByName;

                return (
                   <div className="flex flex-col gap-2">
                      <div className="flex justify-between px-2 mb-2 bg-black/20 rounded-2xl p-4 border border-white/5">
                        {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                          <button key={emoji} onClick={() => { socketService.reactMessage(channelId, (m._id || m.id) as string, emoji); setMobileActionMessageId(null); }} className="text-3xl hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                      </div>

                      <button onClick={() => { setReplyingToMessage(m); setMobileActionMessageId(null); }} className="w-full bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 px-5 py-4 text-white font-medium transition-colors">
                        <Reply className="w-5 h-5 text-indigo-300" /> Reply to Message
                      </button>

                      <button onClick={() => { socketService.pinMessage(channelId, (m._id || m.id) as string, !m.isPinned); setMobileActionMessageId(null); }} className={`w-full ${m.isPinned ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-2xl flex items-center gap-3 px-5 py-4 font-medium transition-colors`}>
                        <Pin className="w-5 h-5" /> {m.isPinned ? "Unpin Message" : "Pin Message"}
                      </button>

                      {mIsMe && m.type !== "IMAGE" && m.type !== "FILE" && m.type !== "GIF" && m.type !== "STICKER" && (
                        <button onClick={() => { handleEditInit(m); setMobileActionMessageId(null); }} className="w-full bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 px-5 py-4 text-white font-medium transition-colors">
                          <Edit2 className="w-5 h-5 text-indigo-400" /> Edit Message
                        </button>
                      )}
                      {(m.type === "IMAGE" || m.type === "FILE" || m.type === "GIF" || m.type === "STICKER") && (
                        <a href={m.attachments?.[0]?.url || m.content} download target="_blank" rel="noreferrer" onClick={() => setMobileActionMessageId(null)} className="w-full bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 px-5 py-4 text-white font-medium transition-colors">
                           <Download className="w-5 h-5 text-blue-400" /> Save Media
                        </a>
                      )}
                      
                      {mIsMe && (
                        <button onClick={() => { handleDeleteForMe(mobileActionMessageId); setMobileActionMessageId(null); }} className="w-full bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 px-5 py-4 text-white font-medium transition-colors">
                          <Trash2 className="w-5 h-5 text-slate-400" /> Delete for Me
                        </button>
                      )}
                      
                      {(mIsMe || isPrivileged) && (
                        <button onClick={() => { handleDeleteForEveryone(mobileActionMessageId); setMobileActionMessageId(null); }} className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl flex items-center gap-3 px-5 py-4 text-rose-500 font-bold transition-colors">
                          <Trash2 className="w-5 h-5" /> Delete for Everyone
                        </button>
                      )}
                   </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent w-full shrink-0 relative z-20">
        {(() => {
          const activeUserId = getID(user);
          const isMember = channel?.name?.toLowerCase() === 'general' || 
                          isPrivileged || 
                          (channel?.members && channel.members.some((m: any) => getID(m) === activeUserId));

          if (!isMember && channel) {
            return (
              <div className="max-w-4xl mx-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-200">Viewing Only</p>
                <p className="text-xs text-slate-400 text-center max-w-[300px]">You are currently previewing <span className="text-white font-medium">#{channel?.name}</span>. You must be added by an admin to participate.</p>
              </div>
            );
          }

          return (
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all shadow-[0_4px_30px_-5px_rgba(0,0,0,0.5)]">

              {/* File Preview Area */}
              {pendingFile && (
                <div className="px-4 pt-4 pb-2 flex items-start shrink-0">
                  <div className="relative group/preview inline-block">
                    {pendingFile.type === "IMAGE" ? (
                      <img src={pendingFile.url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-white/10 shadow-md" />
                    ) : (
                      <div className="w-20 h-20 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shadow-md">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <button type="button" onClick={() => setPendingFile(null)} className="absolute -top-2 -right-2 p-1.5 bg-[#2a2a2a] hover:bg-rose-500 text-white rounded-full shadow-lg transition-all border border-white/10 disabled:opacity-50" disabled={isUploading}>
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Replying To Banner */}
              {replyingToMessage && (
                <div className="flex items-center justify-between w-full bg-indigo-500/10 border-t border-indigo-500/30 px-4 py-2 mt-2 -mb-2 rounded-t-xl">
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    <Reply className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="flex flex-col overflow-hidden w-full">
                       <span className="text-xs font-bold text-indigo-400">Replying to {(replyingToMessage.senderId as any)?.name || 'Message'}</span>
                       <span className="text-[11px] text-slate-300 truncate w-full">{replyingToMessage.content || "Attachment"}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setReplyingToMessage(null)} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2 p-2 w-full">
                <div className="flex items-center gap-1 shrink-0 pb-1.5 px-1 relative">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
                  <input type="file" id="cameraInput" onChange={handleFileSelect} className="hidden" accept="image/*;capture=camera" />
                  <input type="file" id="documentInput" onChange={handleFileSelect} className="hidden" accept="*" />

                  <button
                    type="button"
                    onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                    disabled={isUploading}
                    className={`p-2 rounded-xl transition-all z-40 ${isAttachmentMenuOpen ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-indigo-400 hover:bg-white/5'}`}
                  >
                    <Paperclip className="w-5 h-5 transition-transform" style={{ transform: isAttachmentMenuOpen ? 'rotate(45deg)' : 'rotate(0)' }} />
                  </button>

                  {/* Attachment Pop-Up Menu */}
                  {isAttachmentMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-4 p-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] flex flex-col gap-1 w-44 z-[60] animate-in slide-in-from-bottom-2 duration-200">
                      <button type="button" onClick={() => { fileInputRef.current?.click(); setIsAttachmentMenuOpen(false) }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 rounded-xl transition-colors">
                        <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg"><ImageIcon className="w-4 h-4" /></div> Photo & Video
                      </button>
                      <button type="button" onClick={() => { document.getElementById('cameraInput')?.click(); setIsAttachmentMenuOpen(false) }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 rounded-xl transition-colors">
                        <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg"><Camera className="w-4 h-4" /></div> Camera
                      </button>
                      <button type="button" onClick={() => { document.getElementById('documentInput')?.click(); setIsAttachmentMenuOpen(false) }} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 rounded-xl transition-colors">
                        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg"><FileText className="w-4 h-4" /></div> Document
                      </button>
                    </div>
                  )}

                  {/* Click away layer to close menu */}
                  {isAttachmentMenuOpen && (
                    <div className="fixed inset-0 z-[50]" onClick={() => setIsAttachmentMenuOpen(false)} />
                  )}
                </div>

                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  placeholder="Message #general"
                  className="flex-1 bg-transparent border-none px-2 py-2.5 text-[15px] text-slate-200 focus:outline-none resize-none min-h-[44px] max-h-[200px] custom-scrollbar placeholder:text-slate-500"
                  rows={1}
                />

                <div className="flex items-center gap-1 shrink-0 pb-1.5 px-1 relative">
                  {/* Click away layer for Media Picker */}
                  {(isMediaPickerOpen || reactMediaPickerMessageId) && (
                    <div className="fixed inset-0 z-[50]" onClick={() => { setIsMediaPickerOpen(false); setReactMediaPickerMessageId(null); }} />
                  )}
                  
                  {/* Media Picker Popover */}
                  {(isMediaPickerOpen || reactMediaPickerMessageId) && (
                    <MediaPickerPopover
                      onClose={() => { setIsMediaPickerOpen(false); setReactMediaPickerMessageId(null); }}
                      onEmojiSelect={(emoji) => {
                        if (reactMediaPickerMessageId) {
                           socketService.reactMessage(channelId, reactMediaPickerMessageId, emoji);
                        } else {
                           setInputMessage(prev => prev + emoji);
                        }
                        setIsMediaPickerOpen(false);
                        setReactMediaPickerMessageId(null);
                      }}
                      onStickerSelect={(url) => {
                         if (!reactMediaPickerMessageId) handleRichMediaSend(url, 'STICKER');
                      }}
                      onGifSelect={(url) => {
                         if (!reactMediaPickerMessageId) handleRichMediaSend(url, 'GIF');
                      }}
                    />
                  )}
                  
                  <button 
                    type="button" 
                    onClick={() => setIsMediaPickerOpen(!isMediaPickerOpen)}
                    className={`p-2 rounded-xl transition-colors ${isMediaPickerOpen ? 'text-indigo-400 bg-white/10' : 'text-slate-400 hover:text-amber-400 hover:bg-white/5'}`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={(!inputMessage.trim() && !pendingFile) || isUploading}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 ml-1 disabled:hover:scale-100"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          );
        })()}
      </div>

      {/* Full Screen Image Lightbox overlay */}
      {isMounted && previewImage && createPortal(
        <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 md:pl-[300px]">
            <button onClick={() => setPreviewImage(null)} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md font-medium text-sm border border-white/10">
              <ChevronLeft className="w-5 h-5" /> Back to chat
            </button>
            <a href={previewImage} download target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-100 hover:text-white transition-colors bg-indigo-500/40 hover:bg-indigo-500/60 px-4 py-2 rounded-full backdrop-blur-md font-medium text-sm border border-indigo-500/30">
              <Download className="w-4 h-4" /> Save Image
            </a>
          </div>
          <img src={previewImage} alt="Full screen preview" className="max-w-[100vw] max-h-[100vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" />
        </div>,
        document.body
      )}
    </div>
  );
}