"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import { AgentRunControl } from "@/components/AgentRunControl";
import { Chat } from "@/components/Chat";
import { UserMenu } from "@/components/UserMenu";
import { api } from "@/lib/api";
import type { AgentConfig } from "@/sdk";
import { IconButton } from "@/ui/IconButton";
import { GearIcon } from "@/ui/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentChatPage({ params }: PageProps) {
  const { id } = use(params);
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .agentsIdGet({ id })
      .then((a) => {
        if (!cancelled) setAgent(a);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load agent");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex h-dvh w-full flex-col">
      <nav className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800">
        <Link
          href="/agents"
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Agents
        </Link>
        {agent && (
          <span className="truncate text-zinc-400">/ {agent.name}</span>
        )}
        {error && <span className="text-red-600">{error}</span>}
        <div className="flex-1" />
        {agent && (
          <>
            <IconButton
              aria-label="Edit agent"
              icon={<GearIcon />}
              size="sm"
              onClick={() => setEditOpen(true)}
            />
            <AgentRunControl agent={agent} onChange={setAgent} />
          </>
        )}
        <UserMenu />
      </nav>
      <div className="flex min-h-0 flex-1">
        <Chat agentId={id} agentName={agent?.name} />
      </div>
      {agent && (
        <AgentEditDialog
          agent={agent}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={setAgent}
        />
      )}
    </div>
  );
}
