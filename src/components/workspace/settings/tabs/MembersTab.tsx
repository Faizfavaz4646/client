import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, ShieldAlert, UserMinus, Shield } from 'lucide-react';
import { workspaceSettingsService } from '@/lib/services/workspaceSettings.service';
import { IWorkspaceSettingsMember } from '@/types/workspaceSettings.types';
import { toast } from 'sonner';

export default function MembersTab({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<IWorkspaceSettingsMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const res = await workspaceSettingsService.getMembers(workspaceId, page, 20, search);
      setMembers(res.data.members);
      setTotalPages(res.data.pagination.pages);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timeout = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [workspaceId, page, search]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await workspaceSettingsService.updateMemberRole(workspaceId, userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      setOpenMenuId(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleKick = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member? They will lose access to all channels.')) return;
    try {
      await workspaceSettingsService.removeMember(workspaceId, userId);
      toast.success('Member removed');
      setOpenMenuId(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h3 className="text-2xl font-bold text-white tracking-tight">Members</h3>
        <p className="text-sm text-slate-400 mt-1">Manage who has access to this workspace and their roles.</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, username, or email..."
          className="w-full bg-[#1c2242] border border-indigo-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-500"
        />
      </div>

      {/* Members List */}
      <div className="flex-1 bg-[#11183a] border border-white/5 rounded-2xl overflow-hidden shadow-inner flex flex-col min-h-[400px]">
        {isLoading && members.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <UserMinus className="w-12 h-12 mb-4 opacity-50" />
            <p>No members found matching "{search}"</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1c2242] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-slate-300">{(member.name || member.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm truncate">{member.name || member.username}</span>
                      {member.role === 'owner' && <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Owner</span>}
                      {member.role === 'admin' && <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>}
                    </div>
                    <span className="text-xs text-slate-500 truncate">{member.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                    className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === member.id && (
                    <div className="absolute right-0 top-10 w-48 bg-[#252b4d] border border-indigo-500/20 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                      {member.role !== 'owner' && (
                        <>
                          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/5 bg-black/20">Change Role</div>
                          <button 
                            onClick={() => handleRoleChange(member.id, 'admin')}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1c2242] flex items-center gap-2 transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4 text-indigo-400" /> Make Admin
                          </button>
                          <button 
                            onClick={() => handleRoleChange(member.id, 'member')}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1c2242] flex items-center gap-2 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-emerald-400" /> Make Member
                          </button>
                          <div className="h-px bg-white/5 my-1" />
                          <button 
                            onClick={() => handleKick(member.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                          >
                            <UserMinus className="w-4 h-4" /> Remove from Workspace
                          </button>
                        </>
                      )}
                      {member.role === 'owner' && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">Owners cannot be modified here.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between text-sm">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 rounded-lg"
            >
              Previous
            </button>
            <span className="text-slate-500 font-medium">Page {page} of {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 rounded-lg"
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
