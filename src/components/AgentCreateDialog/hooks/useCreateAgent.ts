"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { AgentConfig, CreateAgentBody } from "@/sdk";

interface UseCreateAgentResult {
  create: (body: CreateAgentBody) => Promise<AgentConfig | null>;
  creating: boolean;
  error: string | null;
}

export function useCreateAgent(): UseCreateAgentResult {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (body: CreateAgentBody): Promise<AgentConfig | null> => {
      setCreating(true);
      setError(null);
      try {
        return await api.agentsPost({ createAgentBody: body });
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
