"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Message } from "../types";

interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  appendLocal: (message: Message) => void;
  upsertStreaming: (
    tickId: string,
    update: (prev: Message | null) => Message,
  ) => void;
}

export function useMessages(agentId: string): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .agentsIdMessagesGet({ id: agentId, order: "asc", limit: 100 })
      .then((page) => {
        if (!cancelled) {
          setMessages(page.items);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load messages");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const refresh = useCallback(() => {
    setLoading(true);
    api
      .agentsIdMessagesGet({ id: agentId, order: "asc", limit: 100 })
      .then((page) => {
        setMessages(page.items);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load messages"),
      )
      .finally(() => setLoading(false));
  }, [agentId]);

  const appendLocal = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const upsertStreaming = useCallback(
    (tickId: string, update: (prev: Message | null) => Message) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.tickId === tickId);
        if (idx === -1) return [...prev, update(null)];
        const next = prev.slice();
        next[idx] = update(prev[idx]);
        return next;
      });
    },
    [],
  );

  return {
    messages,
    loading,
    error,
    refresh,
    appendLocal,
    upsertStreaming,
  };
}
