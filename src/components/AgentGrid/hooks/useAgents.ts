"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  agentsQueryKey,
  channelsQueryKey,
} from "@/lib/agentsQuery";
import type { AgentConfig, AxlChannel } from "@/sdk";

interface UseAgentsResult {
  agents: AgentConfig[];
  channels: AxlChannel[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAgents(): UseAgentsResult {
  const queryClient = useQueryClient();
  const agentsQuery = useQuery({
    queryKey: agentsQueryKey,
    queryFn: () => api.agentsGet(),
  });

  const channelsQuery = useQuery({
    queryKey: channelsQueryKey,
    queryFn: () => api.axlChannelsGet(),
    staleTime: 30_000,
  });

  return {
    agents: agentsQuery.data ?? [],
    channels: channelsQuery.isError ? [] : (channelsQuery.data ?? []),
    loading: agentsQuery.isPending,
    refreshing:
      (agentsQuery.isFetching && !agentsQuery.isPending) ||
      (!agentsQuery.isPending && channelsQuery.isFetching && !channelsQuery.isPending),
    error:
      agentsQuery.error instanceof Error
        ? agentsQuery.error.message
        : agentsQuery.error
          ? String(agentsQuery.error)
          : null,
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      void queryClient.invalidateQueries({ queryKey: channelsQueryKey });
    },
  };
}
