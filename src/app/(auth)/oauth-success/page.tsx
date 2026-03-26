'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/lib/services/auth.service';

export default function OAuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // 1. Save token to store immediately
      setAccessToken(token);

      // 2. Fetch the user profile using the new token
      AuthService.getProfile()
        .then((data) => {
          const user = data.user; // Assuming backend returns { user: {...} }
          setUser(user);

          // 🚦 SMART ROUTING LOGIC
          if (user.organizations && user.organizations.length > 0) {
            // They belong to an org! Send them straight to their dashboard
            router.push(`/workspace/${user.organizations[0].orgId}`);
          } else {
            // Standalone user! Send them to the "Create Workspace" onboarding screen
            router.push('/workspace');
          }
        })
        .catch((err) => {
          console.error("Profile fetch failed:", err);
          router.push('/login?error=ProfileFetchFailed');
        });
    } else {
      router.push('/login?error=OAuthFailed');
    }
  }, [searchParams, router, setAccessToken, setUser]);

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B66FF] mx-auto"></div>
        <p className="mt-4 text-slate-400 font-medium tracking-wide">SYNCING YOUR ACCOUNT...</p>
      </div>
    </div>
  );
}