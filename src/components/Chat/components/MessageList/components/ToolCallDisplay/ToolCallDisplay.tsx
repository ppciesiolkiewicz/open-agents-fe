"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ChatMessageViewToolCallsInner } from "@/sdk";
import { safeParseJson } from "./formatters";
import { TOOL_RENDERERS } from "./renderers";

export interface ToolCallDisplayProps {
  call: ChatMessageViewToolCallsInner;
  resultJson?: string;
}

export function ToolCallDisplay({ call, resultJson }: ToolCallDisplayProps) {
  const [showRaw, setShowRaw] = useState(false);
  const renderer = TOOL_RENDERERS[call.name];

  const args = safeParseJson<Record<string, unknown>>(call.argumentsJson);
  const result = safeParseJson<unknown>(resultJson);
  const hasResult = resultJson !== undefined;

  const friendly = renderer ? renderer({ args, result, hasResult }) : null;

  return (
    <div className="rounded-md border border-zinc-200 bg-white/60 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-mono font-medium text-zinc-700 dark:text-zinc-200">
          {call.name}
        </span>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="cursor-pointer text-[10px] uppercase tracking-wide text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          {showRaw ? "hide raw" : "raw"}
        </button>
      </div>
      {friendly ? (
        <div className="text-zinc-800 dark:text-zinc-100">{friendly}</div>
      ) : (
        <FallbackView args={args} result={result} hasResult={hasResult} rawArgs={call.argumentsJson} rawResult={resultJson} />
      )}
      {showRaw && (
        <RawView rawArgs={call.argumentsJson} rawResult={resultJson} />
      )}
    </div>
  );
}

function FallbackView({
  args,
  result,
  hasResult,
  rawArgs,
  rawResult,
}: {
  args: unknown;
  result: unknown;
  hasResult: boolean;
  rawArgs: string;
  rawResult: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Section label="args">
        {prettyOrRaw(args, rawArgs)}
      </Section>
      {hasResult && (
        <Section label="result">
          {prettyOrRaw(result, rawResult ?? "")}
        </Section>
      )}
      {!hasResult && (
        <span className="text-zinc-400 italic">awaiting result…</span>
      )}
    </div>
  );
}

function RawView({
  rawArgs,
  rawResult,
}: {
  rawArgs: string;
  rawResult: string | undefined;
}) {
  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
      <Section label="args (raw)">
        <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
          {prettyJsonString(rawArgs)}
        </pre>
      </Section>
      {rawResult !== undefined && (
        <Section label="result (raw)">
          <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
            {prettyJsonString(rawResult)}
          </pre>
        </Section>
      )}
    </div>
  );
}

function Section({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function prettyJsonString(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function prettyOrRaw(value: unknown, raw: string): React.ReactNode {
  if (value === undefined) {
    return raw ? (
      <span className="font-mono break-all text-zinc-700 dark:text-zinc-200">
        {raw}
      </span>
    ) : (
      <span className="text-zinc-400">—</span>
    );
  }
  if (value && typeof value === "object" && Object.keys(value as object).length === 0) {
    return <span className="text-zinc-400">{Array.isArray(value) ? "[]" : "{}"}</span>;
  }
  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-zinc-700 dark:text-zinc-200">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
