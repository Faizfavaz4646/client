"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/store/authStore";
import { socketService } from "@/lib/services/socket.service";
import { Send, Image as ImageIcon, Paperclip, Smile, Hash, Edit2, Trash2, X, Check, MoreVertical, Download, ChevronLeft, Loader2, Camera, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { MessageService } from "@/lib/services/message.service";
import type { Message } from "@/types/chat";

export default function ChatRoom({ channelId, channel }: { channelId: string; channel?: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [pendingFile, setPendingFile] = useState<{ file: File; url: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Add a mount state to fix Next.js hydration issues
  const [isMounted, setIsMounted] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isPrivileged = user?.organizations?.some(org => 
    org.role?.toLowerCase() === 'admin' || 
    org.role?.toLowerCase() === 'owner' || 
    org.role?.toLowerCase() === 'founder'
  );
  const isOrgFounder = !!isPrivileged;

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
          socketService.sendMessage(channelId, messageText || "", realType, [attachment]);
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
      socketService.sendMessage(channelId, messageText, "TEXT");
    }
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
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 max-w-lg mx-auto pb-20">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
              <Hash className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome to #{channel?.name || 'general'}!</h1>
            <p className="text-slate-400 text-center">This is the start of the #{channel?.name || 'general'} channel. Start a conversation or share your media.</p>
          </div>
        ) : (
          messages
            .filter(msg => !hiddenMessageIds.includes((msg._id || msg.id) as string))
            .filter(msg => !msg.content?.startsWith("@@SYSTEM_CALL_TYPE:"))
            .map((msg, i) => {
            const getID = (obj: any) => {
              if (!obj) return null;
              if (typeof obj === 'string') return obj.trim().toLowerCase();
              const possibleId = obj?._id || obj?.id || obj?.userId || obj?.UserId || obj?.authorId || (obj as any)?.senderId?._id;
              return possibleId ? String(possibleId).trim().toLowerCase() : null;
            };

            const senderObj = msg.senderId || (msg as any).sender || {};
            const senderIdString = getID(msg.senderId) || getID((msg as any).sender);
            const activeUserId = getID(user);
            
            let senderName = senderObj.name || senderObj.username;
            if (!senderName) {
              const workspaceName = user?.workspaces?.find(w => w.workspaceId === channel?.workspaceId)?.name;
              senderName = workspaceName || user?.workspaces?.[0]?.name || "Unknown";
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
              <div key={msg._id || msg.id || i} className="flex flex-col mb-1 group max-w-4xl mx-auto w-full items-start relative box-border">
                <div className="flex items-start gap-4 w-full hover:bg-white/[0.02] p-2 -mx-2 rounded-xl transition-colors relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={senderName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#0a0a0a] shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 border border-[#0a0a0a] shadow-sm">
                      <span className="text-white text-sm font-bold">{initial}</span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1 relative">
                    <div className="flex items-baseline gap-2 mb-0.5 pr-8">
                      <span className="text-[15px] font-bold text-slate-200 cursor-default">{senderName}</span>
                      <span className="text-[10px] font-medium text-slate-500">{timeString}</span>
                      {msg.isEdited && <span className="text-[10px] text-slate-500 italic">(edited)</span>}
                    </div>

                    {/* Three Dots More Menu - FORCED VISIBILITY FOR AUTHOR */}
                    {isMe && !editingMessageId && (msg._id || msg.id) && !msg._id?.startsWith('temp-') && !msg.isDeleted && (
                      <div className="absolute top-0 right-0 opacity-60 hover:opacity-100 transition-opacity z-20 flex">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === (msg._id || msg.id) ? null : (msg._id || msg.id) as string)}
                          className="p-1 px-2 text-slate-400 hover:text-white bg-[#1a1a1a]/80 hover:bg-[#2a2a2a] border border-white/10 rounded-md shadow-xl transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Options */}
                        {activeMenuId === (msg._id || msg.id) && (
                          <div className="absolute right-0 mt-8 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1 z-30 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-100">
                            {/* Edit: Only for TEXT messages */}
                            {msg.type !== "IMAGE" && msg.type !== "FILE" && (
                              <>
                                <button onClick={() => { handleEditInit(msg); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                                  <Edit2 className="w-4 h-4" /> Edit Message
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                              </>
                            )}

                            {/* Attachments: Save to Device */}
                            {msg.type !== "TEXT" && (
                              <>
                                <a href={msg.attachments?.[0]?.url || msg.content} download target="_blank" rel="noreferrer" onClick={() => setActiveMenuId(null)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-400 hover:text-white hover:bg-white/5 transition-colors">
                                  <Download className="w-4 h-4" /> Save to Device
                                </a>
                                <div className="h-px bg-white/5 my-1" />
                              </>
                            )}

                            <button onClick={() => handleDeleteForMe((msg._id || msg.id) as string)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                              <Trash2 className="w-4 h-4" /> Delete for me
                            </button>

                            <button onClick={() => handleDeleteForEveryone((msg._id || msg.id) as string)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors font-medium">
                              <Trash2 className="w-4 h-4" /> Delete for everyone
                            </button>
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
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-[15px] text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button onClick={() => handleEditSave((msg._id || msg.id) as string)} className="p-1.5 text-green-400 hover:bg-white/10 rounded-md"><Check className="w-4 h-4" /></button>
                        <button onClick={handleEditCancel} className="p-1.5 text-red-400 hover:bg-white/10 rounded-md"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap">
                        {msg.isDeleted ? (
                          <div className="flex items-center gap-1.5 mt-1 text-[13px] text-slate-500/80 italic">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                            <span>This message was deleted</span>
                          </div>
                        ) : msg.type === "IMAGE" ? (
                          <div className="relative group/image mt-1 max-w-xs md:max-w-sm flex flex-col gap-2 bg-[#1a1a1a] p-1.5 rounded-2xl border border-white/5 shadow-sm">
                            <img
                              src={msg.attachments?.[0]?.url || msg.content}
                              alt="Attachment"
                              className={`w-full rounded-xl border border-white/10 shadow-sm transition-all cursor-pointer hover:opacity-90 ${msg._id?.startsWith('temp-') ? 'opacity-50 blur-sm' : ''}`}
                              onClick={() => !msg._id?.startsWith('temp-') && setPreviewImage(msg.attachments?.[0]?.url || msg.content)}
                            />
                            {/* Loading Spinner overlay */}
                            {msg._id?.startsWith('temp-') && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl pointer-events-none transition-opacity">
                                <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full shadow-lg backdrop-blur-md">Sending...</span>
                              </div>
                            )}
                            {msg.content && msg.content !== msg.attachments?.[0]?.url && (
                              <div className="text-slate-200 text-[15px] px-2 pb-1.5">{msg.content}</div>
                            )}
                          </div>
                        ) : msg.type === "FILE" ? (
                          <a href={msg.content} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1 mt-1"><Paperclip className="w-4 h-4" /> Download Attachment</a>
                        ) : (
                          msg.content || (msg as any).text
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent w-full shrink-0 relative z-20">
        {(() => {
          const isMember = channel?.name === 'general' || isPrivileged || (channel?.members && channel.members.some((m: any) => m === user?.id || m._id === user?.id || m.userId === user?.id || (m.userId && m.userId._id === user?.id)));

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

                <div className="flex items-center gap-1 shrink-0 pb-1.5 px-1">
                  <button type="button" className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-colors">
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