import { cn } from "@/lib/cn";

export interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}

const SIZES = {
  sm: "size-3 border-2",
  md: "size-4 border-2",
};

export function Spinner({
  size = "md",
  className,
  "aria-label": ariaLabel = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        SIZES[size],
        className,
      )}
    />
  );
}
