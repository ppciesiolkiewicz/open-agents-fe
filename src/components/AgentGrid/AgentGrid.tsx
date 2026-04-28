"use client";

import { Spinner } from "@/ui/Spinner";
import { AgentCard } from "./components/AgentCard";
import { useAgents } from "./hooks/useAgents";

export function AgentGrid() {
  const { agents, loading, error } = useAgents();

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

  if (agents.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No agents yet. Create one via the API.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((a) => (
        <li key={a.id}>
          <AgentCard agent={a} />
        </li>
      ))}
    </ul>
  );
}
