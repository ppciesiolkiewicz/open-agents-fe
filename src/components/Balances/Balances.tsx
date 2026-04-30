"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ZeroGBalancesResponse } from "@/sdk";
import { Button } from "@/ui/Button";
import { Spinner } from "@/ui/Spinner";
import { WalletCard } from "./components/WalletCard";
import { LedgerCard } from "./components/LedgerCard";
import { ProvidersTable } from "./components/ProvidersTable";
import { TokensCard } from "./components/TokensCard";

export function Balances() {
  const [data, setData] = useState<ZeroGBalancesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await api.usersMeZerogBalancesGet();
        if (cancelled) return;
        setData(res);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load balances");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="secondary" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <WalletCard onChainOG={data.onChainOG} />
      <LedgerCard ledger={data.ledger} />
      <ProvidersTable providers={data.providers} />
      <TokensCard tokens={data.tokens} />
    </div>
  );
}
