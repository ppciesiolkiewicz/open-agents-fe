"use client";

import type { ReactNode } from "react";
import { Button } from "@/ui/Button";
import { useUserBootstrap } from "../../hooks/useUserBootstrap";

export interface EnsureUserWalletProps {
  children: ReactNode;
}

export function EnsureUserWallet({ children }: EnsureUserWalletProps) {
  const { status, error, retry } = useUserBootstrap(true);

  return (
    <>
      {status === "error" && error && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <span>Wallet bootstrap failed: {error}</span>
          <Button size="sm" variant="secondary" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
