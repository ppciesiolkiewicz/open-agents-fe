"use client";

import type { LedgerBalance } from "@/sdk";
import { Card } from "@/ui/Card";
import { truncateAmount } from "@/lib/formatBalance";

export interface LedgerCardProps {
  ledger: LedgerBalance;
}

function Row({ label, formatted }: { label: string; formatted: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
        {truncateAmount(formatted)}{" "}
        <span className="text-xs text-zinc-500 dark:text-zinc-400">0G</span>
      </span>
    </div>
  );
}

export function LedgerCard({ ledger }: LedgerCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          0G account (ledger)
        </span>
        <Row label="Total" formatted={ledger.totalFormatted} />
        <Row label="Available" formatted={ledger.availableFormatted} />
        <Row label="Locked" formatted={ledger.lockedFormatted} />
      </div>
    </Card>
  );
}
