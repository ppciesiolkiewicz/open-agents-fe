"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";

interface UseEnqueueMessageResult {
  enqueue: (content: string) => Promise<void>;
  enqueuing: boolean;
  error: string | null;
}

export function useEnqueueMessage(agentId: string): UseEnqueueMessageResult {
  const [enqueuing, setEnqueuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enqueue = useCallback(
    async (content: string) => {
      setEnqueuing(true);
      setError(null);
      try {
        await api.agentsIdMessagesPost({
          id: agentId,
          postMessageBody: { content },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send");
      } finally {
        setEnqueuing(false);
      }
    },
    [agentId],
  );

  return { enqueue, enqueuing, error };
}
