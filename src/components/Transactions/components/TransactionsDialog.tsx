"use client";

import { ZeroGPurchaseStatusEnum, type ZeroGPurchase } from "@/sdk";
import { Dialog } from "@/ui/Dialog";
import { Spinner } from "@/ui/Spinner";
import { cn } from "@/lib/cn";
import { truncateAmount } from "@/lib/formatBalance";
import { useTransactionsContext } from "../TransactionsProvider";
import { isTerminal, STATUS_LABEL } from "../utils/status";

export interface TransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatusPill({ status }: { status: ZeroGPurchaseStatusEnum }) {
  const tone =
    status === ZeroGPurchaseStatusEnum.Completed
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : status === ZeroGPurchaseStatusEnum.Failed
        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {!isTerminal(status) && <Spinner size="sm" />}
      {STATUS_LABEL[status]}
    </span>
  );
}

function PurchaseRow({ purchase }: { purchase: ZeroGPurchase }) {
  const created = new Date(
    purchase.createdAt > 1e12 ? purchase.createdAt : purchase.createdAt * 1000,
  ).toLocaleString();
  return (
    <li className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
            {truncateAmount(purchase.incomingUsdcAmount)} USDC
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {created}
          </span>
        </div>
        <StatusPill status={purchase.status} />
      </div>
      {purchase.status === ZeroGPurchaseStatusEnum.Completed &&
        purchase.ogAmountSentToUser && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Received{" "}
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
              {truncateAmount(purchase.ogAmountSentToUser)} 0G
            </span>
          </div>
        )}
      {purchase.status === ZeroGPurchaseStatusEnum.Failed &&
        purchase.errorMessage && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {purchase.errorMessage}
          </p>
        )}
    </li>
  );
}

export function TransactionsDialog({
  open,
  onOpenChange,
}: TransactionsDialogProps) {
  const { purchases, loading } = useTransactionsContext();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Transactions"
      description="Your AI-token purchases — most recent first."
    >
      {loading && purchases.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : purchases.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No transactions yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {purchases.map((p) => (
            <PurchaseRow key={p.id} purchase={p} />
          ))}
        </ul>
      )}
    </Dialog>
  );
}
