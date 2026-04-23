"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Building2, Sparkles, Check, Copy, ArrowRight, Loader2, Globe } from 'lucide-react';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { api } from '@/lib/api';

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
    // Only redirect if they haven't just successfully created a workspace right now
    if (user && user.workspaces && user.workspaces.length > 0 && !createdInvite) {
      router.push(`/workspace/${user.workspaces[0].workspaceId}`);
    }
  }, [user, router, createdInvite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Create Workspace
      const orgAdmin = user?.organizations?.find((o: any) => o.role === 'admin' || o.role === 'owner');
      console.log("[DEBUG] Creating workspace for org:", orgAdmin?.orgId || user?.id);

      const wsRes = await WorkspaceService.createWorkspace({
        name,
        orgId: orgAdmin?.orgId || user?.id
      });

      console.log("[DEBUG] Workspace created:", wsRes);
      
      // Restore workspaceData for later use
      const workspaceData = wsRes.data?.workspace || wsRes.workspace || wsRes.data || wsRes;
      const workspaceId = workspaceData?._id || workspaceData?.id;

      if (!workspaceId) {
        console.error("[DEBUG] Failed to find ID in:", wsRes);
        throw new Error("Workspace ID was not returned from server");
      }

      // 2. Generate Invite Code for this workspace
      console.log("[DEBUG] Generating invite for workspace:", workspaceId);
      const inviteRes = await api.post(`/workspaces/${workspaceId}/invites`, {
        expiresIn: "7d",
        maxUses: 100
      });
      console.log("[DEBUG] Invite generated:", inviteRes.data);

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
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative text-white font-sans overflow-hidden"
      style={{
        backgroundColor: '#090a10',
        backgroundImage: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.1), transparent 45%), radial-gradient(circle at bottom left, rgba(157, 78, 221, 0.08), transparent 45%)'
      }}
    >
      {/* Vivid Background Elements to create the "seeing behind" frosted effect */}
      <div className="absolute inset-0 z-0 flex opacity-40 pointer-events-none">
        {/* Mock Sidebar */}
        <div className="w-64 border-r border-white/5 h-full p-8 flex flex-col gap-6 blur-[2px]">
          <div className="w-28 h-8 bg-white/10 rounded-lg mb-6"></div>
          <div className="w-full h-10 bg-white/5 rounded-lg border border-white/5"></div>
          <div className="w-3/4 h-10 bg-white/5 rounded-lg border border-white/5"></div>
          <div className="w-5/6 h-10 bg-white/5 rounded-lg border border-white/5"></div>
          <div className="w-full h-10 bg-white/5 rounded-lg border border-white/5"></div>
        </div>

        {/* Mock Main Dashboard Area */}
        <div className="flex-1 p-12 flex flex-col gap-8 blur-[2px]">
          <div className="flex justify-between items-center mb-4">
            <div className="w-64 h-10 bg-white/5 rounded-lg border border-white/5"></div>
            <div className="w-40 h-10 bg-white/5 rounded-lg border border-white/5"></div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {/* Colorful mock cards to add vibrant glows behind the fog */}
            <div className="col-span-2 h-72 bg-gradient-to-br from-[#00d2ff]/15 to-[#00d2ff]/0 border border-[#00d2ff]/20 rounded-2xl"></div>
            <div className="col-span-1 h-72 bg-gradient-to-br from-[#7a28cb]/15 to-[#7a28cb]/0 border border-[#7a28cb]/20 rounded-2xl"></div>
            <div className="col-span-1 h-48 bg-white/5 border border-white/5 rounded-2xl"></div>
            <div className="col-span-2 h-48 bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-2xl"></div>
          </div>
        </div>
      </div>

      {/* Main Centered Container - True Frosted Glass / Fog Touch */}
      <div
        className="relative z-10 w-full max-w-[520px] rounded-[28px] p-10 sm:p-14"
        style={{
          /* The fog mix: a transparent dark base + subtle diagonal white sheen */
          backgroundColor: 'rgba(15, 17, 26, 0.45)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.0) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          /* Borders with light edges on top/left to simulate glass thickness */
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'rgba(255, 255, 255, 0.25)',
          borderLeftColor: 'rgba(255, 255, 255, 0.25)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        <AnimatePresence mode="wait">
          {!createdInvite ? (
            <motion.div
              key="setup-form"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex flex-col"
            >
              <div className="flex flex-col items-center text-center mb-10 w-full">
                <div className="w-16 h-16 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/20">
                  <Building2 className="w-8 h-8 text-[#00d2ff]" />
                </div>

                <p className="text-[14px] font-medium text-[#8b949e] uppercase tracking-wider mb-1">
                  Get Started
                </p>
                <h1 className="text-[28px] font-semibold tracking-tight text-white leading-tight">
                  Create Your First Workspace
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 w-full">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm backdrop-blur-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2 relative">
                  <label className="text-[13px] font-medium text-[#8b949e] block pl-1">Workspace Name</label>
                  <div className="relative">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Marketing, Engineering, IT"
                      className="w-full px-5 py-4 bg-black/30 border border-white/10 rounded-xl transition-all duration-300 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#5c7eff80] focus:bg-black/50 focus:ring-4 focus:ring-[#5c7eff1a]"
                    />
                    <Globe className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b949e] pointer-events-none" />
                  </div>
                </div>

                <button
                  disabled={isLoading || !name.trim()}
                  className="w-full py-4 mt-2 rounded-xl text-white font-semibold text-[16px] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #00d2ff, #7a28cb 100%)',
                    boxShadow: '0 4px 15px rgba(0, 210, 255, 0.2)',
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading && name.trim()) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 210, 255, 0.35)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading && name.trim()) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 210, 255, 0.2)';
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Workspace
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="setup-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex flex-col"
            >
              <div className="flex flex-col items-center text-center mb-10 w-full">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                  <Sparkles className="w-8 h-8 text-[#00d2ff]" />
                </div>

                <h2 className="text-[28px] font-semibold tracking-tight text-white mb-2 leading-tight">Mission Accomplished</h2>
                <p className="text-[15px] text-[#8b949e]">
                  <span className="text-white font-medium">{name}</span> is online.<br />Share this code with your team.
                </p>
              </div>

              <div className="w-full space-y-2 mb-10">
                <label className="text-[13px] font-medium text-[#8b949e] block text-center">Invite Code</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                    <code className="font-mono tracking-[0.2em] text-[22px] font-medium text-white drop-shadow-[0_0_8px_rgba(0,210,255,0.4)] truncate">
                      {createdInvite}
                    </code>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="px-6 py-4 border border-white/10 bg-white/5 text-[#8b949e] hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span className="sm:hidden">{copied ? "Copied" : "Copy Code"}</span>
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
                className="w-full py-4 rounded-xl text-white font-semibold text-[16px] transition-all duration-300 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #7a28cb 100%)',
                  boxShadow: '0 4px 15px rgba(0, 210, 255, 0.2)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 210, 255, 0.35)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 210, 255, 0.2)';
                }}
              >
                Enter Workspace
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
