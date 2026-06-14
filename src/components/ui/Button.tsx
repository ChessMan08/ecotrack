"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variants = {
      primary:
        "bg-forest-600 text-white hover:bg-forest-700 active:bg-forest-800 shadow-sm",
      secondary:
        "bg-forest-50 text-forest-800 hover:bg-forest-100 active:bg-forest-200 dark:bg-forest-900/40 dark:text-forest-200 dark:hover:bg-forest-900/60",
      ghost:
        "text-stone-600 hover:bg-stone-100 active:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
      outline:
        "border border-stone-200 text-stone-700 hover:bg-stone-50 active:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5 min-h-[32px]",
      md: "text-sm px-4 py-2 min-h-[40px]",
      lg: "text-base px-6 py-3 min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span>Loading…</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && <span aria-hidden="true">{icon}</span>}
            {children}
            {icon && iconPosition === "right" && <span aria-hidden="true">{icon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
