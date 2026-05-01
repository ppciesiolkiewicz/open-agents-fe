"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { invalidateAgentsAndChannelsQueries } from "@/lib/agentsQuery";
import type { AgentConfig, CreateAgentBody } from "@/sdk";

interface UseCreateAgentResult {
  create: (body: CreateAgentBody) => Promise<AgentConfig | null>;
  creating: boolean;
  error: string | null;
}

export function useCreateAgent(): UseCreateAgentResult {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (body: CreateAgentBody): Promise<AgentConfig | null> => {
      setCreating(true);
      setError(null);
      try {
        const created = await api.agentsPost({ createAgentBody: body });
        invalidateAgentsAndChannelsQueries(queryClient);
        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create agent");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [queryClient],
  );

  return { create, creating, error };
}
