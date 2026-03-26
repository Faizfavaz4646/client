'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from './Navbar';
import DarkVeil from './DarkVeil';

export default function MarketingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-slate-50 font-sans bg-[#0a0a0a]">
      <Navbar />

      {/* ========================================= */}
      {/* HERO SECTION */}
      {/* ========================================= */}
      <section className="relative z-10 w-full pt-40 pb-20 lg:pt-48 lg:pb-32 min-h-[90vh] flex items-center justify-center text-center">
        {/* DarkVeil Background */}
        <div className="absolute top-0 left-0 right-0 z-[-1] overflow-hidden" style={{ width: '100%', height: '800px' }}>
          {/* <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.5}
            scanlineFrequency={0}
            warpAmount={0}
          /> */}
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center gap-6 relative z-10">
          

          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Next-Gen Collaboration <br />
            <span className="text-slate-400">Platform</span>
          </h1>

          <p className="text-lg lg:text-xl text-slate-300 max-w-2xl leading-relaxed mt-4">
            Empower your distributed teams with AI-powered workflows, real-time sync, and seamless communication across every touchpoint. Built for speed and clarity.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
            <button className="px-8 py-3.5 rounded-md bg-white text-black font-medium hover:bg-slate-200 transition-colors w-full sm:w-auto shadow-sm">
              Start Free Trial
            </button>
            <button className="px-8 py-3.5 rounded-md bg-black border border-white/20 text-white font-medium hover:bg-white/10 transition-colors w-full sm:w-auto shadow-sm">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* MARKETING SECTION 1 */}
      {/* ========================================= */}
      <section className="relative z-10 w-full px-6 lg:px-8 py-20 bg-[#0a0a0a] border-y border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 w-full order-2 lg:order-1">
            <div className="relative rounded-2xl bg-[#111] border border-white/10 p-2 shadow-xl">
              <div className="aspect-[4/3] bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-slate-500 font-medium tracking-widest text-sm uppercase">Communication Dashboard</span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 order-1 lg:order-2">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              Crystal Clear <br /> Voice & Video
            </h2>
            <p className="text-lg lg:text-xl text-slate-400 max-w-lg leading-relaxed">
              Jump into high-fidelity audio and video rooms instantly. No meeting links required. Screen share, co-browse, and collaborate as if you are in the same room.
            </p>
            <ul className="space-y-3 mt-6">
              {[
                "Instant drop-in audio channels",
                "High definition screen sharing",
                "Low-latency global infrastructure"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-xs">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* MARKETING SECTION 2 */}
      {/* ========================================= */}
      <section id='marketing' className="relative z-10 w-full px-6 lg:px-8 py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              Manage Tasks <br /> At The Speed Of Chat
            </h2>
            <p className="text-lg lg:text-xl text-slate-400 max-w-lg leading-relaxed">
              Don't let ideas get lost in the scroll. Turn any message into an actionable task, assign it to a teammate, and track it seamlessly.
            </p>
            <div className="pt-4">
              <Link href="/features" className="text-white font-semibold hover:text-slate-300 transition-colors inline-flex items-center gap-2">
                Explore workflow features <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full relative">
             <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2 rounded-2xl bg-[#111] border border-white/10 p-6 shadow-md">
                 <div className="w-full h-8 bg-[#222] rounded mb-4"></div>
                 <div className="w-3/4 h-4 bg-[#222] rounded mb-2"></div>
                 <div className="w-1/2 h-4 bg-[#222] rounded mb-6"></div>
                 <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-full bg-[#333]"></div>
                   <div className="w-8 h-8 rounded-full bg-[#333]"></div>
                 </div>
               </div>
               <div className="rounded-2xl bg-[#1a1a1a] border border-white/10 p-6">
                 <div className="w-full h-24 bg-[#111] border border-white/5 rounded-lg shadow-sm"></div>
               </div>
               <div className="rounded-2xl bg-[#1a1a1a] border border-white/10 p-6">
                 <div className="w-full h-24 bg-[#111] border border-white/5 rounded-lg shadow-sm"></div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* CTA SECTION */}
      {/* ========================================= */}
      <section className="relative z-10 w-full px-6 lg:px-8 py-24 bg-[#0a0a0a] text-white text-center border-t border-white/10">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight">Ready to sync up?</h2>
          <p className="text-xl text-slate-400">Join thousands of teams already using SYNQ to build better software, faster.</p>
          <button className="px-8 py-4 rounded-md bg-white text-black font-bold hover:bg-slate-200 transition-colors w-full sm:w-auto text-lg mt-4">
            Get Started for Free
          </button>
        </div>
      </section>

      {/* ========================================= */}
      {/* FOOTER  */}
      {/* ========================================= */}
      <footer className="relative z-10 w-full py-16 border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            
            <div className="col-span-2 md:col-span-2 flex flex-col gap-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-wider text-white">SYNQ</span>
              </Link>
              <p className="text-slate-400 text-sm max-w-xs">
                The modern platform for team collaboration and real-time communication.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <strong className="text-white font-semibold text-sm">Product</strong>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Download</Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Status</Link>
            </div>

            <div className="flex flex-col gap-3">
              <strong className="text-white font-semibold text-sm">Company</strong>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">About</Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Careers</Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Blog</Link>
            </div>

            <div className="flex flex-col gap-3">
              <strong className="text-white font-semibold text-sm">Legal</strong>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Security</Link>
            </div>

          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">© 2026 SYNQ. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="text-slate-500 hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="text-slate-500 hover:text-white transition-colors">GitHub</Link>
              <Link href="#" className="text-slate-500 hover:text-white transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}