"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { agentsQueryKey } from "@/lib/agentsQuery";
import type { AgentConfig } from "@/sdk";

interface UseAgentsResult {
  agents: AgentConfig[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAgents(): UseAgentsResult {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: agentsQueryKey,
    queryFn: () => api.agentsGet(),
  });

  return {
    agents: query.data ?? [],
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? String(query.error)
          : null,
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
    },
  };
}
