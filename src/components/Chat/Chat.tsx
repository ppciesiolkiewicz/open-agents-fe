"use client";

import { useCallback, useRef, useState } from "react";
import { Spinner } from "@/ui/Spinner";
import type { ActivityLogEntry } from "@/sdk";
import { Composer } from "./components/Composer";
import { MessageList } from "./components/MessageList";
import { useAgentStream } from "./hooks/useAgentStream";
import { useEnqueueMessage } from "./hooks/useEnqueueMessage";
import { useMessages } from "./hooks/useMessages";
import type { EphemeralPayload, Message } from "./types";

export interface ChatProps {
  agentId: string;
}

const STREAMING_TICK_PREFIX = "stream:";

export function Chat({ agentId }: ChatProps) {
  const { messages, loading, error, refresh, upsertStreaming } =
    useMessages(agentId);
  const { enqueue, error: enqueueError } = useEnqueueMessage(agentId);

  const activeTickIdRef = useRef<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<string | null>(null);

  const handleAppend = useCallback(
    (entry: ActivityLogEntry) => {
      if (
        entry.type === "user_message" ||
        entry.type === "tick_end" ||
        entry.type === "llm_response" ||
        entry.type === "tool_result"
      ) {
        if (entry.type === "tick_end" && activeTickIdRef.current === entry.tickId) {
          activeTickIdRef.current = null;
        }
        refresh();
      }
      if (entry.type === "error") {
        setQueueStatus(`error: ${String(entry.payload?.message ?? "unknown")}`);
      }
    },
    [refresh],
  );

  const handleEphemeral = useCallback(
    (payload: EphemeralPayload) => {
      if (payload.type === "token") {
        const text = (payload as { text?: unknown }).text;
        if (typeof text !== "string") return;
        const tickId =
          activeTickIdRef.current ?? `${STREAMING_TICK_PREFIX}${Date.now()}`;
        if (!activeTickIdRef.current) activeTickIdRef.current = tickId;
        upsertStreaming(tickId, (prev) => appendToken(prev, tickId, text));
        return;
      }
      if (payload.type === "task_queued") {
        const position = (payload as { position?: unknown }).position;
        const n = typeof position === "number" ? position : 0;
        setQueueStatus(n > 0 ? `queued · #${n}` : "queued");
        return;
      }
      if (payload.type === "task_started") {
        setQueueStatus("running");
        return;
      }
      if (payload.type === "task_finished") {
        setQueueStatus(null);
        return;
      }
    },
    [upsertStreaming],
  );

  useAgentStream({ agentId, onAppend: handleAppend, onEphemeral: handleEphemeral });

  const handleSubmit = useCallback(
    (content: string) => {
      void enqueue(content);
    },
    [enqueue],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {queueStatus && (
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-1.5 text-xs text-zinc-500 dark:border-zinc-800">
          <Spinner size="sm" /> {queueStatus}
        </div>
      )}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-600">
          {error}
        </div>
      ) : (
        <MessageList
          messages={messages}
          emptyHint="Start the conversation below."
        />
      )}
      {enqueueError && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {enqueueError}
        </div>
      )}
      <Composer onSubmit={handleSubmit} disabled={loading} streaming={false} />
    </div>
  );
}

function appendToken(prev: Message | null, tickId: string, delta: string): Message {
  const now = Math.floor(Date.now() / 1000);
  if (!prev) {
    return {
      tickId,
      seq: 0,
      role: "assistant",
      content: delta,
      createdAt: now,
    };
  }
  return { ...prev, content: prev.content + delta };
}
