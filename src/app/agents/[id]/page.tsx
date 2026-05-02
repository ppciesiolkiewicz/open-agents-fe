"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import { AgentRunControl } from "@/components/AgentRunControl";
import { AgentWalletPopover } from "@/components/AgentWalletPopover";
import { Chat } from "@/components/Chat";
import { api } from "@/lib/api";
import type { AgentConfig } from "@/sdk";
import { Badge } from "@/ui/Badge";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { IconButton } from "@/ui/IconButton";
import { BinIcon, GearIcon } from "@/ui/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentChatPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

  const deleteAgent = async () => {
    if (!agent || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await api.agentsIdDelete({ id: agent.id });
      router.push("/agents");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete agent");
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col">
      <nav className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800">
        <Link
          href="/agents"
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Agents
        </Link>
        {agent && (
          <>
            <span className="truncate text-zinc-400">/ {agent.name}</span>
            {agent.dryRun && <Badge tone="warning">dry run</Badge>}
          </>
        )}
        {error && <span className="text-red-600">{error}</span>}
        <div className="flex-1" />
        {agent && (
          <>
            <AgentWalletPopover />
            <IconButton
              aria-label="Delete agent"
              icon={<BinIcon />}
              size="lg"
              variant="danger"
              onClick={() => setConfirmDeleteOpen(true)}
              loading={deleting}
            />
            <IconButton
              aria-label="Edit agent"
              icon={<GearIcon />}
              size="lg"
              variant="secondary"
              onClick={() => setEditOpen(true)}
            />
            <AgentRunControl agent={agent} onChange={setAgent} size="lg" />
          </>
        )}
      </nav>
      <div className="flex min-h-0 flex-1">
        <Chat agentId={id} />
      </div>
      {agent && (
        <>
          <AgentEditDialog
            agent={agent}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSaved={setAgent}
          />
          <ConfirmDialog
            open={confirmDeleteOpen}
            onOpenChange={setConfirmDeleteOpen}
            title={`Delete "${agent.name}"?`}
            description="This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={deleteAgent}
          />
        </>
      )}
    </div>
  );
}
