import type { ReactNode } from "react";
import { Badge } from "@/ui/Badge";
import {
  formatTimestamp,
  formatTokenAmount,
  formatUSD,
  formatWei,
  truncateAddress,
} from "./formatters";

export interface ToolRendererInput {
  args: Record<string, unknown> | undefined;
  result: unknown | undefined;
  hasResult: boolean;
}

export type ToolRenderer = (input: ToolRendererInput) => ReactNode;

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {label}
    </span>
    <span className="font-mono text-zinc-800 dark:text-zinc-100">{children}</span>
  </div>
);

const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">{children}</div>
);

const Pending = () => (
  <span className="text-zinc-400 italic">awaiting result…</span>
);

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}
function asArray(v: unknown): unknown[] | undefined {
  return Array.isArray(v) ? v : undefined;
}

const fetchTokenPriceUSD: ToolRenderer = ({ args, result, hasResult }) => {
  const symbol = asString(args?.symbol) ?? "?";
  const r = asObject(result);
  const price = r ? asNumber(r.priceUSD) : undefined;
  return (
    <Row>
      <Field label="symbol">{symbol}</Field>
      <Field label="price">
        {hasResult ? (price !== undefined ? formatUSD(price) : "?") : <Pending />}
      </Field>
    </Row>
  );
};

const fetchTokenInfoBySymbol: ToolRenderer = ({ args, result, hasResult }) => {
  const symbol = asString(args?.symbol) ?? "?";
  const r = asObject(result);
  return (
    <Row>
      <Field label="symbol">{symbol}</Field>
      {hasResult ? (
        r ? (
          <>
            <Field label="name">{asString(r.name) ?? "?"}</Field>
            {asString(r.slug) && <Field label="slug">{asString(r.slug)}</Field>}
            {asNumber(r.id) !== undefined && <Field label="id">{asNumber(r.id)}</Field>}
          </>
        ) : (
          <span className="text-zinc-500">no info</span>
        )
      ) : (
        <Pending />
      )}
    </Row>
  );
};

const getNativeBalance: ToolRenderer = ({ result, hasResult }) => {
  const r = asObject(result);
  const raw = r ? asString(r.raw) : undefined;
  const unit = r ? asString(r.unit) : undefined;
  return (
    <Row>
      {hasResult ? (
        raw !== undefined ? (
          <>
            <Field label="balance">
              {unit === "wei" ? formatWei(raw) : `${formatTokenAmount(raw)} ${unit ?? ""}`.trim()}
            </Field>
            {unit === "wei" && (
              <span className="text-[10px] text-zinc-400">({raw} wei)</span>
            )}
          </>
        ) : (
          <span className="text-zinc-500">no balance</span>
        )
      ) : (
        <Pending />
      )}
    </Row>
  );
};

const getTokenBalance: ToolRenderer = ({ args, result, hasResult }) => {
  const addr = asString(args?.tokenAddress) ?? "?";
  const r = asObject(result);
  const raw = r ? asString(r.raw) : undefined;
  return (
    <Row>
      <Field label="token">
        <span title={addr}>{truncateAddress(addr)}</span>
      </Field>
      <Field label="raw">
        {hasResult ? (raw !== undefined ? formatTokenAmount(raw) : "?") : <Pending />}
      </Field>
    </Row>
  );
};

interface MemoryEntry {
  id?: string;
  tickId?: string;
  type?: string;
  content?: string;
  createdAt?: number;
}

const readMemory: ToolRenderer = ({ args, result, hasResult }) => {
  const limit = asNumber(args?.recentEntries);
  if (!hasResult) {
    return (
      <Row>
        {limit !== undefined && <Field label="limit">{limit}</Field>}
        <Pending />
      </Row>
    );
  }
  const r = asObject(result);
  if (!r) return <span className="text-zinc-500">empty</span>;

  const state = asObject(r.state);
  const notes = asString(r.notes) ?? "";
  const entries = (asArray(r.recentEntries) ?? []) as MemoryEntry[];

  const stateKeys = state ? Object.keys(state) : [];
  return (
    <div className="flex flex-col gap-2">
      <Row>
        <Field label="state">
          {stateKeys.length === 0 ? "—" : `${stateKeys.length} key${stateKeys.length === 1 ? "" : "s"}`}
        </Field>
        <Field label="notes">{notes ? `${notes.length} chars` : "—"}</Field>
        <Field label="entries">{entries.length}</Field>
      </Row>
      {stateKeys.length > 0 && state && (
        <div className="rounded border border-zinc-200 bg-white/40 px-2 py-1 text-[11px] dark:border-zinc-700 dark:bg-zinc-900/40">
          {stateKeys.map((k) => (
            <div key={k} className="flex gap-2">
              <span className="text-zinc-500">{k}:</span>
              <span className="font-mono break-all text-zinc-800 dark:text-zinc-100">
                {JSON.stringify(state[k])}
              </span>
            </div>
          ))}
        </div>
      )}
      {entries.length > 0 && (
        <ul className="flex flex-col gap-1">
          {entries.map((e, i) => (
            <li
              key={e.id ?? i}
              className="rounded border border-zinc-200 bg-white/40 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900/40"
            >
              <div className="flex items-center gap-2">
                {e.type && (
                  <Badge tone={e.type === "snapshot" ? "info" : "neutral"}>
                    {e.type}
                  </Badge>
                )}
                {e.createdAt && (
                  <span className="text-[10px] text-zinc-500">
                    {formatTimestamp(e.createdAt)}
                  </span>
                )}
              </div>
              {e.content && (
                <p className="mt-0.5 break-words text-zinc-800 dark:text-zinc-100">
                  {e.content}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const saveMemoryEntry: ToolRenderer = ({ args, result, hasResult }) => {
  const content = asString(args?.content) ?? "";
  const type = asString(args?.type);
  const r = asObject(result);
  const ok = r ? r.ok === true : undefined;
  const total = r ? asNumber(r.totalEntries) : undefined;
  return (
    <div className="flex flex-col gap-1">
      <Row>
        {type && (
          <Badge tone={type === "snapshot" ? "info" : "neutral"}>{type}</Badge>
        )}
        {hasResult ? (
          ok ? (
            <Badge tone="success">saved</Badge>
          ) : (
            <Badge tone="warning">failed</Badge>
          )
        ) : (
          <Pending />
        )}
        {total !== undefined && <Field label="total">{total}</Field>}
      </Row>
      {content && (
        <p className="break-words text-zinc-800 dark:text-zinc-100">{content}</p>
      )}
    </div>
  );
};

const updateMemory: ToolRenderer = ({ args, result, hasResult }) => {
  const state = asObject(args?.state);
  const appendNote = asString(args?.appendNote);
  const r = asObject(result);
  const ok = r ? r.ok === true : undefined;
  const stateKeys = r ? asNumber(r.stateKeys) : undefined;
  const notesChars = r ? asNumber(r.notesChars) : undefined;
  return (
    <div className="flex flex-col gap-1">
      <Row>
        {hasResult ? (
          ok ? (
            <Badge tone="success">updated</Badge>
          ) : (
            <Badge tone="warning">failed</Badge>
          )
        ) : (
          <Pending />
        )}
        {stateKeys !== undefined && <Field label="stateKeys">{stateKeys}</Field>}
        {notesChars !== undefined && <Field label="notesChars">{notesChars}</Field>}
      </Row>
      {state && Object.keys(state).length > 0 && (
        <div className="rounded border border-zinc-200 bg-white/40 px-2 py-1 text-[11px] dark:border-zinc-700 dark:bg-zinc-900/40">
          {Object.entries(state).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-zinc-500">{k}:</span>
              <span className="font-mono break-all text-zinc-800 dark:text-zinc-100">
                {JSON.stringify(v)}
              </span>
            </div>
          ))}
        </div>
      )}
      {appendNote && (
        <p className="break-words text-zinc-800 italic dark:text-zinc-100">
          + {appendNote}
        </p>
      )}
    </div>
  );
};

export const TOOL_RENDERERS: Record<string, ToolRenderer> = {
  fetchTokenPriceUSD,
  fetchTokenInfoBySymbol,
  getNativeBalance,
  getTokenBalance,
  readMemory,
  saveMemoryEntry,
  updateMemory,
};
