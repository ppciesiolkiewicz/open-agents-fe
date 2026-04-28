"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import type { ActivityLogEntry } from "@/sdk";
import type { EphemeralPayload, StreamEvent } from "../types";

interface UseAgentStreamArgs {
  agentId: string;
  onAppend?: (entry: ActivityLogEntry) => void;
  onEphemeral?: (payload: EphemeralPayload) => void;
  onError?: (error: Event) => void;
}

export function useAgentStream({
  agentId,
  onAppend,
  onEphemeral,
  onError,
}: UseAgentStreamArgs): void {
  useEffect(() => {
    const url = `${API_BASE_URL}/agents/${encodeURIComponent(agentId)}/stream`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      let event: StreamEvent;
      try {
        event = JSON.parse(e.data) as StreamEvent;
      } catch {
        return;
      }
      if (event.type === "append") onAppend?.(event.entry);
      else if (event.type === "ephemeral") onEphemeral?.(event.payload);
    };

    if (onError) es.onerror = onError;

    return () => es.close();
  }, [agentId, onAppend, onEphemeral, onError]);
}
