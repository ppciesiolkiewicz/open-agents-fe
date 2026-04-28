"use client";

import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea({ children, className, viewportClassName }, ref) {
    return (
      <RadixScrollArea.Root
        className={cn("relative overflow-hidden", className)}
      >
        <RadixScrollArea.Viewport
          ref={ref}
          className={cn("size-full", viewportClassName)}
        >
          {children}
        </RadixScrollArea.Viewport>
        <RadixScrollArea.Scrollbar
          orientation="vertical"
          className="flex w-2 touch-none select-none p-0.5 transition-colors"
        >
          <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </RadixScrollArea.Scrollbar>
      </RadixScrollArea.Root>
    );
  },
);
