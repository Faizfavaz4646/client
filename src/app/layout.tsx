import type { Metadata } from 'next';
import './globals.css'; // MUST BE IMPORTED for Tailwind to work
import { Toaster } from 'sonner';

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
      <body>
        {children}
        <Toaster 
          theme="dark" 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(10, 10, 10, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
            },
            className: 'font-sans shadow-2xl rounded-xl',
          }}
        />
      </body>
    </html>
  );
}