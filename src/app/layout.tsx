import type { Metadata } from 'next';
import './globals.css'; // MUST BE IMPORTED for Tailwind to work

export const metadata: Metadata = {
  title: 'SYNQ | Next-Gen Collaboration',
  description: 'AI-powered workflows and real-time sync.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}