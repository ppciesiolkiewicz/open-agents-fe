"use client";

import Link from "next/link";
import { useState } from "react";
import { AgentRunControl } from "@/components/AgentRunControl";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import type { AgentConfig } from "@/sdk";
import { cn } from "@/lib/cn";
import { formatInterval, formatRelativeSeconds } from "../utils/format";

export interface AgentCardProps {
  agent: AgentConfig;
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        {label}
      </span>
      <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
        {value}
      </span>
    </div>
  );
}

export function AgentCard({ agent: initial }: AgentCardProps) {
  const [agent, setAgent] = useState(initial);

  const lastSeen = formatRelativeSeconds(agent.lastTickAt ?? null) ?? "—";
  const interval = formatInterval(agent.intervalMs) ?? "—";
  const prompt = agent.prompt?.trim();
  const hasPrompt = prompt && prompt !== "-";

  return (
    <Card
      interactive
      className="group relative h-full w-full gap-4 overflow-hidden transition-all hover:shadow-md dark:hover:shadow-zinc-950/40"
    >
      <Link
        href={`/agents/${agent.id}`}
        aria-label={`Open ${agent.name}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              agent.running
                ? "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60"
                : "bg-zinc-400 dark:bg-zinc-600",
            )}
            aria-hidden="true"
          />
          <h3 className="truncate text-base font-semibold">{agent.name}</h3>
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          {agent.dryRun && <Badge tone="warning">dry run</Badge>}
          <AgentRunControl agent={agent} onChange={setAgent} />
        </div>
      </div>

      <p
        className={cn(
          "line-clamp-3 min-h-15 text-sm leading-relaxed",
          hasPrompt
            ? "text-zinc-600 dark:text-zinc-300"
            : "italic text-zinc-400 dark:text-zinc-600",
        )}
      >
        {hasPrompt ? prompt : "No description"}
      </p>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <Stat label="Max trade" value={`$${agent.riskLimits.maxTradeUSD}`} />
        <Stat
          label="Slippage"
          value={`${agent.riskLimits.maxSlippageBps} bps`}
        />
        <Stat label="Interval" value={interval} />
        <Stat label="Last activity" value={lastSeen} />
      </div>
    </Card>
  );
}
