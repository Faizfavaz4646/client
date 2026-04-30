import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { OrganizationService } from '@/lib/services/organization.service';
import { ChannelService } from '@/lib/services/channel.service';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { Plus, Check, Loader2, Search, X, UserPlus, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function AddChannelMemberDropdown({
    isOpen,
    onClose,
    orgId,
    channelId,
    workspaceId,
    onMemberAdded,
    existingMemberIds = [],
}: {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    channelId: string;
    workspaceId: string;
    onMemberAdded: (channel: any) => void;
    existingMemberIds?: string[];
}) {
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [addingId, setAddingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && orgId && workspaceId) {
            const fetchMembers = async () => {
                try {
                    setIsLoading(true);
                    
                    const [orgRes, wsRes] = await Promise.all([
                        OrganizationService.getOrganizationMembers(orgId),
                        WorkspaceService.getWorkspaceById(workspaceId)
                    ]);

                    if (orgRes.success && wsRes.success) {
                        const allOrgMembers = orgRes.data?.members || [];
                        const workspaceMembers = wsRes.data?.workspace?.members || wsRes.data?.members || [];
                        const workspaceMemberIds = new Set(workspaceMembers.map((m: any) => m.userId?.toString() || m.userId?._id?.toString() || m.id?.toString()));
                        
                        const wsMembersOnly = allOrgMembers.filter((m: any) => workspaceMemberIds.has(m.id?.toString()));
                        setMembers(wsMembersOnly);
                    }
                } catch (error) {
                    console.error("Failed to fetch members:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMembers();
        }
    }, [isOpen, orgId, workspaceId]);

    const [successId, setSuccessId] = useState<string | null>(null);

    const handleAddMember = async (userId: string) => {
        try {
            setAddingId(userId);
            setSuccessId(null);
            const memberName = members.find(m => (m.id?.toString() || m._id?.toString()) === userId)?.name || 'Member';
            const res = await ChannelService.addMemberToChannel(channelId, userId);
            if (res?.success) {
                setSuccessId(userId);
                toast.success(`Successfully added ${memberName} to channel`, {
                    description: "They can now participate in conversations.",
                    icon: <Check className="w-4 h-4 text-emerald-500" />
                });
                onMemberAdded(res.data.channel);
                setTimeout(() => {
                    setAddingId(null);
                    setSuccessId(null);
                }, 2000); 
            }
        } catch (error) {
            console.error("Failed to add member to channel:", error);
            setAddingId(null);
            setSuccessId(null);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:top-14 sm:right-0 sm:w-80 bg-[#16181d]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.8)] overflow-hidden z-[70] flex flex-col"
                    >
                        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-semibold text-white">Add to Channel</span>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-72 custom-scrollbar p-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                </div>
                            ) : filteredMembers.length > 0 ? (
                                <div className="space-y-1">
                                    {filteredMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full shadow-sm object-cover bg-black/50" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 font-medium text-xs">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-medium text-slate-200 truncate">{member.name}</span>
                                                    <span className="text-xs text-slate-500 truncate">{member.role || 'Member'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                {successId === member.id && (
                                                    <span className="text-[10px] font-bold text-emerald-400 animate-in fade-in slide-in-from-right-1">Added!</span>
                                                )}
                                                {existingMemberIds.includes(member.id?.toString()) ? (
                                                    <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-medium text-slate-500">
                                                        Member
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddMember(member.id)}
                                                        disabled={addingId === member.id}
                                                        className={`p-1.5 rounded-lg border transition-all shrink-0 ${addingId === member.id
                                                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-indigo-400'
                                                            }`}
                                                    >
                                                        {addingId === member.id ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : (
                                                            <UserPlus className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-sm text-slate-500">
                                    No organization members found.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
