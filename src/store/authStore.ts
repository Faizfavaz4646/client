import { create } from 'zustand';

// Matches the backend's User safe response exactly
export interface IUserSafe {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string;
  status: string;
  organizations: Array<{ orgId: string; role: string; joinedAt: string }>;
  workspaces: Array<{ workspaceId: string; name: string; joinedAt: string }>;
}

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

export const useAuthStore = create<AuthState>((set) => ({
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
}));