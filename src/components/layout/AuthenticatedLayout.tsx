"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppNav from "@/components/layout/AppNav";
import AIChatWidget from "@/components/ai/AIChatWidget";

/**
 * Shared layout for all authenticated pages.
 * Redirects unauthenticated users to /auth and shows a loading spinner during auth check.
 */
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex items-center gap-3 text-stone-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest-500 border-t-transparent" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950">
      <AppNav />
      <main className="flex-1 pb-20 lg:pb-0" id="main-content">
        {children}
      </main>
      <AIChatWidget />
    </div>
  );
}
