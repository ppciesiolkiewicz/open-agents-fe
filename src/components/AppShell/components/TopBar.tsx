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
        className="group flex items-center gap-2.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
      >
        <span className="group-hover:underline underline-offset-2">Agora</span>
        <span className="mt-1 flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-rose-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-sky-400" />
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <BalancePill />
        <TopUpButton />
        <UserMenu />
      </div>
    </div>
  );
}
