import React from 'react';
import { Hash, MessageSquarePlus } from 'lucide-react';

export default async function SingleWorkspacePage({
  params
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black relative overflow-hidden">
      {/* Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col items-center text-center max-w-lg z-10 p-8">
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
          <MessageSquarePlus className="w-12 h-12 text-indigo-400" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Welcome to the Workspace
        </h1>

        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
          You're all set! Select a channel from the left sidebar to start chatting, or create a new one to organize your conversations.
        </p>

        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer">
            <Hash className="w-4 h-4 text-emerald-400" /> <span className="text-slate-300 group-hover:text-white">general</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer">
            <Hash className="w-4 h-4 text-indigo-400" /> <span className="text-slate-300 group-hover:text-white">development</span>
          </div>
        </div>
      </div>
    </div>
  );
}