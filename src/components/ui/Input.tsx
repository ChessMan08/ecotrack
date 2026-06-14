"use client";

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
  className?: string;
}

export function Label({ htmlFor, children, required, hint, className }: LabelProps) {
  return (
    <div className={cn("mb-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-stone-700 dark:text-stone-300"
      >
        {children}
        {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, suffix, className, id, required, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && <Label htmlFor={inputId} required={required} hint={hint}>{label}</Label>}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-0",
              "dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500",
              error
                ? "border-red-400 focus:ring-red-400"
                : "border-stone-200 hover:border-stone-300 dark:hover:border-stone-600",
              icon && "pl-10",
              suffix && "pr-12",
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {suffix && (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <span className="text-sm text-stone-400">{suffix}</span>
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, className, id, required, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && <Label htmlFor={selectId} required={required} hint={hint}>{label}</Label>}
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={cn(
            "w-full appearance-none rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500",
            "dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100",
            error ? "border-red-400" : "border-stone-200 hover:border-stone-300",
            className,
          )}
          aria-invalid={!!error}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  hint,
  onChange,
  formatValue,
}: SliderProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label htmlFor={id} hint={hint}>{label}</Label>
        <span className="text-sm font-semibold text-forest-700 dark:text-forest-400">
          {formatValue ? formatValue(value) : value}
          {unit && ` ${unit}`}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-forest-600 dark:bg-stone-700"
      />
      <div className="mt-1 flex justify-between text-xs text-stone-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

interface RadioGroupProps<T extends string | number> {
  label?: string;
  hint?: string;
  value: T;
  options: { value: T; label: string; description?: string }[];
  onChange: (v: T) => void;
  cols?: 1 | 2 | 3 | 4;
}

export function RadioGroup<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
  cols = 2,
}: RadioGroupProps<T>) {
  const colsClass = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[cols];

  return (
    <fieldset>
      {label && (
        <legend className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
          {hint && <span className="ml-2 text-xs text-stone-500">{hint}</span>}
        </legend>
      )}
      <div className={`grid gap-2 ${colsClass}`}>
        {options.map((o) => (
          <label
            key={String(o.value)}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
              value === o.value
                ? "border-forest-500 bg-forest-50 dark:bg-forest-950/40"
                : "border-stone-200 hover:border-stone-300 dark:border-stone-700",
            )}
          >
            <input
              type="radio"
              name={label}
              value={String(o.value)}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="mt-0.5 h-4 w-4 accent-forest-600"
            />
            <div>
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                {o.label}
              </span>
              {o.description && (
                <p className="text-xs text-stone-500 dark:text-stone-400">{o.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
