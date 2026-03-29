"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import { getStoredToken, storeToken, removeToken } from "@/lib/auth";
import type { AuthResponse, AuthState, User } from "@/types/auth";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  setAuth: (user: User, token: string) => {
    storeToken(token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    removeToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("cloneweebs_user");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// Persist user to localStorage for page refreshes
function persistUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("cloneweebs_user", JSON.stringify(user));
  }
}

export function getPersistedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cloneweebs_user");
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiClient.post<AuthResponse>("/auth/login", data),
    onSuccess: (response) => {
      setAuth(response.user, response.access_token);
      persistUser(response.user);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      apiClient.post<AuthResponse>("/auth/register", data),
    onSuccess: (response) => {
      setAuth(response.user, response.access_token);
      persistUser(response.user);
    },
  });
}

export function useCurrentUser() {
  const { token, setAuth } = useAuthStore();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const user = await apiClient.get<User>("/auth/me");
      if (token) {
        setAuth(user, token);
        persistUser(user);
      }
      return user;
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };
}
