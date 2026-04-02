import { create } from 'zustand';
// 1. Import the persist middleware
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IUserSafe } from '@/types/auth';

interface AuthState {
  user: IUserSafe | null;
  accessToken: string | null; // Added to store the captured token
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: IUserSafe | null) => void;
  setAccessToken: (token: string | null) => void; // Critical for Google Auth Success page
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// 2. Wrap your store configuration in persist()
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAccessToken: (accessToken) => set({
        accessToken,
        isAuthenticated: !!accessToken
      }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false
      }),
    }),
    {
      name: 'synq-auth-storage', // The name of the key in localStorage
      storage: createJSONStorage(() => localStorage),
      // 3. Only save the auth data, don't save the 'isLoading' state!
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);