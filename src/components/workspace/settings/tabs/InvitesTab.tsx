import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Plus, Copy, Check, Trash2, Clock, Users } from 'lucide-react';
import { workspaceSettingsService } from '@/lib/services/workspaceSettings.service';
import { IWorkspaceSettingsInvite } from '@/types/workspaceSettings.types';
import { toast } from 'sonner';

export default function InvitesTab({ workspaceId }: { workspaceId: string }) {
  const [invites, setInvites] = useState<IWorkspaceSettingsInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      setIsLoading(true);
      const res = await workspaceSettingsService.getInvites(workspaceId);
      setInvites(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch active invites');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [workspaceId]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await workspaceSettingsService.createInvite(workspaceId, 7, 100); // 7 days, 100 uses
      toast.success('New invite link generated');
      fetchInvites();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate invite');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this link? Anyone using it will no longer be able to join.')) return;
    try {
      await workspaceSettingsService.revokeInvite(workspaceId, inviteId);
      toast.success('Invite link revoked');
      fetchInvites();
    } catch (err: any) {
      toast.error('Failed to revoke invite');
    }
  };

  const copyToClipboard = (code: string) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Invite link copied to clipboard');
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Invite Links</h3>
          <p className="text-sm text-slate-400 mt-1">Manage active invite links mapping to your workspace.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> {isGenerating ? 'Generating...' : 'New Link'}
        </button>
      </div>

      <div className="flex-1 bg-[#11183a] border border-white/5 rounded-2xl overflow-hidden shadow-inner flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : invites.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <LinkIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium text-slate-400 mb-1">No active invite links</p>
            <p className="text-sm">Generate a new link to let people join.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {invites.map(invite => (
              <div key={invite._id} className="bg-[#1c2242] border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="bg-black/30 text-indigo-300 font-mono text-sm px-2.5 py-1 rounded-md border border-white/5">
                      {invite.code}
                    </code>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                      Default Invite
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {invite.uses} / {invite.maxUses || '∞'} Uses</span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock className="w-3.5 h-3.5" /> Expires: {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(invite.code)}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/5 group"
                    title="Copy Link"
                  >
                    {copiedId === invite.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 group-active:scale-95" />}
                  </button>
                  <button
                    onClick={() => handleRevoke(invite._id)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/10 group"
                    title="Revoke Link"
                  >
                    <Trash2 className="w-4 h-4 group-active:scale-95" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
