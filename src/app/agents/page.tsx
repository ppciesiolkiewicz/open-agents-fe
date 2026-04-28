import { AgentGrid } from "@/components/AgentGrid";

export default function AgentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Pick an agent to chat with or inspect its activity.
        </p>
      </header>
      <AgentGrid />
    </div>
  );
}
