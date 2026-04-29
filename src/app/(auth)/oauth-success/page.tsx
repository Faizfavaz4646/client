'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/lib/services/auth.service';

function OAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // 1. Save token to store immediately
      setAccessToken(token);
      document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;

      // 2. Fetch the user profile using the new token
      AuthService.getProfile()
        .then((data) => {
          const user = data.user; // Assuming backend returns { user: {...} }
          setUser(user);

          // 🚦 SMART ROUTING LOGIC
          const isFounder = user.organizations?.some((org: any) => org.orgId === user.id && org.role === 'admin');

          if (user.workspaces && user.workspaces.length > 0) {
            router.push(`/workspace/${user.workspaces[0].workspaceId}`);
          } else if (isFounder) {
            router.push('/workspace/setup');
          } else {
            router.push('/workspace/join');
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

  return null;
}

export default function OAuthSuccessPage() {
  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B66FF] mx-auto"></div>
        <p className="mt-4 text-slate-400 font-medium tracking-wide">SYNCING YOUR ACCOUNT...</p>
      </div>
      <Suspense fallback={null}>
        <OAuthContent />
      </Suspense>
    </div>
  );
}