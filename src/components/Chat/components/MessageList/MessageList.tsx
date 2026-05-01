"use client";

import { useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "@/ui/ScrollArea";
import type { Message } from "../../types";
import { MessageItem } from "./components/MessageItem";

export interface MessageListProps {
  messages: Message[];
  emptyHint?: string;
}

export function MessageList({ messages, emptyHint }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const { renderable, resultsByCallId } = useMemo(() => {
    const resultsByCallId = new Map<string, string>();
    for (const m of messages) {
      if (m.role === "tool" && m.toolCallId) {
        resultsByCallId.set(m.toolCallId, m.content);
      }
    }
    const renderable = messages.filter(
      (m) => !(m.role === "tool" && m.toolCallId && resultsByCallId.has(m.toolCallId)),
    );
    return { renderable, resultsByCallId };
  }, [messages]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const thresholdPx = 40;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
      stickToBottomRef.current = distanceFromBottom <= thresholdPx;
    };
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    if (!stickToBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">
        {emptyHint ?? "No messages yet."}
      </div>
    );
  }

  return (
    <ScrollArea ref={viewportRef} className="flex-1">
      <div className="flex flex-col gap-4 p-4">
        {renderable.map((m) => (
          <MessageItem
            key={`${m.tickId}:${m.seq}`}
            message={m}
            resultsByCallId={resultsByCallId}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
