"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { 
  MessageSquare, Hash, Plus, Settings, 
  Search, Bell, User, X, Check, Copy,
  Building2, Sparkles, Globe, Loader2,
  Mic, Video, Music, Volume2, Trash2
} from 'lucide-react';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { api } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { IUserSafe } from '@/store/authStore';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setLoading = useAuthStore((state) => state.setLoading);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [channels, setChannels] = React.useState<any[]>([]);
  const [isChannelsLoading, setIsChannelsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const activeWorkspaceId = pathname?.split('/')[2];
  const activeWorkspace = user?.workspaces?.find(w => w.workspaceId === activeWorkspaceId);
  const displayName = activeWorkspace ? activeWorkspace.name : "Workspace";

  // 1. Restore session on mount if user is missing
  React.useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.data.user) {
          setUser(res.data.data.user);
        }
      } catch (err) {
        console.error("Session restoration failed", err);
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      restoreSession();
    } else {
      setLoading(false);
    }
  }, [user, setUser, setLoading]);

  // 2. Fetch Channels for active workspace
  React.useEffect(() => {
    if (!activeWorkspaceId) {
      setChannels([]);
      return;
    }
    const fetchChannels = async () => {
      try {
        setIsChannelsLoading(true);
        const res = await api.get(`/channels/workspace/${activeWorkspaceId}`);
        setChannels(res.data.data.channels || []);
      } catch (err) {
        console.error("Failed to fetch channels", err);
      } finally {
        setIsChannelsLoading(false);
      }
    };
    fetchChannels();
  }, [activeWorkspaceId]);

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspaceId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/workspaces/${activeWorkspaceId}`);
      // Refresh user data to remove the workspace from the list
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.data.user) {
        setUser(res.data.data.user);
      }
      setIsDeleteModalOpen(false);
      router.push('/workspace'); // Redirect to selection page
    } catch (err) {
      console.error("Failed to delete workspace", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Logic to determine if user is an Organization Founder
  const isOrgFounder = user?.organizations?.some(org => org.role === 'admin');

  // Loading State (Premium Spinner)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-slate-500/20 border-t-white rounded-full"
        />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Syncing session...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-slate-300 overflow-hidden font-sans">
      
      {/* ─── FAR LEFT SIDEBAR (WORKSPACES) ─── */}
      <aside className="w-20 bg-[#000000] border-r border-slate-800/60 flex flex-col items-center py-4 gap-4 shrink-0 z-20">
        {/* Home / Direct Messages placeholder */}
        <div className="group relative">
          <button className="w-12 h-12 bg-slate-900 rounded-3xl hover:rounded-xl transition-all duration-300 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white">
             <MessageSquare className="w-6 h-6" />
          </button>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-full transition-all duration-300 group-hover:h-5"></div>
        </div>
        
        <div className="w-8 h-[2px] bg-slate-800 rounded-full"></div>

        {/* Workspace List (Dynamic) */}
        {user?.workspaces?.map((ws) => {
          const isActive = pathname?.includes(ws.workspaceId);
          // Helper for initials
          const initials = ws.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div key={ws.workspaceId} className="group relative">
              <Link href={`/workspace/${ws.workspaceId}`}>
                <button className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold transition-all ${
                  isActive 
                    ? "bg-white text-black shadow-lg" 
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}>
                  {initials}
                </button>
              </Link>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full transition-all duration-300"></div>
              )}
              {!isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white opacity-0 group-hover:opacity-100 group-hover:h-5 rounded-r-full transition-all duration-300"></div>
              )}
            </div>
          );
        })}

        {/* Add Workspace / Create Workspace */}
        <div className="group/btn relative mt-auto mb-4">
          <div className="absolute left-[60px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity z-50">
            {isOrgFounder ? 'Create Workspace' : 'Join Workspace'}
            <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-[4px] border-transparent border-r-slate-800"></div>
          </div>
          {isOrgFounder ? (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 bg-slate-900/80 border border-white/[0.06] rounded-xl hover:rounded-lg transition-all duration-300 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5"
            >
               <Plus className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/workspace/join">
              <button className="w-12 h-12 bg-slate-900/80 border border-white/[0.06] rounded-xl hover:rounded-lg transition-all duration-300 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5">
                 <Plus className="w-5 h-5" />
              </button>
            </Link>
          )}
        </div>
      </aside>

      {/* ─── CREATE WORKSPACE MODAL ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-[420px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-0 shadow-2xl overflow-hidden"
            >
              {/* Top accent line */}
              <div className="h-[2px] bg-white/20" />

                <CreateWorkspaceForm 
                  onSuccess={(newUser: IUserSafe) => {
                    setUser(newUser);
                  }} 
                  onClose={() => setIsModalOpen(false)}
                />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CREATE CHANNEL MODAL ─── */}
      <AnimatePresence>
        {isChannelModalOpen && activeWorkspaceId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChannelModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-[420px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-0 shadow-2xl overflow-hidden"
            >
              <div className="h-[2px] bg-white/20" />
                <CreateChannelForm 
                  workspaceId={activeWorkspaceId}
                  onSuccess={(newChannel: any) => {
                    setChannels(prev => [...prev, newChannel]);
                    setIsChannelModalOpen(false);
                  }} 
                  onClose={() => setIsChannelModalOpen(false)}
                />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
       {/* ─── DELETE WORKSPACE MODAL ─── */}
       <AnimatePresence>
         {isDeleteModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsDeleteModalOpen(false)}
               className="absolute inset-0 bg-black/70 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.97, y: 12 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.97, y: 12 }}
               transition={{ duration: 0.2, ease: 'easeOut' }}
               className="relative w-full max-w-[420px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-0 shadow-2xl overflow-hidden"
             >
               <div className="h-[2px] bg-red-500/50" />
               <div className="p-8">
                 <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-500/20">
                   <Trash2 className="w-8 h-8 text-red-500" />
                 </div>
                 <h2 className="text-2xl font-bold text-white text-center mb-2 tracking-tight">Delete Workspace?</h2>
                 <p className="text-slate-400 text-center mb-8 text-sm leading-relaxed">
                   This will permanently delete <span className="text-white font-semibold">"{displayName}"</span> and all its channels. This action cannot be undone.
                 </p>
                 <div className="flex flex-col gap-3">
                   <button 
                     onClick={handleDeleteWorkspace}
                     disabled={isDeleting}
                     className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                   >
                     {isDeleting ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                       "Delete Permanently"
                     )}
                   </button>
                   <button 
                     onClick={() => setIsDeleteModalOpen(false)}
                     disabled={isDeleting}
                     className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-md border border-white/10 transition-all"
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

      {/* ─── INNER LEFT SIDEBAR (CHANNELS) ─── */}
      <aside className="w-60 bg-[#0a0a0a] border-r border-slate-800/60 flex flex-col shrink-0 z-10 hidden md:flex">
          
          {/* Workspace Header */}
          <div className="h-16 border-b border-slate-800/60 flex items-center px-4 hover:bg-slate-900/40 cursor-pointer transition-all shrink-0">
            <span className="font-semibold text-slate-100 truncate text-lg">{displayName}</span>
          </div>

          {/* Channel Categories */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <div className="flex flex-col items-center justify-center mb-6 mt-4 px-4">
               <div className="flex items-center justify-center gap-3 mb-3">
                 {isOrgFounder && (
                   <button 
                     onClick={() => setIsDeleteModalOpen(true)}
                     className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/20 group"
                     title="Delete Workspace"
                   >
                     <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                   </button>
                 )}
                 <button 
                  onClick={() => setIsChannelModalOpen(true)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/20 group"
                  title="Create Channel"
                 >
                   <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                 </button>
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] select-none">Channels</span>
            </div>

            {isChannelsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : channels.length > 0 ? (
              channels.map(channel => {
                const Icon = channel.type === 'VOICE' ? Mic : 
                            channel.type === 'VIDEO' ? Video :
                            channel.type === 'AUDIO' ? Music : Hash;
                return (
                  <Link key={channel._id || channel.id} href={`/workspace/${activeWorkspaceId}/channel/${channel._id || channel.id}`}>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium truncate">{channel.name}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-6 opacity-50 text-center px-4">
                <Hash className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-500">No channels yet.</p>
              </div>
            )}
          </nav>

          {/* User Profile Bar */}
          <div className="h-14 bg-black p-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded-md cursor-pointer w-full transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                 <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-white truncate leading-tight">{user?.name || "Username"}</span>
                <span className="text-[11px] text-slate-400 leading-tight">#{user?.username || "1337"}</span>
              </div>
            </div>
            <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] pointer-events-none"></div>
        
        {/* Channel Header */}
        <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-6 bg-black/80 backdrop-blur-md z-20 shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              {/* Optional: Add channel specific name here later */}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center bg-[#111] border border-slate-800 rounded-md px-3 py-1.5 w-64 focus-within:border-white/20 transition-all shadow-inner">
                <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm text-slate-200 w-full" />
                <Search className="h-4 w-4 text-slate-500 ml-2" />
              </div>
              <button className="text-slate-400 hover:text-white transition-all">
                <Bell className="h-5 w-5" />
              </button>
              <button className="text-slate-400 hover:text-white transition-all">
                <User className="h-5 w-5" />
              </button>
            </div>
          </header>

        {/* Page Content passed below */}
        <div className="flex-1 overflow-auto relative z-10 custom-scrollbar flex flex-col bg-black">
          {children}
        </div>
      </main>
    </div>
  );
}

function CreateWorkspaceForm({ 
  onSuccess, 
  onClose 
}: { 
  onSuccess: (user: IUserSafe) => void;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = React.useState<string | null>(null);
  const [newWorkspaceId, setNewWorkspaceId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-generate slug from name
  React.useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    setSlug(generatedSlug);
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Create Workspace
      // Use the first organization where the user is an admin
      const orgAdmin = user?.organizations?.find(o => o.role === 'admin');
      
      const wsRes = await WorkspaceService.createWorkspace({ 
        name,
        orgId: orgAdmin?.orgId
      });
      const workspaceId = wsRes.data._id;
      setNewWorkspaceId(workspaceId);

      // 2. Generate Invite Code for this workspace
      const inviteRes = await api.post('/invites', {
        organizationId: wsRes.data.orgId,
        workspaceId: workspaceId,
        expiresInHours: 168, // 1 week
        maxUses: 100
      });

      setCreatedInvite(inviteRes.data.data.invite.code);
      
      // 3. Refresh user data to get the new workspace in the sidebar
      const userRes = await api.get('/auth/me');
      onSuccess(userRes.data.data.user);

    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create workspace');
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdInvite) return;
    navigator.clipboard.writeText(createdInvite);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdInvite) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center justify-center pt-2">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6">
                <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Space Launched!</h2>
            <p className="text-slate-400 text-center text-sm px-4">Your new workspace is ready. Use this invite code to bring in your team.</p>
        </div>

        <div className="mt-8 flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl justify-between group/code transition-all hover:border-white/20">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold ml-1 mb-1">Invite Code</span>
                <code className="text-2xl font-mono font-bold text-white px-1 tracking-wider">
                    {createdInvite}
                </code>
            </div>
            <button 
              onClick={copyToClipboard}
              className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/10 group-hover/code:scale-105 active:scale-95"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
        </div>

        <button 
          onClick={() => {
            if (newWorkspaceId) {
              router.push(`/workspace/${newWorkspaceId}`);
              onClose();
            } else {
              window.location.reload();
            }
          }}
          className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all shadow-xl active:scale-[0.98] mt-4"
        >
          Go to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center justify-center mb-8 text-center pt-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 relative group">
                <Building2 className="w-6 h-6 text-white relative z-10" />
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Launch Your Space</h2>
            <p className="text-slate-400 text-sm max-w-[280px]">Establish your team's headquarters on SYNQ.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 block mb-1">Workspace Name</label>
            <div className="relative group">
              <input 
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Galaxy Design"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 block mb-1">Workspace Slug</label>
            <div className="relative group flex items-center">
              <div className="absolute left-3 text-slate-500 font-medium pointer-events-none select-none text-sm border-r border-white/10 pr-2 py-1">synq.com/</div>
              <input 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="galaxy"
                className="w-full pl-[95px] px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <button 
            disabled={isLoading || !name.trim()}
            className="w-full py-2.5 mt-2 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
                <>
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                    />
                    <span>Launching...</span>
                </>
            ) : (
                "Initialize Workspace"
            )}
          </button>
        </form>
    </div>
  );
}

function CreateChannelForm({ 
  workspaceId,
  onSuccess, 
  onClose 
}: { 
  workspaceId: string;
  onSuccess: (channel: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'TEXT' | 'VOICE' | 'AUDIO' | 'VIDEO'>('TEXT');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await api.post('/channels', {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type,
        workspaceId
      });

      onSuccess(res.data.data.channel);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create channel');
      setIsLoading(false);
    }
  };

  const channelTypes = [
    { id: 'TEXT', label: 'Text', icon: Hash, desc: 'Send messages, images, and tools' },
    { id: 'VOICE', label: 'Voice', icon: Mic, desc: 'Hang out with voice and audio' },
    { id: 'AUDIO', label: 'Audio', icon: Music, desc: 'Dedicated audio streaming' },
    { id: 'VIDEO', label: 'Video', icon: Video, desc: 'Face-to-face video calls' },
  ];

  return (
    <div className="p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center justify-center mb-8 text-center pt-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 relative group">
                {type === 'TEXT' && <Hash className="w-6 h-6 text-white relative z-10" />}
                {type === 'VOICE' && <Mic className="w-6 h-6 text-white relative z-10" />}
                {type === 'AUDIO' && <Music className="w-6 h-6 text-white relative z-10" />}
                {type === 'VIDEO' && <Video className="w-6 h-6 text-white relative z-10" />}
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Create Channel</h2>
            <p className="text-slate-400 text-sm max-w-[280px]">Set up a new space for your team to connect.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Channel Type</label>
            <div className="grid grid-cols-1 gap-2">
              {channelTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    type === t.id 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-transparent border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${type === t.id ? 'bg-white/10' : 'bg-white/5'}`}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-[11px] opacity-60">{t.desc}</div>
                  </div>
                  {type === t.id && (
                    <div className="ml-auto w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 block mb-1">Channel Name</label>
            <div className="relative group flex items-center">
              <div className="absolute left-3 text-slate-500 font-medium pointer-events-none select-none text-sm border-r border-white/10 pr-2 py-1">
                {type === 'TEXT' ? '#' : <Volume2 className="w-3.5 h-3.5" />}
              </div>
              <input 
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new-channel"
                className="w-full pl-[40px] px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <button 
            disabled={isLoading || !name.trim()}
            className="w-full py-2.5 mt-2 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
                <>
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                    />
                    <span>Creating...</span>
                </>
            ) : (
                "Create Channel"
            )}
          </button>
        </form>
    </div>
  );
}