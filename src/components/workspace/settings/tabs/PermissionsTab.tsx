import React, { useState } from 'react';
import { workspaceSettingsService } from '@/lib/services/workspaceSettings.service';
import { toast } from 'sonner';

export default function PermissionsTab({ workspaceId, workspace }: { workspaceId: string, workspace: any }) {
  const [permissions, setPermissions] = useState({
    membersCanCreateChannels: workspace?.permissions?.membersCanCreateChannels ?? true,
    membersCanInvite: workspace?.permissions?.membersCanInvite ?? true,
    membersCanDeleteMessages: workspace?.permissions?.membersCanDeleteMessages ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await workspaceSettingsService.updatePermissions(workspaceId, permissions);
      toast.success('Permissions updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white tracking-tight">Roles & Permissions</h3>
        <p className="text-sm text-slate-400 mt-1">Configure default abilities for all standard Members.</p>
      </div>

      <div className="space-y-4">
        {/* Toggle 1 */}
        <div className="flex items-center justify-between p-5 bg-[#1c2242] border border-indigo-500/20 rounded-2xl group transition-colors hover:border-indigo-500/40">
          <div>
            <h4 className="text-base font-semibold text-slate-200">Create Channels</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">Allow regular members to create and manage their own Text and Audio channels.</p>
          </div>
          <button 
            type="button"
            onClick={() => handleToggle('membersCanCreateChannels')}
            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${permissions.membersCanCreateChannels ? 'bg-indigo-500' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${permissions.membersCanCreateChannels ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Toggle 2 */}
        <div className="flex items-center justify-between p-5 bg-[#1c2242] border border-indigo-500/20 rounded-2xl group transition-colors hover:border-indigo-500/40">
          <div>
            <h4 className="text-base font-semibold text-slate-200">Generate Invites</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">Allow members to generate their own invite links to bring new people into the workspace.</p>
          </div>
          <button 
            type="button"
            onClick={() => handleToggle('membersCanInvite')}
            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${permissions.membersCanInvite ? 'bg-indigo-500' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${permissions.membersCanInvite ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Toggle 3 */}
        <div className="flex items-center justify-between p-5 bg-[#1c2242] border border-indigo-500/20 rounded-2xl group transition-colors hover:border-indigo-500/40">
          <div>
            <h4 className="text-base font-semibold text-slate-200">Delete Messages</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">Allow members to delete their own messages after they have been sent in channels.</p>
          </div>
          <button 
            type="button"
            onClick={() => handleToggle('membersCanDeleteMessages')}
            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${permissions.membersCanDeleteMessages ? 'bg-indigo-500' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${permissions.membersCanDeleteMessages ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex justify-end">
         <button 
           onClick={handleSave}
           disabled={isSaving}
           className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1c2242] disabled:text-slate-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg active:scale-95"
         >
           {isSaving ? 'Saving...' : 'Save Permissions'}
         </button>
      </div>

    </div>
  );
}
