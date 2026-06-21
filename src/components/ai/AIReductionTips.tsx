"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { FootprintSummary, Action } from "@/types";

/** Client-side timeout for tips fetch (ms) */
const FETCH_TIMEOUT_MS = 15_000;

interface AIReductionTipsProps {
  summary: FootprintSummary;
  topCategory: string;
  existingActions?: Action[];
}

/**
 * Displays AI-generated reduction tips for the user's highest-emission category.
 * Falls back to a simple message when Gemini is unavailable.
 */
export default function AIReductionTips({
  summary,
  topCategory,
  existingActions = [],
}: AIReductionTipsProps) {
  const [tips, setTips] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fromAI, setFromAI] = useState(false);
  const lastFetchedCategory = useRef<string | null>(null);

  const fetchTips = useCallback(
    async (s: FootprintSummary, category: string, actions: Action[]) => {
      // Skip if already fetched for this category
      if (lastFetchedCategory.current === category) return;

      setLoading(true);
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

      try {
        const res = await fetch("/api/ai/tips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: s,
            topCategory: category,
            existingActions: actions,
          }),
          signal: abortController.signal,
        });
        const data = await res.json();

        if (data.text) {
          setTips(data.text);
          setFromAI(true);
        } else {
          // Use local fallback message
          setTips(getLocalTips(category));
          setFromAI(false);
        }
        lastFetchedCategory.current = category;
      } catch {
        setTips(getLocalTips(category));
        setFromAI(false);
        lastFetchedCategory.current = category;
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (topCategory && summary.totalKgCO2e > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTips(summary, topCategory, existingActions);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topCategory, fetchTips]);

  if (!topCategory) return null;

  const categoryLabel = summary.categories.find((c) => c.category === topCategory)?.label ?? topCategory;

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-stone-900 dark:border-blue-800/30">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-sm">
          💡
        </div>
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Reduce your {categoryLabel}
        </h2>
        <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          {fromAI ? "Gemini" : "Local"}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-full" />
        </div>
      ) : (
        <div className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-line">
          {tips}
        </div>
      )}

      <p className="mt-3 text-xs text-stone-400">
        {fromAI
          ? "AI-generated tips · personalized to your profile · may not cover all options"
          : "Based on published research and best practices"}
      </p>
    </Card>
  );
}

/** Deterministic fallback tips by category */
function getLocalTips(category: string): string {
  const tips: Record<string, string> = {
    home_energy:
      "1. Switch to a 100% renewable electricity tariff — takes 10 minutes online and can cut electricity emissions by up to 80%.\n\n2. Turn your thermostat down by 1°C — saves ~10% on heating and about 200 kg CO₂e/year.\n\n3. Replace remaining incandescent bulbs with LEDs — they use 75% less energy and last 20× longer.",
    transportation:
      "1. Replace short car trips (under 5 km) with cycling or walking — these make up ~25% of all car journeys.\n\n2. Consider switching to a hybrid or electric vehicle — can cut driving emissions by 40–80%.\n\n3. For trips under 700 km, choose train over flying — produces ~80% fewer emissions.",
    food:
      "1. Try 2–3 meat-free dinners per week — swapping beef for beans saves ~6 kg CO₂e per meal.\n\n2. Reduce food waste by planning meals and freezing leftovers — household food waste is ~8% of global emissions.\n\n3. Buy more local and seasonal produce — reduces transport emissions by up to 10%.",
    waste:
      "1. Sort and recycle all eligible materials — diverts waste from landfill where it generates methane.\n\n2. Start composting food scraps — eliminates the potent methane emissions from food in landfill.\n\n3. Choose products with minimal packaging and buy in bulk where possible.",
    purchases:
      "1. Adopt a 'cost-per-wear' mindset for clothing — repair, swap, or buy second-hand instead of new.\n\n2. Keep electronics 2 years longer before replacing — extends their useful life and halves manufacturing impact.\n\n3. Before any purchase, ask: can I borrow, rent, or repair instead?",
  };
  return tips[category] ?? "Focus on your highest-emission category for the biggest impact. Small consistent changes add up over time.";
}
