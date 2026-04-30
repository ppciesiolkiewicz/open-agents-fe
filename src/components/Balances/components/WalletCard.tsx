"use client";

import { useState } from "react";
import { useUserWallet } from "@/hooks/useUserWallet";
import { Card } from "@/ui/Card";
import { CheckIcon, CopyIcon } from "@/ui/icons";
import { toast } from "@/ui/Toast";
import { cn } from "@/lib/cn";
import { truncateAmount } from "@/lib/formatBalance";

function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export interface WalletCardProps {
  formatted: string;
}

export function WalletCard({ formatted }: WalletCardProps) {
  const wallet = useUserWallet();
  const address = wallet?.walletAddress ?? null;
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast("Wallet address copied");
    } catch {
      /* ignore */
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            On-chain wallet
          </span>
          <span className="font-mono text-lg text-zinc-900 dark:text-zinc-100">
            {truncateAmount(formatted)}{" "}
            <span className="text-sm text-zinc-500 dark:text-zinc-400">0G</span>
          </span>
        </div>
        {address && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy wallet address"
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
              {shortAddress(address)}
            </span>
            <span
              className={cn(
                "text-zinc-400 dark:text-zinc-500",
                copied && "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </span>
          </button>
        )}
      </div>
    </Card>
  );
}
