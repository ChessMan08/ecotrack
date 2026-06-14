"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "🌿", label: "Dashboard" },
  { href: "/calculator", icon: "🧮", label: "Calculator" },
  { href: "/actions", icon: "⚡", label: "Actions" },
  { href: "/goals", icon: "🎯", label: "Goals" },
  { href: "/education", icon: "📚", label: "Learn" },
  { href: "/profile", icon: "👤", label: "Profile" },
];

export default function AppNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutUser();
    window.location.href = "/";
  };

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-stone-200 bg-white px-3 py-6 dark:border-stone-800 dark:bg-stone-950 lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={pathname?.startsWith(item.href)} />
          ))}
        </nav>
        <UserChip profile={profile} onSignOut={handleSignOut} />
      </aside>

      {/* Top bar — mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 lg:hidden">
        <Logo compact />
        <button
          className="rounded-xl p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            {menuOpen ? (
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <nav
            className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-stone-200 bg-white px-3 py-6 shadow-xl dark:border-stone-800 dark:bg-stone-950"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile navigation"
          >
            <Logo />
            <div className="mt-8 flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  active={pathname?.startsWith(item.href)}
                  onClick={() => setMenuOpen(false)}
                />
              ))}
            </div>
            <UserChip profile={profile} onSignOut={handleSignOut} />
          </nav>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 lg:hidden">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors",
              pathname?.startsWith(item.href)
                ? "text-forest-700 dark:text-forest-400"
                : "text-stone-500 dark:text-stone-400",
            )}
            aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
          >
            <span className="text-lg" aria-hidden="true">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 px-2 text-forest-800 dark:text-forest-300"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
          <path d="M12 3C7 3 3 7.9 3 12s3 9 9 9 9-3.5 9-8-3-9-9-9z" />
          <path d="M12 8v8M9 11l3-3 3 3" />
        </svg>
      </div>
      {!compact && (
        <span className="text-sm font-bold tracking-tight">Ecotrack</span>
      )}
    </Link>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-forest-50 text-forest-800 dark:bg-forest-950/60 dark:text-forest-300"
          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="text-base" aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}

function UserChip({
  profile,
  onSignOut,
}: {
  profile: { displayName?: string; email?: string } | null;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-700">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-sm font-bold text-forest-700 dark:bg-forest-900/40 dark:text-forest-300">
        {profile?.displayName?.[0]?.toUpperCase() ?? "U"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-stone-800 dark:text-stone-200">
          {profile?.displayName ?? "User"}
        </p>
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">
          {profile?.email}
        </p>
      </div>
      <button
        onClick={onSignOut}
        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
        aria-label="Sign out"
        title="Sign out"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
