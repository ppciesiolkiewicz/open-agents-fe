"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { ZeroGPurchase } from "@/sdk";
import { isTerminal } from "./utils/status";

const POLL_INTERVAL_MS = 5000;

interface TransactionsContextValue {
  purchases: ZeroGPurchase[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  trackNewDeposit: () => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
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
  const purchasesRef = useRef(purchases);
  purchasesRef.current = purchases;

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
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const items = await fetchAll();
        if (cancelled) return;
        if (items.some((p) => !isTerminal(p.status))) {
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    }

    void (async () => {
      try {
        await fetchAll();
      } catch {
        if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
      } finally {
        if (!cancelled) setLoading(false);
      }
      if (cancelled) return;
      const list = purchasesRef.current;
      const firstInProgress = list.find((p) => !isTerminal(p.status));
      if (firstInProgress) setActiveId(firstInProgress.id);
      if (list.some((p) => !isTerminal(p.status))) {
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchAll]);

  return (
    <TransactionsContext.Provider
      value={{
        purchases,
        activeId,
        setActiveId,
        trackNewDeposit,
        refresh,
        loading,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}
