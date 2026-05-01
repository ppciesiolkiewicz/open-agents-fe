"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import type { TokenView } from "@/sdk";
import { Input } from "@/ui/Input";
import { ScrollArea } from "@/ui/ScrollArea";
import { UnichainIcon } from "@/ui/icons";

export interface AllowedTokensSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

function toKey(value: string): string {
  return value.trim().toLowerCase();
}

export function AllowedTokensSelector({
  value,
  onChange,
  disabled,
}: AllowedTokensSelectorProps) {
  const [tokens, setTokens] = useState<TokenView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAllTokens() {
      setLoading(true);
      setLoadError(null);
      try {
        const all: TokenView[] = [];
        let cursor: string | null | undefined = undefined;
        let pages = 0;
        do {
          const page = await api.tokensGet({ limit: 200, cursor });
          all.push(...page.tokens);
          cursor = page.nextCursor;
          pages += 1;
        } while (cursor && pages < 10);

        const deduped = new Map<string, TokenView>();
        for (const token of all) {
          deduped.set(toKey(token.address), token);
        }
        if (active) {
          setTokens(Array.from(deduped.values()));
        }
      } catch (e) {
        if (active) {
          setLoadError(
            e instanceof Error ? e.message : "Failed to load supported tokens",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAllTokens();
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(() => new Set(value.map(toKey)), [value]);
  const filtered = useMemo(() => {
    const q = toKey(search);
    if (!q) return tokens;
    return tokens.filter(
      (token) =>
        toKey(token.symbol).includes(q) ||
        toKey(token.name).includes(q) ||
        toKey(token.address).includes(q),
    );
  }, [tokens, search]);
  const grouped = useMemo(() => {
    const groups = new Map<string, TokenView[]>();
    for (const token of filtered) {
      const key = token.chain;
      const current = groups.get(key) ?? [];
      current.push(token);
      groups.set(key, current);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  function toggle(address: string) {
    const key = toKey(address);
    if (selected.has(key)) {
      onChange(value.filter((entry) => toKey(entry) !== key));
      return;
    }
    onChange([...value, address]);
  }

  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        Select supported tokens this agent can trade.
      </div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by symbol, name, chain, or address"
        disabled={disabled || loading}
      />
      <ScrollArea className="mt-2 h-44 rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="p-2">
          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading tokens...
            </p>
          ) : loadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No matching tokens.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {grouped.map(([chain, chainTokens]) => (
                <div key={chain}>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <UnichainIcon className="size-3.5" />
                    {chain}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {chainTokens.map((token) => {
                      const checked = selected.has(toKey(token.address));
                      return (
                        <button
                          key={`${token.chainId}:${token.address}`}
                          type="button"
                          onClick={() => toggle(token.address)}
                          disabled={disabled}
                          className={[
                            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                            checked
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                              : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
                            disabled ? "cursor-not-allowed opacity-60" : "",
                          ].join(" ")}
                          title={`${token.name} (${token.address})`}
                        >
                          {token.logoUri ? (
                            <Image
                              src={token.logoUri}
                              alt=""
                              width={16}
                              height={16}
                              unoptimized
                              className="size-4 rounded-full"
                            />
                          ) : (
                            <span className="size-4 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                          )}
                          <span>{token.symbol}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
