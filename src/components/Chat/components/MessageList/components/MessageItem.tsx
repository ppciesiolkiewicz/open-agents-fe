"use client";

import { cn } from "@/lib/cn";
import type { Message } from "../../../types";
import { ToolCallBlock } from "./ToolCallBlock";

interface MessageItemProps {
  message: Message;
}

const ROLE_LABEL: Record<Message["role"], string> = {
  user: "You",
  assistant: "Agent",
  tool: "Tool",
};

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

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
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
            : isTool
              ? "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
              : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50",
        )}
      >
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {message.toolCalls.map((c) => (
              <ToolCallBlock key={c.id} call={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
