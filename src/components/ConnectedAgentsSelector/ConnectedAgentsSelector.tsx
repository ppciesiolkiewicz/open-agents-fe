"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { AgentConfig } from "@/sdk";
import { Input } from "@/ui/Input";
import { ScrollArea } from "@/ui/ScrollArea";

export interface ConnectedAgentsSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  excludeAgentId?: string;
}

function toKey(value: string): string {
  return value.trim().toLowerCase();
}

function agentInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed.slice(0, 1).toUpperCase() || "?";
}

export function ConnectedAgentsSelector({
  value,
  onChange,
  disabled,
  excludeAgentId,
}: ConnectedAgentsSelectorProps) {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const list = await api.agentsGet();
        if (active) setAgents(list);
      } catch (e) {
        if (active) {
          setLoadError(
            e instanceof Error ? e.message : "Failed to load agents",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const selectable = useMemo(() => {
    if (!excludeAgentId) return agents;
    const ex = toKey(excludeAgentId);
    return agents.filter((a) => toKey(a.id) !== ex);
  }, [agents, excludeAgentId]);

  const selected = useMemo(() => new Set(value.map(toKey)), [value]);

  const filtered = useMemo(() => {
    const q = toKey(search);
    if (!q) return selectable;
    return selectable.filter(
      (a) =>
        toKey(a.name).includes(q) || toKey(a.id).includes(q),
    );
  }, [selectable, search]);

  function toggle(agentId: string) {
    const key = toKey(agentId);
    if (selected.has(key)) {
      onChange(value.filter((entry) => toKey(entry) !== key));
      return;
    }
    onChange([...value, agentId]);
  }

  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        Select other agents this one can exchange messages with. Selected
        agents are linked symmetrically when you save.
      </div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search agents by name or id"
        disabled={disabled || loading}
      />
      <ScrollArea className="mt-2 h-36 rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="p-2">
          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading agents...
            </p>
          ) : loadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {loadError}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No other agents to connect.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filtered.map((agent) => {
                const checked = selected.has(toKey(agent.id));
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => toggle(agent.id)}
                    disabled={disabled}
                    className={[
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                      checked
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
                      disabled ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                    title={agent.id}
                  >
                    <span
                      className={[
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        checked
                          ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                          : "bg-zinc-300 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-100",
                      ].join(" ")}
                      aria-hidden
                    >
                      {agentInitial(agent.name)}
                    </span>
                    <span className="max-w-[12rem] truncate">{agent.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
