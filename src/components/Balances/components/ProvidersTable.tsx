"use client";

import { useState } from "react";
import type { ProviderBalance } from "@/sdk";
import { Card } from "@/ui/Card";
import { CheckIcon, CopyIcon } from "@/ui/icons";
import { toast } from "@/ui/Toast";
import { cn } from "@/lib/cn";
import { truncateAmount } from "@/lib/formatBalance";

export interface ProvidersTableProps {
  providers: ProviderBalance[];
}

function ProviderRow({ provider }: { provider: ProviderBalance }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(provider.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast("Provider address copied");
    } catch {
      /* ignore */
    }
  }

  return (
    <li className="flex flex-col gap-1.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Address
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy provider address"
          className={cn(
            "flex min-w-0 cursor-pointer items-center gap-2 rounded px-2 py-1",
            "hover:bg-zinc-100 dark:hover:bg-zinc-800",
          )}
        >
          <span className="truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
            {provider.address}
          </span>
          <span
            className={cn(
              "shrink-0 text-zinc-400 dark:text-zinc-500",
              copied && "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </span>
        </button>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Balance
        </span>
        <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
          {truncateAmount(provider.balanceFormatted)}{" "}
          <span className="text-xs text-zinc-500 dark:text-zinc-400">0G</span>
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Raw
        </span>
        <span className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-500">
          {provider.balanceRaw}
        </span>
      </div>
    </li>
  );
}

export function ProvidersTable({ providers }: ProvidersTableProps) {
  return (
    <Card>
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Providers
        </span>
        {providers.length === 0 ? (
          <p className="py-2 text-sm text-zinc-500 dark:text-zinc-400">
            No providers.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {providers.map((p) => (
              <ProviderRow key={p.address} provider={p} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
