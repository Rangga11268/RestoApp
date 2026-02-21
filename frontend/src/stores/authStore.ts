import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";
import { saveToken, clearToken, getStoredToken } from "@/lib/axios";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  restaurant_name: string;
  timezone?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      token: null,
      // Derive initial auth status from stored token — supports Remember Me
      isAuthenticated: !!getStoredToken(),
      isLoading: false,

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          const { token, user } = data.data;
          saveToken(token, rememberMe);
          set({ user, token, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/register", {
            ...payload,
            timezone: payload.timezone ?? "Asia/Jakarta",
          });
          const { token, user } = data.data;
          saveToken(token, true); // register always remembers
          set({ user, token, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // ignore network errors on logout
        }
        clearToken();
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data.data, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
          clearToken();
        } finally {
          set({ isLoading: false });
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
