"use client";

import { useUserWallet } from "@/hooks/useUserWallet";
import { useOnboarding } from "@/components/OnboardingGate";

export function TopUpButton() {
  const wallet = useUserWallet();
  const { open } = useOnboarding();
  if (!wallet) return null;

  const balances = wallet.balances;

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Top up account"
      className="group flex h-10 cursor-pointer items-center gap-3 rounded-full border border-zinc-200 bg-white px-1 pr-4 text-sm shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {balances ? (
        <>
          <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
              {balances.usdcOnUnichain.formatted}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">USDC</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
              {balances.ogOnZerog.formatted}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">0G</span>
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="text-xs font-medium text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
            Top up
          </span>
        </>
      ) : (
        <span className="px-3 text-xs font-medium text-zinc-900 dark:text-zinc-100">
          Top up
        </span>
      )}
    </button>
  );
}
