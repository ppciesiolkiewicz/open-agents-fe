"use client";

import type { ChatMessageViewToolCallsInner } from "@/sdk";

interface ToolCallBlockProps {
  call: ChatMessageViewToolCallsInner;
}

export function ToolCallBlock({ call }: ToolCallBlockProps) {
  let pretty = call.argumentsJson;
  try {
    pretty = JSON.stringify(JSON.parse(call.argumentsJson), null, 2);
  } catch {
    /* leave raw */
  }
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 font-mono font-medium text-zinc-600 dark:text-zinc-400">
        {call.name}
      </div>
      <pre className="whitespace-pre-wrap break-all font-mono text-zinc-700 dark:text-zinc-300">
        {pretty}
      </pre>
    </div>
  );
}
