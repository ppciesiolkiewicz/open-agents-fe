"use client";

import { useState, type MouseEvent } from "react";
import { api } from "@/lib/api";
import type { AgentConfig } from "@/sdk";
import { IconButton } from "@/ui/IconButton";
import { PlayIcon, StopIcon } from "@/ui/icons";

export interface AgentRunControlProps {
  agent: AgentConfig;
  onChange?: (next: AgentConfig) => void;
  size?: "sm" | "md" | "lg";
}

export function AgentRunControl({
  agent,
  onChange,
  size = "sm",
}: AgentRunControlProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = agent.running
        ? await api.agentsIdStopPost({ id: agent.id })
        : await api.agentsIdStartPost({ id: agent.id });
      onChange?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const label = agent.running ? "Stop agent" : "Start agent";

  return (
    <IconButton
      aria-label={label}
      title={error ?? label}
      icon={agent.running ? <StopIcon /> : <PlayIcon />}
      variant={agent.running ? "danger" : "success"}
      size={size}
      loading={busy}
      onClick={toggle}
    />
  );
}
