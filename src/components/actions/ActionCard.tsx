"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { DifficultyBadge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { updateAction, addAction } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatKgCO2e, getCategoryColor, getCategoryIcon } from "@/lib/calculator";
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
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(newStatus: Action["status"]) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const isLocal = !action.id || action.id.startsWith("local_");
      if (isLocal) {
        // Not yet persisted — save to Firestore first
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...actionData } = action;
        await addAction(user.uid, { ...actionData, status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : undefined });
      } else {
        // Already persisted — update in place
        try {
          await updateAction(user.uid, action.id, {
            status: newStatus,
            completedAt: newStatus === "done" ? new Date().toISOString() : null,
          });
        } catch {
          // Document may have been deleted — re-create it
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...actionData } = action;
          await addAction(user.uid, { ...actionData, status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : undefined });
        }
      }
      onUpdate?.();
    } catch (err) {
      console.error("Failed to update action:", err);
      setError("Update failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-stone-100 p-3 dark:border-stone-800">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: `${getCategoryColor(action.category)}20` }}
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
          style={{ backgroundColor: `${getCategoryColor(action.category)}20` }}
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
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

