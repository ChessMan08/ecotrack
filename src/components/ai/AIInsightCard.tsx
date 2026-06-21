"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { generateLocalSummary } from "@/lib/local-insights";
import type { FootprintSummary, LifestyleProfile } from "@/types";

/** Client-side timeout for AI fetch (ms) */
const FETCH_TIMEOUT_MS = 15_000;

interface AIInsightCardProps {
  summary: FootprintSummary;
  profile: LifestyleProfile;
}

export default function AIInsightCard({ summary, profile }: AIInsightCardProps) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fromAI, setFromAI] = useState(true);
  // Use a ref to track the footprint value that triggered the last successful fetch
  // This prevents re-fetching when the component re-renders with the same data
  const lastFetchedTotal = useRef<number | null>(null);

  const fetchInsight = useCallback(async (s: FootprintSummary, p: LifestyleProfile) => {
    // Skip if we already fetched for this exact total
    if (lastFetchedTotal.current === s.totalKgCO2e) return;

    setLoading(true);
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: s, profile: p }),
        signal: abortController.signal,
      });
      const data = await res.json();
      setInsight(data.text || "");
      setFromAI(data.fromAI !== false);
      lastFetchedTotal.current = s.totalKgCO2e;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // Timeout — use local fallback
        const localText = generateLocalSummary(s, p);
        setInsight(localText);
        setFromAI(false);
        lastFetchedTotal.current = s.totalKgCO2e;
      } else {
        // Network error — use local fallback
        const localText = generateLocalSummary(s, p);
        setInsight(localText);
        setFromAI(false);
        lastFetchedTotal.current = s.totalKgCO2e;
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  // Trigger fetch only when the actual footprint total changes
  useEffect(() => {
    if (summary.totalKgCO2e > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchInsight(summary, profile);
    } else {
      setInsight("Complete your profile to see a personalized footprint summary.");
      setFromAI(false);
      setLoading(false);
    }
    // We intentionally depend only on totalKgCO2e to avoid infinite re-fetch loops
    // caused by object reference changes. The full summary/profile objects are passed
    // via the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.totalKgCO2e, fetchInsight]);

  return (
    <Card className="border-forest-100 bg-gradient-to-br from-forest-50 to-white dark:from-forest-950/30 dark:to-stone-900 dark:border-forest-800/30">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest-600 text-white text-sm">
          ✨
        </div>
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {fromAI ? "AI Summary" : "Footprint Summary"}
        </h2>
        <span className="ml-auto rounded-full bg-forest-100 px-2 py-0.5 text-xs text-forest-700 dark:bg-forest-900/40 dark:text-forest-300">
          {fromAI ? "Gemini" : "Local"}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {insight}
        </p>
      )}

      <p className="mt-3 text-xs text-stone-400">
        {fromAI
          ? "AI-generated summary · based on your profile data · may not be exact"
          : "Based on your profile data · using published emission factors"}
      </p>
    </Card>
  );
}

// Weekly focus card variant
export function WeeklyFocusCard({
  summary,
  goals,
  actions,
}: {
  summary: FootprintSummary;
  goals: unknown[];
  actions: unknown[];
}) {
  const [focus, setFocus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const lastFetchedTotal = useRef<number | null>(null);

  useEffect(() => {
    // Skip if we already fetched for this exact total
    if (lastFetchedTotal.current === summary.totalKgCO2e) return;

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

    async function fetchFocus() {
      try {
        const res = await fetch("/api/ai/focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary, goals, recentActions: actions }),
          signal: abortController.signal,
        });
        const data = await res.json();
        setFocus(data.text || "");
        lastFetchedTotal.current = summary.totalKgCO2e;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        // Non-critical feature — silently use empty state
      } finally {
        clearTimeout(timeout);
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }
    fetchFocus();
    return () => {
      clearTimeout(timeout);
      abortController.abort();
    };
    // Depend on primitive totalKgCO2e to avoid infinite re-fetch from object ref changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.totalKgCO2e]);

  return (
    <Card className="bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-800/30">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">📅</span>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">This week&apos;s focus</h3>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Gemini
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">{focus}</p>
      )}
    </Card>
  );
}
