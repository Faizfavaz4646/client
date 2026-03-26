"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Building2, Sparkles, Check, Copy, ArrowRight, Loader2, Globe, Shield } from 'lucide-react';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  const [name, setName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // If user somehow gets here but already has workspaces, redirect
  React.useEffect(() => {
    if (user && user.workspaces && user.workspaces.length > 0) {
      router.push(`/workspace/${user.workspaces[0].workspaceId}`);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Create Workspace
      // user.id is the orgId for organization logins
      const wsRes = await WorkspaceService.createWorkspace({ 
        name,
        orgId: user?.id 
      });
      
      const workspaceData = wsRes.data;
      const workspaceId = workspaceData._id;

      // 2. Generate Invite Code for this workspace
      const inviteRes = await api.post('/invites', {
        organizationId: workspaceData.orgId,
        workspaceId: workspaceId,
        expiresInHours: 168, // 1 week
        maxUses: 100
      });

      setCreatedInvite(inviteRes.data.data.invite.code);
      
      // 3. Refresh user data 
      const userRes = await api.get('/auth/me');
      setUser(userRes.data.data.user);

    } catch (err: any) {
      console.error("Setup error:", err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to initialize workspace');
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdInvite) return;
    navigator.clipboard.writeText(createdInvite);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative text-white font-sans overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[0px]"></div>
      </div>

      {/* Top Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-extrabold text-xl tracking-wider text-white">
            SYNQ
          </span>
        </Link>
      </div>

      {/* Main Centered Container */}
      <div className="relative z-10 w-full max-w-[440px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 sm:p-10 relative flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!createdInvite ? (
              <motion.div 
                key="setup-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="flex flex-col space-y-2 text-center mb-8 w-full">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
                    Create First Workspace
                  </h1>
                  <p className="text-sm text-slate-400">
                    Establish your organization's digital workspace.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 w-full">
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1 mb-6">
                    <label className="text-sm font-medium text-slate-300">Workspace Name</label>
                    <input 
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Marketing, Engineering, IT"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white placeholder:text-slate-600"
                    />
                  </div>

                  <button 
                    disabled={isLoading || !name.trim()}
                    className="w-full py-2.5 mt-2 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Creating..." : "Create Workspace"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="setup-success"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="flex flex-col space-y-2 text-center mb-8 w-full">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-white" />
                  </div>

                  <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">Mission Accomplished</h2>
                  <p className="text-sm text-slate-400">
                    <span className="text-white font-medium">{name}</span> is online. Share this code with your team.
                  </p>
                </div>

                <div className="w-full space-y-1 mb-6">
                   <label className="text-sm font-medium text-slate-300">Invite Code</label>
                   <div className="flex gap-2">
                     <code className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-center font-mono tracking-[0.3em] text-lg uppercase text-white">
                       {createdInvite}
                     </code>
                     <button 
                       onClick={copyToClipboard}
                       className="px-4 border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                       title="Copy code"
                     >
                       {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                     </button>
                   </div>
                </div>

                <button 
                  onClick={() => {
                     if (user && user.workspaces && user.workspaces.length > 0) {
                       router.push(`/workspace/${user.workspaces[0].workspaceId}`);
                     } else {
                       window.location.reload();
                     }
                  }}
                  className="w-full py-2.5 mt-2 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Enter Workspace
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
