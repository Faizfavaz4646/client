import { api } from "../api";

export const AuthService = {
  // 1. Google OAuth Trigger
  loginWithGoogle: () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    window.location.assign(`${backendUrl}/auth/google`);
  },

  // 2. Standard Login
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // 3. Register (User) - Requires inviteCode and role
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 4. Token Refresh
  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  // 5. Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // 6. Profile Management
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};