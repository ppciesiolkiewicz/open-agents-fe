"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-zinc-200 bg-white p-5 shadow-xl outline-none",
            "dark:border-zinc-800 dark:bg-zinc-950",
            "max-h-[90dvh] overflow-y-auto",
            className,
          )}
        >
          <div className="mb-4 flex flex-col gap-1">
            <RadixDialog.Title className="text-base font-semibold">
              {title}
            </RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "mt-5 flex items-center justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800",
        className,
      )}
    >
      {children}
    </div>
  );
}
