"use client";

import ProgressBar from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/Badge";
import { formatKgCO2e } from "@/lib/calculator";
import type { Goal } from "@/types";

interface GoalProgressCardProps {
  goal: Goal;
  compact?: boolean;
}

export default function GoalProgressCard({ goal, compact = false }: GoalProgressCardProps) {
  const progress = Math.min(
    ((goal.baselineKgCO2e - goal.currentKgCO2e) /
      (goal.baselineKgCO2e - goal.targetKgCO2e)) *
      100,
    100,
  );

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
            {goal.title}
          </span>
          <span className="ml-2 shrink-0 text-xs text-stone-500 dark:text-stone-400">
            {Math.max(progress, 0).toFixed(0)}%
          </span>
        </div>
        <ProgressBar
          value={Math.max(progress, 0)}
          size="sm"
          color="#3d8539"
          animate
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">{goal.title}</h3>
        <StatusBadge status={goal.status} />
      </div>

      {goal.description && (
        <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">{goal.description}</p>
      )}

      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-stone-50 p-2 dark:bg-stone-800">
          <p className="text-xs text-stone-400">Baseline</p>
          <p className="mt-0.5 text-sm font-bold text-stone-700 dark:text-stone-300">
            {formatKgCO2e(goal.baselineKgCO2e)}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 p-2 dark:bg-stone-800">
          <p className="text-xs text-stone-400">Current</p>
          <p className="mt-0.5 text-sm font-bold text-forest-700 dark:text-forest-400">
            {formatKgCO2e(goal.currentKgCO2e)}
          </p>
        </div>
        <div className="rounded-xl bg-forest-50 p-2 dark:bg-forest-950/40">
          <p className="text-xs text-stone-400">Target</p>
          <p className="mt-0.5 text-sm font-bold text-forest-800 dark:text-forest-300">
            {formatKgCO2e(goal.targetKgCO2e)}
          </p>
        </div>
      </div>

      <ProgressBar
        value={Math.max(progress, 0)}
        label={`Progress: ${Math.max(progress, 0).toFixed(0)}%`}
        showLabel
        size="md"
        color="#3d8539"
      />

      <p className="mt-2 text-xs text-stone-400">
        Period: {goal.period} · Started {new Date(goal.startDate).toLocaleDateString()}
      </p>
    </div>
  );
}
