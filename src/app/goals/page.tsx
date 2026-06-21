"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getGoals, addGoal, updateGoal } from "@/lib/firebase";
import { formatKgCO2e } from "@/lib/calculator";

import GoalProgressCard from "@/components/goals/GoalProgressCard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Goal, EmissionCategory } from "@/types";

const CATEGORY_OPTIONS = [
  { value: "overall", label: "Overall footprint" },
  { value: "home_energy", label: "Home Energy" },
  { value: "transportation", label: "Transportation" },
  { value: "food", label: "Food & Diet" },
  { value: "waste", label: "Waste" },
  { value: "purchases", label: "Purchases" },
];

const PRESET_REDUCTIONS = [
  { label: "5% reduction", pct: 5 },
  { label: "10% reduction", pct: 10 },
  { label: "20% reduction", pct: 20 },
  { label: "Custom", pct: null },
];

export default function GoalsPage() {
  const { user, profile, summary } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("overall");
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [reductionPct, setReductionPct] = useState(10);
  const [customTarget, setCustomTarget] = useState("");

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getGoals(user.uid);
    setGoals(data as Goal[]);
    setLoading(false);
  }, [user]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadGoals(); }, [loadGoals]);

  function getCurrentKg(): number {
    if (!profile || !summary) return 0;
    if (category === "overall") return summary.totalKgCO2e;
    const cat = summary.categories.find((c) => c.category === category);
    return cat?.kgCO2e ?? summary.totalKgCO2e;
  }

  async function handleSaveGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const baseline = getCurrentKg();
    const target = customTarget
      ? Number(customTarget)
      : baseline * (1 - reductionPct / 100);

    const goal: Omit<Goal, "id"> = {
      uid: user.uid,
      title: title || `Reduce ${category.replace("_", " ")} by ${reductionPct}%`,
      description,
      category: category as EmissionCategory | "overall",
      targetKgCO2e: target,
      currentKgCO2e: baseline,
      baselineKgCO2e: baseline,
      period,
      startDate: new Date().toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
      progressPercent: 0,
    };

    await addGoal(user.uid, goal);
    await loadGoals();
    setShowForm(false);
    setTitle("");
    setDescription("");
    setSaving(false);
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">Goals</h1>
          <p className="section-subtitle">
            Set specific, measurable reduction targets and track your progress.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "＋ New goal"}
        </Button>
      </div>

      {/* Goal creation form */}
      {showForm && (
        <Card className="mb-6 border-forest-200 bg-forest-50/50 dark:border-forest-800/30 dark:bg-forest-950/20">
          <h2 className="mb-5 font-semibold text-stone-900 dark:text-stone-100">
            Create a new goal
          </h2>
          <form onSubmit={handleSaveGoal} className="space-y-4">
            <Input
              label="Goal title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Drive less this month"
              hint="Leave blank to auto-generate"
            />
            <Input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you do differently?"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORY_OPTIONS}
              />
              <Select
                label="Tracking period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as "weekly" | "monthly" | "yearly")}
                options={[
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                Reduction target
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESET_REDUCTIONS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      if (p.pct) setReductionPct(p.pct);
                      setCustomTarget(p.pct ? "" : "");
                    }}
                    className={`rounded-xl border p-2.5 text-sm font-medium transition-colors ${
                      (p.pct === reductionPct && !customTarget) || (p.pct === null && !!customTarget)
                        ? "border-forest-500 bg-forest-50 text-forest-800 dark:bg-forest-950/40"
                        : "border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 dark:bg-stone-900">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Current: <strong>{formatKgCO2e(getCurrentKg())}/yr</strong> →
                Target: <strong className="text-forest-700 dark:text-forest-400">
                  {formatKgCO2e(
                    customTarget ? Number(customTarget) : getCurrentKg() * (1 - reductionPct / 100)
                  )}/yr
                </strong>
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                Set this goal
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      ) : (
        <>
          {activeGoals.length === 0 && !showForm && (
            <Card className="border-dashed border-forest-200 bg-forest-50/30 dark:border-forest-800/30">
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <p className="font-medium text-stone-700 dark:text-stone-300">No goals yet</p>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400 mb-4">
                  Goals keep you accountable and make progress visible.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  Create your first goal
                </Button>
              </div>
            </Card>
          )}

          {activeGoals.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 font-semibold text-stone-900 dark:text-stone-100">
                Active goals ({activeGoals.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeGoals.map((goal) => (
                  <div key={goal.id}>
                    <GoalProgressCard goal={goal} />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={async () => {
                          await updateGoal(user!.uid, goal.id, { status: "completed" });
                          await loadGoals();
                        }}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Mark complete
                      </button>
                      <button
                        onClick={async () => {
                          await updateGoal(user!.uid, goal.id, { status: "paused" });
                          await loadGoals();
                        }}
                        className="text-xs text-stone-400 hover:underline"
                      >
                        Pause
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {completedGoals.length > 0 && (
            <section>
              <h2 className="mb-4 font-semibold text-stone-700 dark:text-stone-400">
                Completed goals 🎉
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 opacity-70">
                {completedGoals.map((goal) => (
                  <GoalProgressCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
