"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { InviteService } from "@/lib/services/invite.service";
import Link from "next/link";
import { ArrowRight, KeyRound, Loader2, Sparkles } from "lucide-react";

export default function JoinWorkspacePage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [successWsName, setSuccessWsName] = useState<string | null>(null);

  const handleJoin = async () => {
    const trimmed = inviteCode.trim();
    if (trimmed.length < 4) {
      setError("Please enter a valid invite code.");
      return;
    }

    try {
      setIsJoining(true);
      setError(null);
      const res = await InviteService.joinWorkspace(trimmed);
      const data = res.data; // { organizationId, workspaceId, ... }

      // Update user's store locally to jump in instantly
      if (user) {
        // Prevent duplicate org
        const isOrgMember = user.organizations?.some(o => o.orgId === data.organizationId);
        const updatedOrgs = isOrgMember
          ? user.organizations
          : [
            ...(user.organizations || []),
            {
              orgId: data.organizationId,
              role: 'member', // Default local injection
              joinedAt: new Date().toISOString(),
            },
          ];

        // Prevent duplicate workspace
        const isWsMember = user.workspaces?.some(w => w.workspaceId === data.workspaceId);
        const updatedWorkspaces = isWsMember
          ? user.workspaces
          : [
            ...(user.workspaces || []),
            {
              workspaceId: data.workspaceId,
              name: data.workspaceName || "New Workspace",
              joinedAt: new Date().toISOString(),
            },
          ];

        // Set state to trigger the visual success animation
        setSuccessWsName(data.workspaceName || "Workspace");

        // Give the UI 1.5 seconds to show the smooth success animation before forcing navigation
        setTimeout(() => {
          setUser({
            ...user,
            organizations: updatedOrgs,
            workspaces: updatedWorkspaces
          });
          router.push(`/workspace/${data.workspaceId}`);
        }, 1500);
      } else {
        router.push(`/workspace/${data.workspaceId}`);
      }

    } catch (err: unknown) {
      console.error(err);
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      // Fallback mapping for older custom error schemas
      const e2 = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.error?.message || e2.response?.data?.message || "Invalid or expired invite code.");
      setIsJoining(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative text-white font-sans overflow-hidden"
      style={{
        backgroundColor: '#090a10',
        backgroundImage: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.1), transparent 45%), radial-gradient(circle at bottom left, rgba(157, 78, 221, 0.08), transparent 45%)'
      }}
    >
      {/* Top Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2 z-10 w-full md:w-auto overflow-hidden">
        <Link href="/" className="flex items-center gap-2 group p-4 -m-4">
          <span className="font-extrabold text-xl tracking-wider text-white">
            SYNQ
          </span>
        </Link>
      </div>

      {/* Vivid Background Elements to create the "seeing behind" frosted effect */}
      <div className="absolute inset-0 z-0 flex opacity-40 pointer-events-none">
        {/* Mock Sidebar */}
        <div className="w-64 border-r border-white/5 h-full p-8 flex flex-col gap-6 blur-[2px]">
          <div className="w-28 h-8 bg-white/10 rounded-lg mb-6"></div>
          <div className="w-full h-10 bg-white/5 rounded-lg border border-white/5"></div>
          <div className="w-3/4 h-10 bg-white/5 rounded-lg border border-white/5"></div>
          <div className="w-5/6 h-10 bg-white/5 rounded-lg border border-white/5"></div>
        </div>

        {/* Mock Main Dashboard Area */}
        <div className="flex-1 p-12 flex flex-col gap-8 blur-[2px]">
          <div className="flex justify-between items-center mb-4">
            <div className="w-64 h-10 bg-white/5 rounded-lg border border-white/5"></div>
            <div className="w-40 h-10 bg-white/5 rounded-lg border border-white/5"></div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 h-72 bg-gradient-to-br from-[#00d2ff]/15 to-[#00d2ff]/0 border border-[#00d2ff]/20 rounded-2xl"></div>
            <div className="col-span-1 h-72 bg-gradient-to-br from-[#7a28cb]/15 to-[#7a28cb]/0 border border-[#7a28cb]/20 rounded-2xl"></div>
          </div>
        </div>
      </div>

      {/* Main Centered Container - True Frosted Glass / Fog Touch */}
      <div
        className="relative z-10 w-full max-w-[480px] rounded-[28px] p-10 sm:p-14"
        style={{
          backgroundColor: 'rgba(15, 17, 26, 0.45)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.0) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'rgba(255, 255, 255, 0.25)',
          borderLeftColor: 'rgba(255, 255, 255, 0.25)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        <AnimatePresence mode="wait">
          {!successWsName ? (
            <motion.div
              key="join-form"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex flex-col"
            >
              <div className="flex flex-col items-center text-center mb-10 w-full">
                <div className="w-16 h-16 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/20">
                  <KeyRound className="w-8 h-8 text-[#00d2ff]" />
                </div>

                <p className="text-[14px] font-medium text-[#8b949e] uppercase tracking-wider mb-1">
                  Team Invitation
                </p>
                <h1 className="text-[28px] font-semibold tracking-tight text-white leading-tight">
                  Join a Workspace
                </h1>
              </div>

              {error && (
                <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm backdrop-blur-md">
                  {error}
                </div>
              )}

              <div className="space-y-8 w-full">
                <div className="space-y-2 relative">
                  <label className="text-[13px] font-medium text-[#8b949e] block pl-1">Secret Invite Code</label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder="e.g. A1B2C3D4"
                    className="w-full px-5 py-4 bg-black/30 border border-white/10 rounded-xl transition-all duration-300 font-mono tracking-[0.3em] text-center text-xl uppercase text-white placeholder:text-white/20 placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-[#5c7eff80] focus:bg-black/50 focus:ring-4 focus:ring-[#5c7eff1a]"
                  />
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isJoining || inviteCode.trim().length < 4}
                  className="w-full py-4 rounded-xl text-white font-semibold text-[16px] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #00d2ff, #7a28cb 100%)',
                    boxShadow: '0 4px 15px rgba(0, 210, 255, 0.2)',
                  }}
                  onMouseOver={(e) => {
                    if (!isJoining && inviteCode.trim().length >= 4) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 210, 255, 0.35)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isJoining && inviteCode.trim().length >= 4) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 210, 255, 0.2)';
                    }
                  }}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Enter Workspace
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <p className="mt-8 text-center text-[13px] text-slate-500">
                Don&apos;t have a code?{" "}
                <Link href="/login" className="text-[#00d2ff] hover:text-white transition-colors cursor-pointer">
                  Ask your team admin
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="success-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full flex flex-col items-center justify-center py-8"
            >
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[24px] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,210,255,0.3)]">
                <Sparkles className="w-10 h-10 text-[#00d2ff]" />
              </div>

              <h2 className="text-[32px] font-semibold tracking-tight text-white mb-3 text-center leading-tight">Welcome In</h2>
              <p className="text-[16px] text-[#8b949e] text-center mb-8">
                Connecting you to <span className="text-white font-medium">{successWsName}</span>...
              </p>

              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-[#00d2ff] to-[#7a28cb]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
