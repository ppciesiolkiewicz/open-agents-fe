"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { WalletBalancesResponse, ZeroGBalancesResponse } from "@/sdk";
import { Button } from "@/ui/Button";
import { Spinner } from "@/ui/Spinner";
import { WalletCard } from "./components/WalletCard";
import { LedgerCard } from "./components/LedgerCard";
import { ProvidersTable } from "./components/ProvidersTable";
import { TokensCard } from "./components/TokensCard";

export function Balances() {
  const [zerogData, setZerogData] = useState<ZeroGBalancesResponse | null>(null);
  const [walletData, setWalletData] = useState<WalletBalancesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [zerog, wallet] = await Promise.all([
          api.usersMeZerogBalancesGet(),
          api.usersMeWalletBalancesGet(),
        ]);
        if (cancelled) return;
        setZerogData(zerog);
        setWalletData(wallet);
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

  if (loading && !zerogData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error && !zerogData) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="secondary" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!zerogData) return null;

  return (
    <div className="flex flex-col gap-4">
      <WalletCard onChainOG={zerogData.onChainOG} />
      <LedgerCard ledger={zerogData.ledger} />
      <ProvidersTable providers={zerogData.providers} />
      {walletData && <TokensCard walletBalances={walletData} />}
    </div>
  );
}
