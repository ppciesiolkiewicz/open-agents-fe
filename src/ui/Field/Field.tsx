import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  error,
  helper,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : helper ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helper}</p>
      ) : null}
    </div>
  );
}
