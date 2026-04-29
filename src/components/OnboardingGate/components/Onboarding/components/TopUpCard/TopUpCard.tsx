"use client";

import { useState } from "react";
import { buildTransakUrl } from "@/lib/transak";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { IconButton } from "@/ui/IconButton";
import { CheckIcon, CopyIcon } from "@/ui/icons";
import type { MeWallet } from "@/lib/userApi";

export interface TopUpCardProps {
  wallet: MeWallet | null;
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
        <a
          href={wallet ? buildTransakUrl(wallet.walletAddress) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
        >
          <Button disabled={!wallet} className="w-full">
            Top up with USDC
          </Button>
        </a>
        {wallet ? (
          <div className="flex items-center gap-1.5">
            <span className="flex-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {wallet.walletAddress}
            </span>
            {typeof navigator !== "undefined" && navigator.clipboard && (
              <IconButton
                aria-label={copied ? "Copied" : "Copy wallet address"}
                icon={copied ? <CheckIcon /> : <CopyIcon />}
                size="sm"
                onClick={() => void handleCopy()}
              />
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Wallet address loading…</p>
        )}
      </div>
    </Card>
  );
}
