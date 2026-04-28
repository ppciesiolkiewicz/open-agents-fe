"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { AgentConfig, AgentsPostRequest } from "@/sdk";

interface UseCreateAgentResult {
  create: (body: AgentsPostRequest) => Promise<AgentConfig | null>;
  creating: boolean;
  error: string | null;
}

export function useCreateAgent(): UseCreateAgentResult {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (body: AgentsPostRequest): Promise<AgentConfig | null> => {
      setCreating(true);
      setError(null);
      try {
        return await api.agentsPost(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create agent");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  return { create, creating, error };
}
