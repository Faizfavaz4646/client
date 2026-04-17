import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔹 Request interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔹 Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Network error
    if (!error.response) {
      return Promise.reject({
        message: "Network error. Check your connection.",
        status: 500,
      });
    }

    //  Token expired
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        //  Update token
        useAuthStore.getState().setAccessToken(res.data.accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject({
          message: "Session expired. Please login again.",
          status: 401,
        });
      }
    }

    return Promise.reject({
      message: error.response.data?.message || "Something went wrong",
      status: error.response.status,
    });
  }
);

export default api;