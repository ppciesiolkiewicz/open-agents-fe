"use client";

import { useState } from "react";
import { AgentCreateDialog } from "@/components/AgentCreateDialog";
import { AgentGrid } from "@/components/AgentGrid";
import { TopUpButton } from "@/components/TopUpButton";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/ui/Button";

export default function AgentsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pick an agent to chat with or inspect its activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>+ New agent</Button>
          <TopUpButton />
          <UserMenu />
        </div>
      </header>
      <AgentGrid />
      <AgentCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
