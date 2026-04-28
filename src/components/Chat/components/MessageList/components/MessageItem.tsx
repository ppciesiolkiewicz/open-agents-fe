"use client";

import { cn } from "@/lib/cn";
import type { Message } from "../../../types";
import { ToolCallDisplay } from "./ToolCallDisplay";

interface MessageItemProps {
  message: Message;
  resultsByCallId?: Map<string, string>;
}

const ROLE_LABEL: Record<Message["role"], string> = {
  user: "You",
  assistant: "Agent",
  tool: "Tool",
};

export function MessageItem({ message, resultsByCallId }: MessageItemProps) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  const hasToolCalls = !!message.toolCalls && message.toolCalls.length > 0;
  const hasContent = !!message.content;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {ROLE_LABEL[message.role]}
      </span>
      <div
        className={cn(
          "max-w-[85%] rounded-lg text-sm",
          hasContent || !hasToolCalls ? "px-3 py-2" : "p-2",
          isUser
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
            : isTool
              ? "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
              : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50",
        )}
      >
        {hasContent && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        {hasToolCalls && (
          <div className={cn("flex flex-col gap-2", hasContent && "mt-2")}>
            {message.toolCalls!.map((c) => (
              <ToolCallDisplay
                key={c.id}
                call={c}
                resultJson={resultsByCallId?.get(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
