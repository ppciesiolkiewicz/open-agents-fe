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
  const [open, setOpen] = useState(false);
  const renderer = TOOL_RENDERERS[call.name];

  const args = safeParseJson<Record<string, unknown>>(call.argumentsJson);
  const result = safeParseJson<unknown>(resultJson);
  const hasResult = resultJson !== undefined;

  const friendly = renderer ? renderer({ args, result, hasResult }) : null;

  return (
    <div className="rounded-md border border-zinc-200 bg-white/60 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="font-mono text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
          {call.name}
        </span>
        {!hasResult && (
          <span className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
            running
          </span>
        )}
        <div className="ml-auto" />
      </div>
      {friendly ? (
        <div className="px-2 pb-2 text-zinc-800 dark:text-zinc-100">
          {friendly}
        </div>
      ) : (
        <GenericPropsView args={args} result={result} hasResult={hasResult} />
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-1 border-t border-zinc-200 px-2 py-1 text-left text-[10px] uppercase tracking-wide text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-800 dark:hover:bg-zinc-800/40 dark:hover:text-zinc-200"
      >
        <Chevron open={open} />
        <span>{open ? "hide JSON" : "show JSON"}</span>
      </button>
      {open && <RawView rawArgs={call.argumentsJson} rawResult={resultJson} />}
    </div>
  );
}

function GenericPropsView({
  args,
  result,
  hasResult,
}: {
  args: Record<string, unknown> | undefined;
  result: unknown;
  hasResult: boolean;
}) {
  const argEntries = args ? Object.entries(args) : [];
  return (
    <div className="flex flex-col gap-2 px-2 pb-2">
      <PropGroup label="args" entries={argEntries} emptyHint="—" />
      {hasResult ? (
        <PropGroup label="result" value={result} />
      ) : (
        <span className="text-[11px] text-zinc-400 italic">awaiting result…</span>
      )}
    </div>
  );
}

function PropGroup({
  label,
  entries,
  value,
  emptyHint,
}: {
  label: string;
  entries?: Array<[string, unknown]>;
  value?: unknown;
  emptyHint?: string;
}) {
  const isEntries = entries !== undefined;
  const resolvedEntries = isEntries
    ? entries
    : valueToEntries(value);
  const isPrimitiveValue = !isEntries && resolvedEntries === null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {isPrimitiveValue ? (
        <div className="font-mono text-[11px] break-all text-zinc-800 dark:text-zinc-100">
          {formatPrimitive(value)}
        </div>
      ) : !resolvedEntries || resolvedEntries.length === 0 ? (
        <span className="font-mono text-[11px] text-zinc-500">
          {emptyHint ?? "—"}
        </span>
      ) : (
        <div className="flex flex-col gap-1 rounded border border-zinc-200 bg-white/40 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/40">
          {resolvedEntries.map(([k, v]) => (
            <PropRow key={k} propKey={k} propValue={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropRow({ propKey, propValue }: { propKey: string; propValue: unknown }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {propKey}
      </span>
      <PropValue value={propValue} />
    </div>
  );
}

function PropValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="font-mono text-[11px] text-zinc-500">—</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="font-mono text-[11px] text-zinc-500">[] empty</span>
      );
    }
    return (
      <ul className="flex flex-col gap-1">
        {value.map((item, idx) => (
          <li
            key={idx}
            className="rounded border border-zinc-200 bg-white/60 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900/60"
          >
            {isPlainObject(item) ? (
              <NestedObject obj={item as Record<string, unknown>} />
            ) : (
              <span className="font-mono text-[11px] break-all text-zinc-800 dark:text-zinc-100">
                {formatPrimitive(item)}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (isPlainObject(value)) {
    return <NestedObject obj={value as Record<string, unknown>} />;
  }
  return (
    <span className="font-mono text-[11px] break-all text-zinc-800 dark:text-zinc-100">
      {formatPrimitive(value)}
    </span>
  );
}

function NestedObject({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return <span className="font-mono text-[11px] text-zinc-500">{"{}"}</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-wrap items-baseline gap-2">
          <span className="text-[10px] text-zinc-500">{k}:</span>
          {Array.isArray(v) || isPlainObject(v) ? (
            <div className="basis-full">
              <PropValue value={v} />
            </div>
          ) : (
            <span className="font-mono text-[11px] break-all text-zinc-800 dark:text-zinc-100">
              {formatPrimitive(v)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function valueToEntries(value: unknown): Array<[string, unknown]> | null {
  if (isPlainObject(value)) return Object.entries(value);
  if (Array.isArray(value)) return value.map((v, i) => [String(i), v]);
  return null;
}

function formatPrimitive(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function RawView({
  rawArgs,
  rawResult,
}: {
  rawArgs: string;
  rawResult: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50/60 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950/40">
      <Section label="args">
        <Pre>{prettyJsonString(rawArgs)}</Pre>
      </Section>
      {rawResult !== undefined && (
        <Section label="result">
          <Pre>{prettyJsonString(rawResult)}</Pre>
        </Section>
      )}
    </div>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[10px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      {children}
    </pre>
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
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={cn("transition-transform", open && "rotate-90")}
    >
      <path
        d="M4.5 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function prettyJsonString(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
