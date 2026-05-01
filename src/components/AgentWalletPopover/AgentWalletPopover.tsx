"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMe } from "@/components/AuthGate";
import { api } from "@/lib/api";
import type { TokenBalanceWithPrice } from "@/sdk";
import { truncateAmount } from "@/lib/formatBalance";
import { IconButton } from "@/ui/IconButton";
import { Spinner } from "@/ui/Spinner";
import { toast } from "@/ui/Toast";
import { CheckIcon, CopyIcon, UnichainIcon, WalletIcon } from "@/ui/icons";
import { cn } from "@/lib/cn";

function hasPositiveBalance(token: TokenBalanceWithPrice): boolean {
  try {
    return BigInt(token.balanceRaw) > 0n;
  } catch {
    return Number(token.balanceFormatted) > 0;
  }
}

function chainLabel(chainId: number): string {
  if (chainId === 130 || chainId === 1301) return "Unichain";
  return `Chain ${chainId}`;
}

function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function AgentWalletPopover() {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenBalanceWithPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const walletObj = me?.wallets.find((w) => w.isPrimary) ?? null;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.usersMeWalletBalancesGet();
      const nonZero = Object.values(res.chains)
        .flatMap((chain) => chain.tokens)
        .filter(hasPositiveBalance)
        .sort((a, b) => b.valueUsd - a.valueUsd);
      setTokens(nonZero);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load balances");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = event.target as Node;
      if (!root.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const grouped = useMemo(() => {
    const map = new Map<number, TokenBalanceWithPrice[]>();
    for (const token of tokens) {
      const list = map.get(token.chainId) ?? [];
      list.push(token);
      map.set(token.chainId, list);
    }
    return Array.from(map.entries());
  }, [tokens]);

  const copyWallet = useCallback(async () => {
    if (!walletObj) return;
    try {
      await navigator.clipboard.writeText(walletObj.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast("Wallet address copied");
    } catch {
      // Ignore clipboard errors.
    }
  }, [walletObj]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        aria-label="Wallet balances"
        icon={<WalletIcon />}
        size="lg"
        variant="secondary"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) void refresh();
            return next;
          });
        }}
      />
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[360px] rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              Wallet balances
            </div>
            <div className="flex-1" />
            <IconButton
              aria-label="Refresh balances"
              icon={<span className="text-sm">↻</span>}
              size="sm"
              variant="ghost"
              onClick={() => void refresh()}
              loading={loading}
            />
            <IconButton
              aria-label="Close balances"
              icon={<span className="text-sm">×</span>}
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-3">
            {walletObj && (
              <button
                type="button"
                onClick={() => void copyWallet()}
                aria-label="Copy wallet address"
                className={cn(
                  "mb-3 flex w-full cursor-pointer items-center justify-between gap-2 rounded border border-zinc-200 px-2.5 py-2 text-left dark:border-zinc-800",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-900",
                )}
              >
                <span className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Wallet address
                  </span>
                  <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                    {shortAddress(walletObj.walletAddress)}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-zinc-400 dark:text-zinc-500 [&_svg]:size-5",
                    copied && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </span>
              </button>
            )}
            {loading && tokens.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Spinner size="sm" /> Loading balances...
              </div>
            ) : error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : tokens.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No token balances above 0.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {grouped.map(([chainId, chainTokens]) => (
                  <div key={chainId} className="flex flex-col gap-1.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      <UnichainIcon className="size-[18px]" />
                      {chainLabel(chainId)}
                    </div>
                    <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                      {chainTokens.map((token) => (
                        <li
                          key={`${token.chainId}:${token.address}`}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                            {token.symbol}
                          </span>
                          <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                            {truncateAmount(token.balanceFormatted)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
