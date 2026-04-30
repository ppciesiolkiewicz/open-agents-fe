"use client";

import { useEffect } from "react";
import { ZeroGPurchaseStatusEnum, type ZeroGPurchase } from "@/sdk";
import { cn } from "@/lib/cn";
import { truncateAmount } from "@/lib/formatBalance";
import { IconButton } from "@/ui/IconButton";
import { useTransactionsContext } from "../TransactionsProvider";
import { isTerminal, STATUS_LABEL, STEPS, stepIndex } from "../utils/status";

const AUTO_DISMISS_MS = 8000;

function StepProgress({ purchase }: { purchase: ZeroGPurchase }) {
  const idx = stepIndex(purchase.status);
  const failed = purchase.status === ZeroGPurchaseStatusEnum.Failed;

  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const done = !failed && i < idx;
        const active = !failed && i === idx;
        return (
          <li key={step.key} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full transition-colors",
                done && "bg-emerald-500",
                active && "animate-pulse bg-blue-500",
                !done && !active && "bg-zinc-300 dark:bg-zinc-700",
                failed && i === 0 && "bg-red-500",
              )}
              aria-hidden="true"
            />
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-4 transition-colors",
                  done ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function TransactionToastHost() {
  const { purchases, activeId, setActiveId } = useTransactionsContext();
  const purchase = purchases.find((p) => p.id === activeId) ?? null;
  const terminal = purchase ? isTerminal(purchase.status) : false;

  useEffect(() => {
    if (!purchase || !terminal) return;
    const timer = setTimeout(() => setActiveId(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [purchase, terminal, setActiveId]);

  if (!purchase) return null;

  const { status } = purchase;
  const isCompleted = status === ZeroGPurchaseStatusEnum.Completed;
  const isFailed = status === ZeroGPurchaseStatusEnum.Failed;
  const headerTone = isCompleted
    ? "text-emerald-600 dark:text-emerald-400"
    : isFailed
      ? "text-red-600 dark:text-red-400"
      : "text-blue-600 dark:text-blue-400";
  const headerLabel = isCompleted
    ? "Purchase complete"
    : isFailed
      ? "Purchase failed"
      : "Purchase in progress";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              headerTone,
            )}
          >
            {headerLabel}
          </span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {STATUS_LABEL[status]}
          </span>
        </div>
        <IconButton
          aria-label="Dismiss"
          icon={<span aria-hidden>×</span>}
          size="sm"
          variant="ghost"
          onClick={() => setActiveId(null)}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Amount</span>
        <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
          {truncateAmount(purchase.incomingUsdcAmount)} USDC
        </span>
      </div>

      <div className="mt-3">
        <StepProgress purchase={purchase} />
      </div>

      {isFailed && purchase.errorMessage && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {purchase.errorMessage}
        </p>
      )}
    </div>
  );
}
