"use client";

import { useSyncExternalStore } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { getToasts, subscribeToasts, dismissToast } from "./toast";

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  return (
    <RadixToast.Provider>
      {toasts.map((t) => (
        <RadixToast.Root
          key={t.id}
          open
          duration={t.duration}
          onOpenChange={(open) => {
            if (!open) dismissToast(t.id);
          }}
          className="flex items-center gap-3 rounded-lg bg-zinc-900 px-4 py-3 text-sm text-zinc-50 shadow-lg dark:bg-zinc-50 dark:text-zinc-900 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out"
        >
          <RadixToast.Description>{t.message}</RadixToast.Description>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 outline-none" />
    </RadixToast.Provider>
  );
}
