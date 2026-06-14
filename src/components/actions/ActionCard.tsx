"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { DifficultyBadge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { updateAction, addAction } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatKgCO2e } from "@/lib/calculator";
import type { Action } from "@/types";

interface ActionCardProps {
  action: Action;
  compact?: boolean;
  onUpdate?: () => void;
}

export default function ActionCard({ action, compact = false, onUpdate }: ActionCardProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function updateStatus(status: Action["status"]) {
    if (!user) return;
    setBusy(true);
    try {
      if (action.id && !action.id.startsWith("local_")) {
        await updateAction(user.uid, action.id, {
          status,
          completedAt: status === "done" ? new Date().toISOString() : null,
        });
      } else {
        // Not yet saved — save it first
        await addAction(user.uid, { ...action, status, id: undefined });
      }
      onUpdate?.();
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-stone-100 p-3 dark:border-stone-800">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: `${getCategoryHex(action.category)}20` }}
          aria-hidden
        >
          {getCategoryIcon(action.category)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 leading-snug">
            {action.title}
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Saves ~{formatKgCO2e(action.estimatedKgCO2eSaved)}/yr
          </p>
        </div>
        {action.status === "done" ? (
          <span className="text-lg">✅</span>
        ) : (
          <button
            onClick={() => updateStatus("done")}
            disabled={busy}
            className="shrink-0 rounded-lg border border-stone-200 p-1.5 text-xs hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800"
            aria-label={`Mark "${action.title}" as done`}
          >
            ✓
          </button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={`transition-all ${
        action.status === "done" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: `${getCategoryHex(action.category)}20` }}
          aria-hidden
        >
          {getCategoryIcon(action.category)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {action.title}
            </h3>
            <StatusBadge status={action.status} />
          </div>
          <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">{action.description}</p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500 dark:text-stone-400">
            <span>⚡ Saves ~{formatKgCO2e(action.estimatedKgCO2eSaved)}/yr</span>
            <span>⏱ {action.timeToAdopt}</span>
            <DifficultyBadge level={action.difficultyLevel} />
          </div>

          {expanded && (
            <div className="mt-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Why it matters
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {action.whyItMatters}
              </p>
              {action.sourceLabel && (
                <p className="mt-2 text-xs text-stone-400">
                  Source: {action.sourceLabel}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {action.status !== "done" && (
              <Button
                size="sm"
                onClick={() => updateStatus("done")}
                loading={busy}
                icon="✓"
              >
                Mark done
              </Button>
            )}
            {action.status === "suggested" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateStatus("planned")}
                loading={busy}
              >
                Plan it
              </Button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            >
              {expanded ? "Less ↑" : "Why it matters ↓"}
            </button>
            {action.status !== "dismissed" && (
              <button
                onClick={() => updateStatus("dismissed")}
                className="ml-auto text-xs text-stone-400 hover:text-stone-600"
                aria-label="Dismiss this action"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    home_energy: "🏠",
    transportation: "🚗",
    food: "🥗",
    waste: "♻️",
    purchases: "🛍️",
  };
  return map[category] ?? "⚡";
}

function getCategoryHex(category: string): string {
  const map: Record<string, string> = {
    home_energy: "#f97316",
    transportation: "#3b82f6",
    food: "#22c55e",
    waste: "#a855f7",
    purchases: "#ec4899",
  };
  return map[category] ?? "#3d8539";
}
