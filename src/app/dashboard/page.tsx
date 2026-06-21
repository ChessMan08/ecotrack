"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  calculateFullFootprint,
  buildFootprintSummary,
  formatKgCO2e,
  getEmissionRating,
} from "@/lib/calculator";
import { generateRecommendations } from "@/lib/recommendations";
import { BENCHMARKS } from "@/lib/emission-factors";
import { getActions, getGoals } from "@/lib/firebase";
import { CategoryBar } from "@/components/ui/ProgressBar";
import Card, { StatCard } from "@/components/ui/Card";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import FootprintChart from "@/components/charts/FootprintChart";
import AIInsightCard from "@/components/ai/AIInsightCard";
import AIReductionTips from "@/components/ai/AIReductionTips";
import ActionCard from "@/components/actions/ActionCard";
import GoalProgressCard from "@/components/goals/GoalProgressCard";
import Link from "next/link";
import type { FootprintSummary, Action, Goal } from "@/types";

/** Maximum time (ms) to wait for data before forcing render */
const LOAD_TIMEOUT_MS = 15_000;

export default function DashboardPage() {
  const { user, profile, error: authError } = useAuth();
  const [summary, setSummary] = useState<FootprintSummary | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setDataError(null);

    // Safety timeout — force render even if Firestore is slow
    const timeout = setTimeout(() => {
      setLoading(false);
      setDataError("Data is taking longer than expected. Showing what we have.");
    }, LOAD_TIMEOUT_MS);

    try {
      // Footprint calculation is synchronous and fast — always succeeds
      const result = calculateFullFootprint(profile.lifestyle);
      const s = buildFootprintSummary(result);
      setSummary(s);

      // Firestore fetches may fail for new users or on slow networks
      try {
        const [fetchedActions, fetchedGoals] = await Promise.all([
          getActions(user.uid),
          getGoals(user.uid),
        ]);
        setActions(fetchedActions as Action[]);
        setGoals(fetchedGoals as Goal[]);
      } catch (firestoreErr) {
        console.error("Failed to fetch Firestore data:", firestoreErr);
        setDataError("Some data couldn't be loaded. Core footprint calculations are still accurate.");
        // Keep empty arrays — pages render with empty state
      }
    } catch (err) {
      console.error("Dashboard calculation error:", err);
      setDataError("Failed to calculate footprint. Please try refreshing.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Early return: still waiting for auth to resolve
  if (loading && !summary) {
    return (
      <div className="page-container">
        <DashboardSkeleton />
      </div>
    );
  }

  // Auth resolved but no profile — show setup prompt
  if (!profile) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Welcome to Ecotrack
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-md">
            Complete your profile to see your personalized carbon footprint dashboard.
          </p>
          <Link href="/profile">
            <Button>Set up your profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Compute summary from profile if Firestore load failed before calculation
  // Compute summary from profile if Firestore load failed before calculation
  const safeSummary = summary ?? buildFootprintSummary(calculateFullFootprint(profile.lifestyle));
  const rating = getEmissionRating(safeSummary.totalKgCO2e);
  const sortedCategories = [...safeSummary.categories].sort((a, b) => b.kgCO2e - a.kgCO2e);
  const topCategory = sortedCategories[0] ?? null;
  const activeGoals = goals.filter((g) => g.status === "active").slice(0, 2);
  const topActions = actions.filter((a) => a.status !== "dismissed").slice(0, 3);

  // If no saved actions, generate local suggestions
  const suggestedActions =
    topActions.length > 0
      ? topActions
      : generateRecommendations(profile.lifestyle, safeSummary, user?.uid ?? "", 3).map((a) => ({
          ...a,
          status: "suggested" as const,
        }));

  const vs1pt5Target = safeSummary.totalKgCO2e - BENCHMARKS.targetKgCO2ePerYear;

  return (
    <div className="page-container animate-fade-in">
      {/* Error banner */}
      {(dataError || authError) && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          ⚠️ {dataError || authError}
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Good to see you, {profile.displayName?.split(" ")[0]} 👋
          </p>
          <h1 className="section-title mt-0.5">Your Carbon Dashboard</h1>
        </div>
        <Link href="/calculator">
          <Button variant="secondary" size="sm">
            Update footprint
          </Button>
        </Link>
      </div>

      {/* ── Top stat cards ── */}
      <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="col-span-2 bg-gradient-to-br from-forest-600 to-forest-700 text-white border-0">
          <p className="text-sm text-forest-200">Annual footprint</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">
            {safeSummary.totalKgCO2e >= 1000
              ? `${(safeSummary.totalKgCO2e / 1000).toFixed(1)}t`
              : `${safeSummary.totalKgCO2e.toFixed(0)} kg`}
          </p>
          <p className="mt-1 text-sm text-forest-200">CO₂e per year</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: rating.color }}
            />
            {rating.label} — {rating.description}
          </div>
        </Card>

        <StatCard
          label="vs Global average"
          value={
            safeSummary.vsGlobalAverage > 0
              ? `+${safeSummary.vsGlobalAverage.toFixed(0)}%`
              : `${safeSummary.vsGlobalAverage.toFixed(0)}%`
          }
          icon="🌍"
          color={safeSummary.vsGlobalAverage > 0 ? "#ef4444" : "#22c55e"}
        />

        <StatCard
          label="To reach 1.5°C target"
          value={
            vs1pt5Target > 0
              ? `−${formatKgCO2e(vs1pt5Target)}`
              : "✓ On track"
          }
          icon="🎯"
          color={vs1pt5Target > 0 ? "#f97316" : "#22c55e"}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left column — chart + breakdown */}
        <div className="lg:col-span-3 space-y-5">
          {/* Trend chart */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">
                Footprint trend
              </h2>
              <span className="text-xs text-stone-400">Based on current profile</span>
            </div>
            <FootprintChart summary={safeSummary} />
          </Card>

          {/* Category breakdown */}
          <Card>
            <h2 className="mb-5 font-semibold text-stone-900 dark:text-stone-100">
              Breakdown by category
            </h2>
            <div className="space-y-4">
              {sortedCategories.map((cat) => (
                <CategoryBar
                  key={cat.category}
                  label={cat.label}
                  icon={cat.icon}
                  value={cat.kgCO2e}
                  total={safeSummary.totalKgCO2e}
                  color={cat.color}
                />
              ))}
            </div>
            {topCategory && (
              <div className="mt-4 rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Biggest category: <strong className="text-stone-700 dark:text-stone-300">{topCategory.label}</strong> at{" "}
                  {topCategory.percentage.toFixed(0)}% of your total.
                </p>
              </div>
            )}
          </Card>

          {/* Comparison */}
          <Card>
            <h2 className="mb-4 font-semibold text-stone-900 dark:text-stone-100">
              How you compare
            </h2>
            <div className="space-y-3">
              {[
                { label: "You", value: safeSummary.totalKgCO2e, color: "#3d8539" },
                { label: "Global avg", value: BENCHMARKS.globalAvgKgCO2ePerYear, color: "#94a3b8" },
                { label: "US avg", value: BENCHMARKS.usAvgKgCO2ePerYear, color: "#94a3b8" },
                { label: "1.5°C target", value: BENCHMARKS.targetKgCO2ePerYear, color: "#22c55e" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-stone-500 dark:text-stone-400">
                    {item.label}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-stone-100 h-3 dark:bg-stone-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((item.value / BENCHMARKS.usAvgKgCO2ePerYear) * 100, 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-medium text-stone-600 dark:text-stone-400">
                    {formatKgCO2e(item.value)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-400">
              Sources: World Bank 2022, EPA 2023, University of Michigan 2023
            </p>
          </Card>
        </div>

        {/* Right column — AI, actions, goals */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Insight */}
          <AIInsightCard summary={safeSummary} profile={profile.lifestyle} />

          {/* AI Reduction Tips */}
          {topCategory && (
            <AIReductionTips
              summary={safeSummary}
              topCategory={topCategory.category}
              existingActions={actions}
            />
          )}

          {/* Goals */}
          {activeGoals.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">Active goals</h2>
                <Link href="/goals" className="text-xs text-forest-700 hover:underline dark:text-forest-400">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {activeGoals.map((goal) => (
                  <GoalProgressCard key={goal.id} goal={goal} compact />
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">Top actions</h2>
              <Link href="/actions" className="text-xs text-forest-700 hover:underline dark:text-forest-400">
                See all
              </Link>
            </div>
            <div className="space-y-3">
              {suggestedActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action as Action}
                  compact
                  onUpdate={loadData}
                />
              ))}
            </div>
            {suggestedActions.length === 0 && (
              <p className="text-center text-sm text-stone-400 py-4">
                Complete your profile to get personalized suggestions.
              </p>
            )}
          </Card>

          {/* Goals prompt if none */}
          {activeGoals.length === 0 && (
            <Card className="border-dashed border-forest-200 bg-forest-50/50 dark:bg-forest-950/20 dark:border-forest-800">
              <div className="text-center py-2">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Set a reduction goal
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
                  Goals keep you accountable and track your progress over time.
                </p>
                <Link href="/goals">
                  <Button variant="secondary" size="sm">Set a goal</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
