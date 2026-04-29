"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { NumberInput } from "@/ui/NumberInput";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; txHash: string }
  | { kind: "error"; message: string };

function shortHash(hash: string): string {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function BuyCreditsCard() {
  const [amount, setAmount] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit() {
    if (amount === null || amount <= 0) return;
    setStatus({ kind: "loading" });
    try {
      const res = await api.usersMeTreasuryDepositPost({
        treasuryDepositBody: { amount: String(amount) },
      });
      setStatus({ kind: "success", txHash: res.txHash });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Deposit failed",
      });
    }
  }

  const submitDisabled =
    status.kind === "loading" || amount === null || amount <= 0;

  return (
    <Card className="gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Step 2
        </span>
        <h3 className="text-base font-semibold">Buy AI tokens (0G)</h3>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Convert your USDC into AI tokens (0G) to run agents.
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <NumberInput
            value={amount}
            onChange={setAmount}
            min={0}
            step={1}
            placeholder="Amount in USDC"
            aria-label="Amount in USDC"
            disabled={status.kind === "loading"}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={() => void handleSubmit()}
            disabled={submitDisabled}
            loading={status.kind === "loading"}
          >
            Buy AI tokens
          </Button>
        </div>
        {status.kind === "success" && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Purchase submitted — AI tokens will appear shortly. Tx{" "}
            <span className="font-mono">{shortHash(status.txHash)}</span>
          </p>
        )}
        {status.kind === "error" && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {status.message}
          </p>
        )}
      </div>
    </Card>
  );
}
