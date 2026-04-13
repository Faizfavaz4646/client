"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Copy, Check, RefreshCw, Loader2, Link as LinkIcon } from "lucide-react";
import { InviteService } from "@/lib/services/invite.service";

interface InviteLinkModalProps {
  workspaceId: string;
  isOwner: boolean;
  onClose: () => void;
}

export default function InviteLinkModal({ workspaceId, isOwner, onClose }: InviteLinkModalProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch current invite on mount
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setIsLoading(true);
        const res = await InviteService.getWorkspaceInvite(workspaceId);
        // The backend returns an array of invites
        if (res.success && res.data.invites && res.data.invites.length > 0) {
          setInviteCode(res.data.invites[0].code);
        } else {
          setError("No active invite code found.");
        }
      } catch (err: any) {
        console.error("Failed to fetch invite", err);
        setError("Failed to load invite link.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [workspaceId]);

  // 2. Refresh Code (Owner Only)
  const handleRefresh = async () => {
    if (!isOwner) return;
    try {
      setIsRefreshing(true);
      setError(null);
      const res = await InviteService.refreshWorkspaceInvite(workspaceId);
      if (res.success && res.data.invite) {
        setInviteCode(res.data.invite.code);
      }
    } catch (err: any) {
      setError("Failed to refresh invite code.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // 3. Copy to Clipboard
  const copyToClipboard = () => {
    if (!inviteCode) return;
    const fullUrl = `${window.location.origin}/workspace/join?code=${inviteCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Decorative Top Bar */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8 text-center pt-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 relative group">
               <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
               <UserPlus className="w-8 h-8 text-indigo-400 relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Invite Your Team</h2>
            <p className="text-slate-400 text-sm max-w-[280px]">Share this link with your colleagues to bring them into the workspace.</p>
          </div>

          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-10 gap-3">
               <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
               <span className="text-xs text-slate-500 font-medium tracking-widest uppercase">Fetching Link...</span>
             </div>
          ) : (
            <div className="space-y-6">
              {error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center mb-2">
                  {error}
                </div>
              ) : (
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl group transition-all hover:bg-white/[0.07] hover:border-white/20">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Invite Link</span>
                      <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-lg font-mono font-bold text-white truncate pr-2">
                        {inviteCode}
                      </code>
                      <button
                        onClick={copyToClipboard}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold text-sm ${
                          copied 
                          ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                          : 'bg-white text-black hover:bg-slate-200'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Controls */}
              {isOwner && (
                <div className="pt-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-white transition-all text-xs font-semibold group"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span>{isRefreshing ? "Generating..." : "Generate New Invite Link"}</span>
                  </button>
                  <p className="text-[10px] text-slate-600 text-center mt-2 px-4">
                    Generating a new code will invalidate any previous links.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-4 mt-8 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all text-sm"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
