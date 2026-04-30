"use client";

import type { TokenBalanceWithPrice, WalletBalancesResponse } from "@/sdk";
import { Card } from "@/ui/Card";
import { UnichainIcon } from "@/ui/icons";
import { truncateAmount } from "@/lib/formatBalance";

const UNICHAIN_CHAIN_IDS = new Set([130, 1301]);

function chainBadge(chainId: number) {
  if (UNICHAIN_CHAIN_IDS.has(chainId)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-medium text-pink-700 dark:bg-pink-950/40 dark:text-pink-300">
        <UnichainIcon className="size-3" />
        Unichain
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      chain {chainId}
    </span>
  );
}

function TokenRow({ token }: { token: TokenBalanceWithPrice }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {token.symbol}
        </span>
        {chainBadge(token.chainId)}
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
          {truncateAmount(token.balanceFormatted)}{" "}
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {token.symbol}
          </span>
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          ${token.valueUsd.toFixed(2)}
          {token.priceUsd > 0 && (
            <span className="ml-1 text-zinc-400 dark:text-zinc-500">
              · ${token.priceUsd.toFixed(4)}
            </span>
          )}
        </span>
      </div>
    </li>
  );
}

export interface TokensCardProps {
  walletBalances: WalletBalancesResponse;
}

export function TokensCard({ walletBalances }: TokensCardProps) {
  const allTokens = Object.values(walletBalances.chains).flatMap((c) => c.tokens);

  return (
    <Card>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Tokens
          </span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            ${walletBalances.totalValueUsd.toFixed(2)} total
          </span>
        </div>
        {allTokens.length === 0 ? (
          <p className="py-2 text-sm text-zinc-500 dark:text-zinc-400">
            No tokens.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {allTokens.map((t) => (
              <TokenRow key={`${t.chainId}-${t.address}`} token={t} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
