"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { ZeroGPurchase } from "@/sdk";
import { isTerminal } from "./utils/status";

const POLL_INTERVAL_MS = 1000;

interface TransactionsContextValue {
  purchases: ZeroGPurchase[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  trackNewDeposit: () => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
  upsertPurchase: (purchase: ZeroGPurchase) => void;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function useTransactionsContext(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error(
      "useTransactionsContext must be used inside <TransactionsProvider>",
    );
  }
  return ctx;
}

function mergePurchases(
  prev: ZeroGPurchase[],
  next: ZeroGPurchase[],
): ZeroGPurchase[] {
  const byId = new Map<string, ZeroGPurchase>();
  for (const p of prev) byId.set(p.id, p);
  for (const p of next) byId.set(p.id, p);
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export interface TransactionsProviderProps {
  children: ReactNode;
}

export function TransactionsProvider({ children }: TransactionsProviderProps) {
  const [purchases, setPurchases] = useState<ZeroGPurchase[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const upsertPurchase = useCallback((purchase: ZeroGPurchase) => {
    setPurchases((prev) => mergePurchases(prev, [purchase]));
  }, []);

  const hasInProgress = useMemo(
    () => purchases.some((p) => !isTerminal(p.status)),
    [purchases],
  );

  const fetchAll = useCallback(async () => {
    const res = await api.usersMeTreasuryPurchasesGet({});
    setPurchases((prev) => mergePurchases(prev, res.items));
    return res.items;
  }, []);

  const refresh = useCallback(async () => {
    try {
      await fetchAll();
    } catch {
      /* swallow — keep previous state */
    }
  }, [fetchAll]);

  const trackNewDeposit = useCallback(async () => {
    try {
      const items = await fetchAll();
      const latestInProgress = items.find((p) => !isTerminal(p.status));
      if (latestInProgress) setActiveId(latestInProgress.id);
    } catch {
      /* ignore */
    }
  }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await fetchAll();
        if (cancelled) return;
        const firstInProgress = items.find((p) => !isTerminal(p.status));
        if (firstInProgress) setActiveId(firstInProgress.id);
      } catch {
        /* ignore — polling effect will retry */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  useEffect(() => {
    if (!hasInProgress) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        await fetchAll();
      } catch {
        /* swallow — schedule next attempt */
      }
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    }

    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hasInProgress, fetchAll]);

  return (
    <TransactionsContext.Provider
      value={{
        purchases,
        activeId,
        setActiveId,
        trackNewDeposit,
        refresh,
        loading,
        upsertPurchase,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}
