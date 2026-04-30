"use client";

import Link from "next/link";
import { useUserWallet } from "@/hooks/useUserWallet";
import { InfoIcon } from "@/ui/icons";
import { truncateAmount } from "@/lib/formatBalance";

export function BalancePill() {
  const wallet = useUserWallet();
  if (!wallet?.balances) return null;
  const { balances } = wallet;

  return (
    <Link
      href="/balances"
      aria-label="View balance details"
      className="flex h-10 cursor-pointer items-center gap-3 rounded-full border border-zinc-200 bg-white px-1 pr-3 text-sm shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
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
      <InfoIcon className="size-3.5 text-zinc-400 dark:text-zinc-500" />
    </Link>
  );
}
