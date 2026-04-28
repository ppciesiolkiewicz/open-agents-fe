import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "info" | "warning" | "success";
  className?: string;
}

const TONES = {
  neutral:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
