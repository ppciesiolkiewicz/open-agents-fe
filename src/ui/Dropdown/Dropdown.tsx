"use client";

import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
}: DropdownProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={4}
          className={cn(
            "z-50 min-w-40 rounded-md border border-zinc-200 bg-white p-1 text-sm shadow-md outline-none",
            "dark:border-zinc-800 dark:bg-zinc-950",
            className,
          )}
        >
          {children}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps>(
  function DropdownItem({ children, onSelect, disabled, className }, ref) {
    return (
      <RadixMenu.Item
        ref={ref}
        disabled={disabled}
        onSelect={onSelect}
        className={cn(
          "flex cursor-pointer select-none items-center rounded px-2 py-1.5 outline-none",
          "data-[highlighted]:bg-zinc-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          "dark:data-[highlighted]:bg-zinc-800",
          className,
        )}
      >
        {children}
      </RadixMenu.Item>
    );
  },
);
