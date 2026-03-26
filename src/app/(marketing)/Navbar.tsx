'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
      <header className="w-full max-w-5xl px-6 py-3 flex justify-between items-center bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="font-extrabold text-xl tracking-wider text-white">
            SYNQ
          </span>
        </Link>

        {/* NAV (Desktop) */}
        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-400">
          <Link href="/download" className="hover:text-white transition-colors">Download</Link>
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/support" className="hover:text-white transition-colors">Support</Link>
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          <Link 
            href="/login"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="bg-white text-black px-5 py-2 rounded-full font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>
    </div>
  );
}