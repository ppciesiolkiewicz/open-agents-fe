"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  asChild?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, interactive, asChild, onClick, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm",
        "dark:border-zinc-800 dark:bg-zinc-950",
        interactive &&
          "cursor-pointer transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
});

export interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold">{title}</div>
        {subtitle && (
          <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

export interface CardFieldProps {
  label: string;
  value: ReactNode;
}

export function CardField({ label, value }: CardFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </span>
    </div>
  );
}
