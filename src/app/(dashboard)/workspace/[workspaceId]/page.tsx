import React from 'react';

export default function SingleWorkspacePage({ params }: { params: { workspaceId: string } }) {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-xl font-bold text-white">🚀</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Workspace Initialized!</h1>
      <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
        You have successfully entered workspace ID: <br/>
        <span className="font-mono text-white mt-1 inline-block bg-white/5 border border-white/10 px-2 py-1 rounded">{params.workspaceId}</span>
      </p>
      
      <div className="p-6 bg-[#111] border border-white/10 rounded-xl max-w-lg w-full text-left shadow-2xl">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Next Steps to Build:</h3>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
             Fetch this specific workspace's channels from the backend.
          </li>
          <li className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
             Build the main chat channel interface here.
          </li>
        </ul>
      </div>
    </div>
  );
}