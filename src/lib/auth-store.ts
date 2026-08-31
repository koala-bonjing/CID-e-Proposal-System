"use client";
import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== "undefined" ? (() => {
    try {
      const cookie = document.cookie.split("; ").find((c) => c.startsWith("dpmas_user="));
      return cookie ? JSON.parse(decodeURIComponent(cookie.split("=")[1])) : null;
    } catch { return null; }
  })() : null,

  login: (user) => {
    document.cookie = `dpmas_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60 * 24 * 7}`;
    set({ user });
  },

  logout: () => {
    document.cookie = "dpmas_user=; path=/; max-age=0";
    set({ user: null });
  },
}));
