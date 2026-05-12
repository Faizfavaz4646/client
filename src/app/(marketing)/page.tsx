import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import MarketingSections from './MarketingSections';

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