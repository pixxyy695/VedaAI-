"use client";

import { create } from "zustand";
import type { AuthSession, User } from "@vedai/shared";
import { getMe, logout as requestLogout } from "@/lib/api";

const STORAGE_KEY = "vedai_session";

type AuthState = {
  user: User | null;
  token: string | null;
  isReady: boolean;
  setSession: (session: AuthSession) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

function readStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function writeStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isReady: false,
  setSession: (session) => {
    writeStoredToken(session.token);
    set({ user: session.user, token: session.token, isReady: true });
  },
  hydrate: async () => {
    const token = readStoredToken();
    if (!token) {
      set({ user: null, token: null, isReady: true });
      return;
    }

    try {
      const { user } = await getMe(token);
      set({ user, token, isReady: true });
    } catch {
      writeStoredToken(null);
      set({ user: null, token: null, isReady: true });
    }
  },
  logout: async () => {
    const token = get().token;
    writeStoredToken(null);
    set({ user: null, token: null, isReady: true });
    await requestLogout(token);
  }
}));
