"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { AgentConfig, UpdateAgentBody } from "@/sdk";

interface UseUpdateAgentResult {
  update: (body: UpdateAgentBody) => Promise<AgentConfig | null>;
  saving: boolean;
  error: string | null;
}

export function useUpdateAgent(agentId: string): UseUpdateAgentResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (body: UpdateAgentBody): Promise<AgentConfig | null> => {
      setSaving(true);
      setError(null);
      try {
        return await api.agentsIdPatch({ id: agentId, updateAgentBody: body });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save agent");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [agentId],
  );

  return { update, saving, error };
}
