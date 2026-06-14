"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
  as?: "div" | "article" | "section";
  style?: React.CSSProperties;
}

export default function Card({
  children,
  className,
  padding = "md",
  hover = false,
  onClick,
  as: Tag = "div",
  style,
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <Tag
      className={cn(
        "rounded-2xl border border-stone-200 bg-white dark:border-stone-700/50 dark:bg-stone-900",
        paddings[padding],
        hover && "cursor-pointer transition-shadow hover:shadow-card-hover",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      style={style}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-50 text-xl dark:bg-forest-950">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon?: string;
  color?: string;
  trend?: number;
  className?: string;
}

export function StatCard({ label, value, unit, icon, color, trend, className }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color }}
            >
              {value}
            </span>
            {unit && <span className="text-sm text-stone-500 dark:text-stone-400">{unit}</span>}
          </div>
          {trend !== undefined && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend < 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400",
              )}
            >
              {trend < 0 ? "↓" : "↑"} {Math.abs(trend).toFixed(1)}% vs last period
            </p>
          )}
        </div>
        {icon && (
          <span className="text-3xl" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
