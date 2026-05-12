import React from 'react';
import dynamic from 'next/dynamic';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
const MarketingSections = dynamic(() => import('./MarketingSections'), { ssr: false });

export default function MarketingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-slate-50 font-sans bg-[#0a0a0a]">
      {/* Wrapping content in a relative wrapper to scroll over the fixed background */}
      <div className="relative z-10 w-full">
        <Navbar />

        {/* HERO SECTION (Now Server-Side & Fast) */}
        <HeroSection />

        {/* ANIMATED SECTIONS & BACKGROUND (Loaded as a separate chunk) */}
        <MarketingSections />
      </div>
    </main>
  );
}