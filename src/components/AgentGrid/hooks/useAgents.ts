"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { subscribeAgentsRefresh } from "@/lib/agentsRefresh";
import type { AgentConfig } from "@/sdk";

interface UseAgentsResult {
  agents: AgentConfig[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAgents(): UseAgentsResult {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .agentsGet()
      .then((list) => {
        if (!cancelled) {
          setAgents(list);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load agents");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    api
      .agentsGet()
      .then((list) => {
        setAgents(list);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load agents"),
      )
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => subscribeAgentsRefresh(refresh), [refresh]);

  return { agents, loading, refreshing, error, refresh };
}
