"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { FootprintSummary, LifestyleProfile } from "@/types";

interface AIInsightCardProps {
  summary: FootprintSummary;
  profile: LifestyleProfile;
}

export default function AIInsightCard({ summary, profile }: AIInsightCardProps) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchInsight() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/ai/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary, profile }),
        });
        const data = await res.json();
        setInsight(data.text || "");
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchInsight();
  }, [summary.totalKgCO2e]); // Only re-fetch when footprint changes

  return (
    <Card className="border-forest-100 bg-gradient-to-br from-forest-50 to-white dark:from-forest-950/30 dark:to-stone-900 dark:border-forest-800/30">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest-600 text-white text-sm">
          ✨
        </div>
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          AI Summary
        </h2>
        <span className="ml-auto rounded-full bg-forest-100 px-2 py-0.5 text-xs text-forest-700 dark:bg-forest-900/40 dark:text-forest-300">
          Gemini
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      ) : error ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          AI insights temporarily unavailable. Your footprint data is accurate.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {insight}
        </p>
      )}

      <p className="mt-3 text-xs text-stone-400">
        AI-generated summary · based on your profile data · may not be exact
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

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/ai/focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary, goals, recentActions: actions }),
        });
        const data = await res.json();
        setFocus(data.text || "");
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, []);

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
