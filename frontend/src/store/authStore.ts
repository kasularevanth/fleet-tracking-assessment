import { create } from "zustand";
import { User } from "../services/authApi";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

// Initialize from localStorage
const getStoredAuth = () => {
  if (typeof window === "undefined")
    return { user: null, accessToken: null, refreshToken: null };
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken && !!user,
  };
};

const stored = getStoredAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: stored.user,
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,
  isAuthenticated: stored.isAuthenticated ?? false,
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },
  refreshAccessToken: async () => {
    const refreshToken = get().refreshToken;
    if (!refreshToken) {
      get().logout();
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        set({ accessToken: data.accessToken });
        localStorage.setItem("accessToken", data.accessToken);
      } else {
        get().logout();
      }
    } catch (error) {
      get().logout();
    }
  },
  logout: () => {
    const refreshToken = get().refreshToken;
    if (refreshToken) {
      // Revoke refresh token on backend
      fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
