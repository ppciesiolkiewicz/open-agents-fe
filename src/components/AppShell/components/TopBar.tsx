"use client";

import Link from "next/link";
import { BalancePill } from "@/components/BalancePill";
import { TopUpButton } from "@/components/TopUpButton";
import { UserMenu } from "@/components/UserMenu";

export function TopBar() {
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-zinc-200 bg-white/80 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <Link
        href="/agents"
        className="text-lg font-bold tracking-tight text-zinc-900 hover:underline underline-offset-2 dark:text-zinc-100"
      >
        Agora
      </Link>
      <div className="flex items-center gap-2">
        <BalancePill />
        <TopUpButton />
        <UserMenu />
      </div>
    </div>
  );
}
