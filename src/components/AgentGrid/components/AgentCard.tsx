"use client";

import Link from "next/link";
import { useState } from "react";
import { AgentRunControl } from "@/components/AgentRunControl";
import { Badge } from "@/ui/Badge";
import { Card, CardField, CardHeader } from "@/ui/Card";
import type { AgentConfig } from "@/sdk";
import { formatInterval, formatRelativeSeconds } from "../utils/format";

export interface AgentCardProps {
  agent: AgentConfig;
}

export function AgentCard({ agent: initial }: AgentCardProps) {
  const [agent, setAgent] = useState(initial);

  const lastSeen = formatRelativeSeconds(agent.lastTickAt ?? null) ?? "—";
  const interval = formatInterval(agent.intervalMs) ?? "—";

  return (
    <Card interactive className="relative h-full w-full gap-4">
      <Link
        href={`/agents/${agent.id}`}
        aria-label={`Open ${agent.name}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      />

      <CardHeader
        title={agent.name}
        action={
          <div className="relative z-10 flex items-center gap-2">
            <Badge tone={agent.running ? "success" : "neutral"}>
              {agent.running ? "running" : "stopped"}
            </Badge>
            {agent.dryRun && <Badge tone="warning">dry run</Badge>}
            <AgentRunControl agent={agent} onChange={setAgent} />
          </div>
        }
      />

      <p className="line-clamp-3 min-h-15 text-sm text-zinc-600 dark:text-zinc-400">
        {agent.prompt}
      </p>

      <div className="mt-auto grid grid-cols-2 gap-3">
        <CardField
          label="Max trade"
          value={`$${agent.riskLimits.maxTradeUSD}`}
        />
        <CardField
          label="Slippage"
          value={`${agent.riskLimits.maxSlippageBps} bps`}
        />
        <CardField label="Interval" value={interval} />
        <CardField label="Last activity" value={lastSeen} />
      </div>
    </Card>
  );
}
