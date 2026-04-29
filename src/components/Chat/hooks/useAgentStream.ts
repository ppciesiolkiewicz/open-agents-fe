"use client";

import { useEffect } from "react";
import { API_BASE_URL, getApiAccessToken } from "@/lib/api";
import type { ActivityLogEntry } from "@/sdk";
import type { EphemeralPayload, StreamEvent } from "../types";

interface UseAgentStreamArgs {
  agentId: string;
  onAppend?: (entry: ActivityLogEntry) => void;
  onEphemeral?: (payload: EphemeralPayload) => void;
  onError?: (error: unknown) => void;
}

const RECONNECT_DELAY_MS = 3000;

export function useAgentStream({
  agentId,
  onAppend,
  onEphemeral,
  onError,
}: UseAgentStreamArgs): void {
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      while (!cancelled) {
        try {
          await runStream({
            agentId,
            signal: controller.signal,
            onAppend,
            onEphemeral,
          });
        } catch (e) {
          if (cancelled) return;
          if ((e as Error).name === "AbortError") return;
          onError?.(e);
        }
        if (cancelled) return;
        await delay(RECONNECT_DELAY_MS, controller.signal);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [agentId, onAppend, onEphemeral, onError]);
}

interface RunStreamArgs {
  agentId: string;
  signal: AbortSignal;
  onAppend?: (entry: ActivityLogEntry) => void;
  onEphemeral?: (payload: EphemeralPayload) => void;
}

async function runStream({
  agentId,
  signal,
  onAppend,
  onEphemeral,
}: RunStreamArgs) {
  const token = await getApiAccessToken();
  const headers: Record<string, string> = { Accept: "text/event-stream" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE_URL}/agents/${encodeURIComponent(agentId)}/stream`,
    { headers, signal },
  );
  if (!res.ok || !res.body) {
    throw new Error(`stream HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let idx = buffer.indexOf("\n\n");
      while (idx !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        dispatchFrame(frame, onAppend, onEphemeral);
        idx = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function dispatchFrame(
  frame: string,
  onAppend?: (entry: ActivityLogEntry) => void,
  onEphemeral?: (payload: EphemeralPayload) => void,
) {
  const dataLines = frame
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trimStart());
  if (dataLines.length === 0) return;
  let event: StreamEvent;
  try {
    event = JSON.parse(dataLines.join("\n")) as StreamEvent;
  } catch {
    return;
  }
  if (event.type === "append") onAppend?.(event.entry);
  else if (event.type === "ephemeral") onEphemeral?.(event.payload);
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}
