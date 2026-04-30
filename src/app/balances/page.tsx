"use client";

import Link from "next/link";
import { Balances } from "@/components/Balances";

export default function BalancesPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Balances</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            0G token balances across your wallet, account ledger, and providers.
          </p>
        </div>
        <Link
          href="/agents"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Back
        </Link>
      </header>
      <Balances />
    </div>
  );
}
