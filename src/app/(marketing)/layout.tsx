import React from 'react';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We apply the dark background here too, just in case
    <div className="min-h-screen bg-[#0A0710] text-white">
      {/* You will eventually add your Navbar here */}
      {children}
      {/* You will eventually add your Footer here */}
    </div>
  );
}