"use client";

import { useTransactionsContext } from "../TransactionsProvider";

export function useTransactions() {
  const {
    purchases,
    trackNewDeposit,
    refresh,
    loading,
    upsertPurchase,
    setActiveId,
  } = useTransactionsContext();
  return {
    purchases,
    trackNewDeposit,
    refresh,
    loading,
    upsertPurchase,
    setActiveId,
  };
}
