"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { OrganizationService } from '@/lib/services/organization.service';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspaceDashboard() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchOrganizations(); }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await OrganizationService.getUserOrganizations();
      setOrganizations(response.data?.organizations || []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    try {
      // NOTE: Providing placeholder values for the new org registration fields
      // as this form previously only collected name and slug.
      const payload = {
        name,
        email: `admin@${slug || 'temp'}.com`,
        password: 'Password123!',
        category: 'Other',
        roles: ['Admin', 'Member']
      };
      const data = await OrganizationService.registerOrganization(payload);
      const newOrg = data.organization || data.data?.organization;
      if (newOrg?._id) router.push(`/workspace/${newOrg._id}`);
      else { await fetchOrganizations(); setName(''); setSlug(''); }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create organization');
    } finally { setIsCreating(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="relative">
          <div className="h-12 w-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <div className="absolute inset-0 blur-lg bg-white/10 animate-pulse"></div>
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Synchronizing Workspaces...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 selection:bg-white/10">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-white/[0.02] blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-white/[0.01] blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {organizations.length === 0 ? (
          /* ─── EMPTY STATE: CREATE FIRST ORG ─── */
          <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="space-y-6">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto shadow-2xl"
                >
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>
                
                <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
                  Next-Gen <br />
                  <span className="text-slate-400 font-extrabold text-4xl lg:text-5xl">Collaboration Platform</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-slate-300 max-w-2xl leading-relaxed mx-auto mt-4">
                  Connect your team, synchronize your workflow, and build something amazing together. Built for speed and clarity.
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          /* ─── DASHBOARD: SELECT ORG ─── */
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">My Universe</h1>
                <p className="text-slate-400 text-lg">Select a workspace to resume collaboration.</p>
              </div>
              <button
                onClick={() => setOrganizations([])}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-semibold hover:bg-slate-800 hover:border-purple-500/50 transition-all shadow-xl"
              >
                <Plus className="h-5 w-5 text-purple-400" /> New Space
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {organizations.map((org) => (
                <div
                  key={org._id}
                  onClick={() => router.push(`/workspace/${org._id}`)}
                  className="group relative cursor-pointer"
                >
                  <div className="absolute -inset-0.5 bg-white rounded-2xl blur opacity-0 group-hover:opacity-5 transition duration-500"></div>
                  <div className="relative bg-[#111]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all overflow-hidden shadow-xl">
                    <div className="flex items-start justify-between mb-8">
                      <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl font-black text-white group-hover:scale-110 transition-transform duration-500">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-slate-300 transition-colors tracking-tight">{org.name}</h2>
                    <p className="text-slate-500 font-mono text-sm tracking-tighter">synq.app/{org.slug}</p>

                    {/* Decorative element */}
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-purple-500/5 blur-3xl rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}