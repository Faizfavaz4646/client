'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Users, Link as LinkIcon, Shield, AlertTriangle, X } from 'lucide-react';
import GeneralTab from './tabs/GeneralTab';
import MembersTab from './tabs/MembersTab';
import InvitesTab from './tabs/InvitesTab';
import PermissionsTab from './tabs/PermissionsTab';
import DangerZoneTab from './tabs/DangerZoneTab';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspace: any; // The workspace data from global state/parent
}

type TabType = 'general' | 'members' | 'invites' | 'permissions' | 'danger';

export default function WorkspaceSettingsModal({ isOpen, onClose, workspaceId, workspace }: WorkspaceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'Overview', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'invites', label: 'Invites', icon: LinkIcon },
    { id: 'permissions', label: 'Roles & Permissions', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, color: 'text-red-400' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Body */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-5xl h-[85vh] bg-[#0b0f1f] border border-indigo-500/20 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)] flex overflow-hidden flex-col md:flex-row"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-[#11183a] border-r border-indigo-500/20 flex flex-col shrink-0">
          <div className="p-6 border-b border-indigo-500/20 flex items-center justify-between md:block">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Workspace</h2>
              <p className="text-xs text-indigo-300/70 mt-1 truncate">{workspace?.name || 'Settings'}</p>
            </div>
            {/* Mobile close button */}
            <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
               <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-row md:flex-col gap-2 custom-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm whitespace-nowrap
                    ${isActive 
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-inner' 
                      : `hover:bg-white/5 ${tab.color || 'text-slate-400 hover:text-white'}`
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[#0b0f1f] overflow-hidden relative">
          <div className="absolute top-4 right-4 hidden md:block z-10">
             <button 
               onClick={onClose}
               className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
               title="Close Settings (ESC)"
             >
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
             <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl"
                >
                  {activeTab === 'general' && <GeneralTab workspaceId={workspaceId} workspace={workspace} />}
                  {activeTab === 'members' && <MembersTab workspaceId={workspaceId} />}
                  {activeTab === 'invites' && <InvitesTab workspaceId={workspaceId} />}
                  {activeTab === 'permissions' && <PermissionsTab workspaceId={workspaceId} workspace={workspace} />}
                  {activeTab === 'danger' && <DangerZoneTab workspaceId={workspaceId} workspace={workspace} />}
                </motion.div>
             </AnimatePresence>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
