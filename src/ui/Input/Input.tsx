"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends Pick<
    InputHTMLAttributes<HTMLInputElement>,
    | "type"
    | "name"
    | "value"
    | "defaultValue"
    | "placeholder"
    | "disabled"
    | "readOnly"
    | "required"
    | "onChange"
    | "onBlur"
    | "onFocus"
    | "onKeyDown"
    | "autoFocus"
    | "autoComplete"
    | "id"
    | "className"
    | "aria-label"
    | "aria-invalid"
  > {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = "text", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm",
        "placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500",
        invalid && "border-red-500 focus-visible:ring-red-400",
        className,
      )}
      {...rest}
    />
  );
});
