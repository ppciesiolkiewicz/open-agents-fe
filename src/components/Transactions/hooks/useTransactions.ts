"use client";

import { useTransactionsContext } from "../TransactionsProvider";

export function useTransactions() {
  const { purchases, trackNewDeposit, refresh, loading } =
    useTransactionsContext();
  return { purchases, trackNewDeposit, refresh, loading };
}
