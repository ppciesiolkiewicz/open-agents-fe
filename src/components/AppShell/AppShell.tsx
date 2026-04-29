import type { ReactNode } from "react";
import {
  TransactionToastHost,
  TransactionsProvider,
} from "@/components/Transactions";
import { TopBar } from "./components/TopBar";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TransactionsProvider>
      <div className="flex min-h-dvh flex-col">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <TransactionToastHost />
      </div>
    </TransactionsProvider>
  );
}
