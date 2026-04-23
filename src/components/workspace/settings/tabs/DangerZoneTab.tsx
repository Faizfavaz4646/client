import React, { useState } from 'react';
import { AlertOctagon, CornerRightDown } from 'lucide-react';
import { workspaceSettingsService } from '@/lib/services/workspaceSettings.service';
import { toast } from 'sonner';

export default function DangerZoneTab({ workspaceId, workspace }: { workspaceId: string, workspace: any }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDelete = async () => {
    if (deleteConfirmText !== workspace?.name) {
      toast.error('Workspace name does not match.');
      return;
    }
    
    try {
      setIsDeleting(true);
      await workspaceSettingsService.deleteWorkspace(workspaceId);
      toast.success('Workspace permanently deleted');
      setTimeout(() => {
        window.location.href = '/workspace/setup'; // Redirect to workspace selector
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-red-400 tracking-tight flex items-center gap-2">
           <AlertOctagon className="w-6 h-6" /> Danger Zone
        </h3>
        <p className="text-sm text-slate-400 mt-1 max-w-xl">
          Highly destructive actions. These settings affect the entire workspace lifecycle and cannot be easily undone.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Transfer Ownership Box */}
        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1 h-full bg-red-500/30 group-hover:bg-red-500/50 transition-colors" />
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
               <h4 className="text-lg font-bold text-white mb-1">Transfer Ownership</h4>
               <p className="text-sm text-slate-400 max-w-md">
                 Pass complete administrative control of this workspace to another Admin. You will be demoted to an Admin immediately.
               </p>
               <br />
               <p className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                 <CornerRightDown className="w-3 h-3" /> Backend Implementation Pending
               </p>
             </div>
             <button 
               disabled
               title="API Route not implemented yet"
               className="bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-2.5 rounded-xl font-medium cursor-not-allowed opacity-50 shrink-0"
             >
               Transfer Ownership
             </button>
           </div>
        </div>

        {/* Delete Workspace Box */}
        <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1 h-full bg-red-600 transition-colors" />
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
             <div className="flex-1">
               <h4 className="text-lg font-bold text-white mb-2">Delete Workspace</h4>
               <p className="text-sm text-slate-400 mb-4 max-w-lg">
                 Permanently delete this workspace, including all messages, connected channels, files, and tasks. This action is irreversible.
               </p>
               
               <div className="bg-[#0b0f1f] border border-red-500/20 rounded-xl p-4">
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                   Please type <span className="text-red-400 font-bold select-none">{workspace?.name}</span> to confirm
                 </label>
                 <input 
                   type="text"
                   value={deleteConfirmText}
                   onChange={(e) => setDeleteConfirmText(e.target.value)}
                   className="w-full bg-[#1c2242] border border-red-500/20 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600"
                   placeholder="Type workspace name..."
                 />
               </div>
             </div>
             
             <button 
               onClick={handleDelete}
               disabled={isDeleting || deleteConfirmText !== workspace?.name}
               className="mt-2 md:mt-0 bg-red-600 hover:bg-red-500 disabled:bg-[#1c2242] disabled:text-slate-500 disabled:border disabled:border-white/5 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 shrink-0"
             >
               {isDeleting ? 'Deleting...' : 'Delete Workspace'}
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}
