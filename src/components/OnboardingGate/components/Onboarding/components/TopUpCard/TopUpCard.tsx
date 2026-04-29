"use client";

import { useState } from "react";
import { buildTransakUrl } from "@/lib/transak";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { IconButton } from "@/ui/IconButton";
import { CheckIcon, CopyIcon } from "@/ui/icons";
import type { MeWallet, WalletBalances } from "@/lib/userApi";

export interface TopUpCardProps {
  wallet: MeWallet | null;
}

function Balances({ balances }: { balances: WalletBalances }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          USDC on Unichain
        </span>
        <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
          {balances.usdcOnUnichain.formatted} USDC
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          0G on Zerog
        </span>
        <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
          {balances.ogOnZerog.formatted} 0G
          <span className="ml-1 text-zinc-400 dark:text-zinc-500">
            (${balances.ogOnZerog.valueUsd.toFixed(2)})
          </span>
        </span>
      </div>
    </div>
  );
}

export function TopUpCard({ wallet }: TopUpCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!wallet) return;
    await navigator.clipboard.writeText(wallet.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Step 1
        </span>
        <h3 className="text-base font-semibold">Top up your account</h3>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Send USDC to your account on Unichain to fund your agents.
      </p>
      <div className="flex flex-col gap-2">
        {wallet ? (
          <Button asChild className="w-full">
            <a
              href={buildTransakUrl(wallet.walletAddress)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Top up with USDC
            </a>
          </Button>
        ) : (
          <Button disabled className="w-full">
            Top up with USDC
          </Button>
        )}
        {wallet ? (
          <div className="flex items-center gap-1.5">
            <span className="flex-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {wallet.walletAddress}
            </span>
            <IconButton
              aria-label={copied ? "Copied" : "Copy wallet address"}
              icon={copied ? <CheckIcon /> : <CopyIcon />}
              size="sm"
              onClick={() => void handleCopy()}
            />
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Wallet address loading…</p>
        )}
        {wallet?.balances && <Balances balances={wallet.balances} />}
      </div>
    </Card>
  );
}
