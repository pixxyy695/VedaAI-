"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AppHeader } from "./AppHeader";
import { AuthPanel } from "./AuthPanel";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { hydrate, isReady, user } = useAuthStore();

  useEffect(() => {
    if (!isReady) void hydrate();
  }, [hydrate, isReady]);

  if (!isReady) {
    return (
      <main className="detail-shell centered">
        <LoaderCircle className="spin" size={30} />
      </main>
    );
  }

  if (!user) return <AuthPanel />;

  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
