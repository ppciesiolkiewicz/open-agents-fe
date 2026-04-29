"use client";

import { useState } from "react";
import { useLogout, usePrivy } from "@privy-io/react-auth";
import { useMe } from "@/components/AuthGate";
import { TransactionsDialog } from "@/components/Transactions";
import { Dropdown, DropdownItem } from "@/ui/Dropdown";
import { IconButton } from "@/ui/IconButton";
import { CheckIcon, CopyIcon, WalletIcon } from "@/ui/icons";
import { cn } from "@/lib/cn";
import { truncateAmount } from "@/lib/formatBalance";
import { toast } from "@/ui/Toast";

function BalanceRow({
  label,
  amount,
  unit,
  valueUsd,
}: {
  label: string;
  amount: string;
  unit: string;
  valueUsd?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
        {amount} {unit}
        {valueUsd !== undefined && (
          <span className="ml-1 text-zinc-400 dark:text-zinc-500">
            (${valueUsd.toFixed(2)})
          </span>
        )}
      </span>
    </div>
  );
}

function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function UserMenu() {
  const { user, ready, authenticated } = usePrivy();
  const { logout } = useLogout();
  const me = useMe();
  const [copied, setCopied] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  if (!ready || !authenticated) return null;

  const email = user?.email?.address ?? null;
  const walletObj = me?.wallets.find((w) => w.isPrimary) ?? null;

  async function copyWallet() {
    if (!walletObj) return;
    try {
      await navigator.clipboard.writeText(walletObj.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast("Wallet address copied");
    } catch {
      /* ignore — clipboard may be blocked */
    }
  }

  return (
    <Dropdown
      trigger={
        <IconButton
          aria-label="Account menu"
          icon={<WalletIcon />}
          size="lg"
          variant="secondary"
          className="cursor-pointer"
        />
      }
    >
      <div className="flex flex-col gap-1 px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span>Signed in as</span>
        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {email ?? "—"}
        </span>
      </div>

      <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />

      {walletObj ? (
        <>
          <button
            type="button"
            onClick={copyWallet}
            aria-label="Copy wallet address"
            className={cn(
              "flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            <span className="flex flex-col">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Wallet
              </span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                {shortAddress(walletObj.walletAddress)}
              </span>
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

          {walletObj.balances && (
            <div className="flex flex-col gap-0.5 px-2 py-1.5">
              <BalanceRow
                label="USDC"
                amount={truncateAmount(walletObj.balances.usdcOnUnichain.formatted)}
                unit="USDC"
              />
              <BalanceRow
                label="0G"
                amount={truncateAmount(walletObj.balances.ogOnZerog.formatted)}
                unit="0G"
                valueUsd={walletObj.balances.ogOnZerog.valueUsd}
              />
            </div>
          )}
        </>
      ) : (
        <div className="px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          No wallet yet
        </div>
      )}

      <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />

      <DropdownItem onSelect={() => setTransactionsOpen(true)}>
        Transactions
      </DropdownItem>
      <DropdownItem onSelect={() => void logout()}>Sign out</DropdownItem>
      <TransactionsDialog
        open={transactionsOpen}
        onOpenChange={setTransactionsOpen}
      />
    </Dropdown>
  );
}
