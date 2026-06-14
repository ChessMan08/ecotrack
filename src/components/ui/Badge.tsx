"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "green" | "yellow" | "orange" | "red" | "blue" | "purple" | "stone";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({ children, variant = "stone", size = "sm", className }: BadgeProps) {
  const variants = {
    green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    stone: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ level }: { level: "easy" | "medium" | "hard" }) {
  const map = {
    easy: { label: "Quick win", variant: "green" as const },
    medium: { label: "Moderate effort", variant: "yellow" as const },
    hard: { label: "Big investment", variant: "orange" as const },
  };
  return <Badge variant={map[level].variant}>{map[level].label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    suggested: { label: "Suggested", variant: "stone" },
    planned: { label: "Planned", variant: "blue" },
    done: { label: "Done ✓", variant: "green" },
    dismissed: { label: "Dismissed", variant: "stone" },
    active: { label: "Active", variant: "green" },
    completed: { label: "Completed", variant: "green" },
    paused: { label: "Paused", variant: "yellow" },
  };
  const m = map[status] ?? { label: status, variant: "stone" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
