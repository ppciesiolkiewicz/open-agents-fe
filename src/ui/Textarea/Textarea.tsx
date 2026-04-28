"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends Pick<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    | "name"
    | "value"
    | "defaultValue"
    | "placeholder"
    | "disabled"
    | "readOnly"
    | "required"
    | "rows"
    | "onChange"
    | "onBlur"
    | "onFocus"
    | "onKeyDown"
    | "autoFocus"
    | "id"
    | "className"
    | "aria-label"
  > {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm",
          "placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500",
          invalid && "border-red-500 focus-visible:ring-red-400",
          className,
        )}
        {...rest}
      />
    );
  },
);
