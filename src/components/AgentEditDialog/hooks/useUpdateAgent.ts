"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { invalidateAgentsAndChannelsQueries } from "@/lib/agentsQuery";
import type { AgentConfig, UpdateAgentBody } from "@/sdk";

interface UseUpdateAgentResult {
  update: (body: UpdateAgentBody) => Promise<AgentConfig | null>;
  saving: boolean;
  error: string | null;
}

export function useUpdateAgent(agentId: string): UseUpdateAgentResult {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (body: UpdateAgentBody): Promise<AgentConfig | null> => {
      setSaving(true);
      setError(null);
      try {
        const updated = await api.agentsIdPatch({ id: agentId, updateAgentBody: body });
        invalidateAgentsAndChannelsQueries(queryClient);
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save agent");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [agentId, queryClient],
  );

  return { update, saving, error };
}
