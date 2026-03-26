"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { InviteService } from "@/lib/services/invite.service";
import Link from "next/link";

interface ValidatedInvite {
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  roles: string[];
}

export default function JoinWorkspacePage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState<1 | 2>(1);
  const [inviteCode, setInviteCode] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [validatedInvite, setValidatedInvite] = useState<ValidatedInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Step 1 — Validate the invite code
  const handleValidateCode = async () => {
    const trimmed = inviteCode.trim();
    if (trimmed.length < 4) {
      setError("Please enter a valid invite code.");
      return;
    }

    try {
      setIsValidating(true);
      setError(null);
      const res = await InviteService.validateInvite(trimmed);
      const data = res.data; // The server wraps response payload in { success: true, data: {...} }
      setValidatedInvite({
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        workspaceId: data.workspaceId,
        workspaceName: data.workspaceName,
        roles: data.roles,
      });
      setStep(2);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Invalid or expired invite code.");
    } finally {
      setIsValidating(false);
    }
  };

  // Step 2 — Join the workspace with selected role
  const handleJoin = async () => {
    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }

    try {
      setIsJoining(true);
      setError(null);
      const res = await InviteService.joinWorkspace(inviteCode.trim(), selectedRole);
      const data = res.data; // { organizationId, workspaceId, ... }

      // Update user's store
      if (user) {
        // Prevent duplicate org
        const isOrgMember = user.organizations?.some(o => o.orgId === data.organizationId);
        const updatedOrgs = isOrgMember 
          ? user.organizations 
          : [
              ...(user.organizations || []),
              {
                orgId: data.organizationId,
                role: selectedRole,
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
                name: data.workspaceName,
                joinedAt: new Date().toISOString(),
              },
            ];

        setUser({
          ...user,
          organizations: updatedOrgs,
          workspaces: updatedWorkspaces
        });
      }

      router.push(`/workspace/${data.workspaceId}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to join workspace.");
    } finally {
      setIsJoining(false);
    }
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

      {/* Card */}
      <div className="w-full max-w-[440px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Progress indicator */}
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full bg-slate-200"
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        <div className="p-8 sm:p-10 relative flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Join a Workspace</h1>
                  <p className="text-sm text-slate-400">
                    Enter the invite code shared by your team.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1 mb-6">
                  <label className="text-sm font-medium text-slate-300">Invite Code</label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
                    placeholder="e.g. A1B2C3D4"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-mono tracking-[0.3em] text-center text-lg uppercase text-white placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans"
                  />
                </div>

                <button
                  onClick={handleValidateCode}
                  disabled={isValidating}
                  className="w-full py-2.5 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60"
                >
                  {isValidating ? "Checking code..." : "Continue"}
                </button>

                <p className="mt-4 text-center text-xs text-slate-500">
                  Don&apos;t have a code?{" "}
                  <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                    Ask your team admin
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* Header */}
                <div className="mb-6">
                  <button
                    onClick={() => { setStep(1); setError(null); setSelectedRole(""); }}
                    className="text-slate-400 hover:text-white transition-colors mb-4 flex items-center gap-1.5 text-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                    Change code
                  </button>

                  <h2 className="text-xl font-semibold tracking-tight text-white">Select Your Role</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    You&apos;re joining{" "}
                    <span className="text-white font-medium">{validatedInvite?.workspaceName}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    part of {validatedInvite?.organizationName}
                  </p>
                </div>

                {/* Org info card */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 border border-white/10 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {validatedInvite?.workspaceName?.[0]?.toUpperCase() ?? "W"}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{validatedInvite?.workspaceName}</p>
                    <p className="text-xs text-slate-400">Invite code: <span className="font-mono text-slate-300">{inviteCode}</span></p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1 mb-2">
                  <label className="text-sm font-medium text-slate-300">Choose a Role</label>
                </div>

                <div className="space-y-2 mb-6">
                  {validatedInvite?.roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                        selectedRole === role
                          ? "border-slate-400 bg-white/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{role}</span>
                        {selectedRole === role && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isJoining || !selectedRole}
                  className="w-full py-2.5 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60"
                >
                  {isJoining ? "Joining workspace..." : "Join Workspace"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2 z-10">
        <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? "bg-white" : "bg-white/30"}`} />
        <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? "bg-white" : "bg-white/30"}`} />
      </div>
    </div>
  );
}
