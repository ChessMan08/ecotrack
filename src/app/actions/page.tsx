"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getActions, addAction } from "@/lib/firebase";
import { generateRecommendations } from "@/lib/recommendations";

import ActionCard from "@/components/actions/ActionCard";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Action } from "@/types";

/** Maximum time (ms) to wait for data before forcing render */
const LOAD_TIMEOUT_MS = 15_000;

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All actions" },
  { value: "suggested", label: "Suggested" },
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
  { value: "home_energy", label: "Home Energy" },
  { value: "transportation", label: "Transport" },
  { value: "food", label: "Food" },
  { value: "waste", label: "Waste" },
  { value: "purchases", label: "Purchases" },
];

export default function ActionsPage() {
  const { user, profile, summary } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!user || !profile || !summary) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setDataError(null);

    // Safety timeout
    const timeout = setTimeout(() => {
      setLoading(false);
      setDataError("Loading took too long. Showing local suggestions.");
    }, LOAD_TIMEOUT_MS);

    try {
      // Firestore fetch — may fail for new users
      try {
        const saved = await getActions(user.uid);
        if (saved.length === 0) {
          // Generate and show initial suggestions locally (don't write to Firestore yet)
          const suggested = generateRecommendations(profile.lifestyle, summary, user.uid, 8);
          const withStatus = suggested.map((a) => ({ ...a, status: "suggested" as const }));
          setActions(withStatus);
        } else {
          setActions(saved as Action[]);
        }
      } catch (firestoreErr) {
        console.error("Failed to fetch actions:", firestoreErr);
        // Fall back to locally-generated suggestions
        const suggested = generateRecommendations(profile.lifestyle, summary, user.uid, 8);
        const withStatus = suggested.map((a) => ({ ...a, status: "suggested" as const }));
        setActions(withStatus);
        setDataError("Couldn't load saved actions. Showing personalized suggestions.");
      }
    } catch (err) {
      console.error("Failed to load actions:", err);
      setDataError("Something went wrong. Please try refreshing.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [user, profile, summary]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const regenerateSuggestions = useCallback(async () => {
    if (!user || !profile || !summary) return;
    setGenerating(true);
    try {
      const suggested = generateRecommendations(profile.lifestyle, summary, user.uid, 8);
      for (const action of suggested) {
        await addAction(user.uid, { ...action, status: "suggested" });
      }
      await load();
    } finally {
      setGenerating(false);
    }
  }, [user, profile, summary, load]);

  const filteredActions = useMemo(
    () =>
      actions.filter((a) => {
        if (filter === "all") return a.status !== "dismissed";
        if (["suggested", "planned", "done"].includes(filter)) return a.status === filter;
        return a.category === filter && a.status !== "dismissed";
      }),
    [actions, filter],
  );

  const doneCount = useMemo(() => actions.filter((a) => a.status === "done").length, [actions]);
  const plannedCount = useMemo(() => actions.filter((a) => a.status === "planned").length, [actions]);
  const totalSavings = useMemo(
    () => actions.filter((a) => a.status === "done").reduce((sum, a) => sum + a.estimatedKgCO2eSaved, 0),
    [actions],
  );

  return (
    <div className="page-container animate-fade-in">
      {/* Error banner */}
      {dataError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          ⚠️ {dataError}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">Action Plan</h1>
          <p className="section-subtitle">
            Personalised reduction steps based on your footprint. Mark them done as you go.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={regenerateSuggestions}
          loading={generating}
        >
          Refresh suggestions
        </Button>
      </div>

      {/* Stats */}
      {!loading && doneCount > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{doneCount}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Actions completed</p>
          </div>
          <div className="rounded-2xl border border-forest-200 bg-forest-50 p-4 dark:border-forest-800 dark:bg-forest-950/30">
            <p className="text-2xl font-bold text-forest-700 dark:text-forest-400">
              {totalSavings >= 1000
                ? `${(totalSavings / 1000).toFixed(1)}t`
                : `${totalSavings.toFixed(0)} kg`}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">CO₂e saved/yr (estimated)</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
            <p className="text-2xl font-bold text-stone-700 dark:text-stone-300">
              {plannedCount}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Actions planned</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === opt.value
                ? "bg-forest-600 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Action cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
              <Skeleton className="mb-3 h-5 w-2/3" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-700">
          <p className="text-3xl mb-3">🎯</p>
          <p className="font-medium text-stone-700 dark:text-stone-300">No actions here yet</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {filter === "done"
              ? "Complete some actions to see them here."
              : "Try a different filter or refresh suggestions."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onUpdate={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
