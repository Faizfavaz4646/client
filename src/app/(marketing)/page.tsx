import React from 'react';
import dynamic from 'next/dynamic';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import MarketingSections from './MarketingSections';

const DarkVeil = dynamic(() => import('./DarkVeil'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a0a]" /> 
});

export default function MarketingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-slate-50 font-sans bg-[#0a0a0a]">
      
      {/* ========================================= */}
      {/* GLOBAL UNIFIED BACKGROUND */}
      {/* ========================================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Wrapping content in a relative wrapper to scroll over the fixed background */}
      <div className="relative z-10 w-full">
        <Navbar />

        {/* ========================================= */}
        {/* HERO SECTION (Now Server-Side & Fast) */}
        {/* ========================================= */}
        <HeroSection />

        {/* ========================================= */}
        {/* ANIMATED SECTIONS (Loaded as a separate chunk) */}
        {/* ========================================= */}
        <MarketingSections />

      </div>
    </main>
  );
}