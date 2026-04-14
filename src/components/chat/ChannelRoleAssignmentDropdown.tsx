import React, { useState, useEffect } from 'react';
import { OrganizationService } from '@/lib/services/organization.service';
import { ChannelService } from '@/lib/services/channel.service';
import { Shield, Check, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChannelRoleAssignmentDropdown({
    isOpen,
    onClose,
    orgId,
    channelId,
    initialAllowedRoles = [],
    onChannelUpdated,
}: {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    channelId: string;
    initialAllowedRoles?: string[];
    onChannelUpdated: (channel: any) => void;
}) {
    const [roles, setRoles] = useState<string[]>([]);
    const [allowedRoles, setAllowedRoles] = useState<string[]>(initialAllowedRoles);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && orgId) {
            const fetchRoles = async () => {
                try {
                    setIsLoading(true);
                    const res = await OrganizationService.getOrgRoles(orgId);
                    if (res && res.data && res.data.roles) {
                        setRoles(res.data.roles);
                    }
                } catch (error) {
                    console.error("Failed to fetch roles:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRoles();
            setAllowedRoles(initialAllowedRoles);
        }
    }, [isOpen, orgId, initialAllowedRoles]);

    const toggleRole = (role: string) => {
        if (role === 'admin') return; // Admin is always allowed
        setAllowedRoles(prev => 
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const res = await ChannelService.updateChannel(channelId, { allowedRoles });
            if (res?.success) {
                onChannelUpdated(res.data.channel);
                onClose();
            }
        } catch (error) {
            console.error("Failed to update channel roles:", error);
        } finally {
            setIsSaving(false);
        }
    };

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
                                <Shield className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-semibold text-white">Channel Access</span>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 pb-0 text-xs text-slate-400 leading-relaxed">
                            Select which roles can view and join this channel. If no roles are selected, everyone can access.
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-72 custom-scrollbar p-2 mt-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {/* Admin is hardcoded and always allowed/checked */}
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 opacity-70 group cursor-not-allowed">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-200">admin</span>
                                            <span className="text-[10px] text-slate-500">Always has access to all channels</span>
                                        </div>
                                        <div className="w-5 h-5 rounded border border-amber-500/30 bg-amber-500/20 flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-amber-400" />
                                        </div>
                                    </div>

                                    {roles.filter(r => r !== 'admin').map((role) => {
                                        const isSelected = allowedRoles.includes(role);
                                        return (
                                            <div 
                                                key={role} 
                                                onClick={() => toggleRole(role)}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                                            >
                                                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{role}</span>
                                                <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                                                    isSelected 
                                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                                                    : 'bg-black/40 border-white/10 text-transparent'
                                                }`}>
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-white/5 bg-black/40 flex justify-end gap-2">
                            <button 
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                            >
                                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
