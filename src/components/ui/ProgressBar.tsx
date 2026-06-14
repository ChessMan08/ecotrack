"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  color = "#3d8539",
  size = "md",
  showLabel = false,
  animate = true,
  className,
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1.5 flex justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>{label}</span>
          {showLabel && <span className="font-medium">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800",
          heights[size],
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className={cn("h-full rounded-full", animate && "transition-all duration-700 ease-out")}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface CategoryBarProps {
  label: string;
  icon?: string;
  value: number;
  total: number;
  color: string;
}

export function CategoryBar({ label, icon, value, total, color }: CategoryBarProps) {
  const pct = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span aria-hidden="true">{icon}</span>}
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {value.toFixed(0)} kg
          </span>
          <span
            className="w-10 text-right text-xs font-semibold"
            style={{ color }}
          >
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
