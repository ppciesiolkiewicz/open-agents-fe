"use client";

import { Spinner } from "@/ui/Spinner";
import { AgentGraph } from "./components/AgentGraph";
import { useAgents } from "./hooks/useAgents";

export function AgentGrid() {
  const { agents, channels, loading, error } = useAgents();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (agents.length === 0 && channels.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No agents or channels yet.
      </div>
    );
  }

  return <AgentGraph agents={agents} channels={channels} />;
}
