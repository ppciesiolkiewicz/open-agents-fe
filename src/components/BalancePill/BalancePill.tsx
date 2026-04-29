"use client";

import { useUserWallet } from "@/hooks/useUserWallet";
import { truncateAmount } from "@/lib/formatBalance";

export function BalancePill() {
  const wallet = useUserWallet();
  if (!wallet?.balances) return null;
  const { balances } = wallet;

  return (
    <div className="flex h-10 items-center gap-3 rounded-full border border-zinc-200 bg-white px-1 pr-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
          {truncateAmount(balances.usdcOnUnichain.formatted)}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">USDC</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
          {truncateAmount(balances.ogOnZerog.formatted)}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">0G</span>
      </span>
    </div>
  );
}
