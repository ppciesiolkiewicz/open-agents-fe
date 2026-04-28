# Agent config + creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a gear-icon Edit dialog in the chat view and a "+ New agent" Create dialog on the agents list, both backed by the existing PATCH/POST endpoints.

**Architecture:** Three new UI atoms (`Dialog`, `Field`, `NumberInput`) plus one icon. Two new domain folders, `AgentEditDialog/` and `AgentCreateDialog/`, each owning their open state, form, validation function, and mutation hook. Each dialog renders inside its trigger's parent (chat page header for edit; agents page header for create).

**Tech Stack:** React 19, Next 16 App Router, Tailwind v4, `@radix-ui/react-dialog` (new dep), generated `typescript-fetch` SDK in `src/sdk/`.

**Spec:** [docs/superpowers/specs/2026-04-28-agent-config-and-creation-design.md](../specs/2026-04-28-agent-config-and-creation-design.md)

**Note on testing:** Project has no test runner. Per the spec, verification is manual (browser smoke + `tsc` + `eslint`). Each task ends with the same verification trio rather than `pytest`-style failing-test cycles.

---

## Task 1: Install `@radix-ui/react-dialog`

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the dep**

Run: `npm install @radix-ui/react-dialog`
Expected: package.json and package-lock.json updated; no audit errors that affect this dep.

- [ ] **Step 2: Sanity check**

Run: `npx tsc --noEmit`
Expected: clean (no new errors).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @radix-ui/react-dialog for the upcoming Dialog atom"
```

---

## Task 2: Add the `Dialog` atom

**Files:**
- Create: `src/ui/Dialog/Dialog.tsx`
- Create: `src/ui/Dialog/index.ts`

- [ ] **Step 1: Write `Dialog.tsx`**

```tsx
"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-zinc-200 bg-white p-5 shadow-xl outline-none",
            "dark:border-zinc-800 dark:bg-zinc-950",
            "max-h-[90dvh] overflow-y-auto",
            className,
          )}
        >
          <div className="mb-4 flex flex-col gap-1">
            <RadixDialog.Title className="text-base font-semibold">
              {title}
            </RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "mt-5 flex items-center justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export {
  Dialog,
  DialogFooter,
  type DialogProps,
  type DialogFooterProps,
} from "./Dialog";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Dialog
git commit -m "feat(ui): add Dialog atom wrapping Radix Dialog"
```

---

## Task 3: Add the `Field` atom

**Files:**
- Create: `src/ui/Field/Field.tsx`
- Create: `src/ui/Field/index.ts`

- [ ] **Step 1: Write `Field.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  error,
  helper,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : helper ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helper}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export { Field, type FieldProps } from "./Field";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Field
git commit -m "feat(ui): add Field atom for labelled inputs with helper/error"
```

---

## Task 4: Add the `NumberInput` atom

**Files:**
- Create: `src/ui/NumberInput/NumberInput.tsx`
- Create: `src/ui/NumberInput/index.ts`

- [ ] **Step 1: Write `NumberInput.tsx`**

```tsx
"use client";

import { forwardRef, type ChangeEvent } from "react";
import { Input } from "@/ui/Input";

export interface NumberInputProps {
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  className?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    { value, onChange, min, max, step, ...rest },
    ref,
  ) {
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;
      if (raw === "") {
        onChange(null);
        return;
      }
      const parsed = Number(raw);
      onChange(Number.isFinite(parsed) ? parsed : null);
    }

    return (
      <Input
        ref={ref}
        type="number"
        value={value === null ? "" : String(value)}
        onChange={handleChange}
        min={min as unknown as undefined /* keep typing simple */}
        max={max as unknown as undefined}
        step={step as unknown as undefined}
        {...rest}
      />
    );
  },
);
```

Note: the `min`/`max`/`step` casts work around our `Input` atom's narrow prop subset. If the existing `InputProps` should add `min`/`max`/`step` natively instead, do that here and drop the casts.

- [ ] **Step 2: Check `Input` atom prop surface**

Read: `src/ui/Input/Input.tsx`

If `InputProps` does not include `min`, `max`, `step`, add them to the
`Pick` list. Then drop the casts from `NumberInput.tsx` (use the props directly).

- [ ] **Step 3: Write `index.ts`**

```ts
export { NumberInput, type NumberInputProps } from "./NumberInput";
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/ui/NumberInput src/ui/Input
git commit -m "feat(ui): add NumberInput atom that emits number | null"
```

---

## Task 5: Add `GearIcon`

**Files:**
- Modify: `src/ui/icons/icons.tsx`
- Modify: `src/ui/icons/index.ts`

- [ ] **Step 1: Append `GearIcon` to `icons.tsx`**

Add this export after `StopIcon`:

```tsx
export function GearIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
      <path d="M7.05 1.5a.5.5 0 0 0-.495.43l-.16 1.117a5.51 5.51 0 0 0-1.05.61l-1.05-.42a.5.5 0 0 0-.61.214L2.652 4.74a.5.5 0 0 0 .115.638l.892.71a5.55 5.55 0 0 0 0 1.224l-.892.71a.5.5 0 0 0-.115.638l1.033 1.79a.5.5 0 0 0 .61.213l1.05-.42c.32.245.673.45 1.05.61l.16 1.117a.5.5 0 0 0 .495.43h2.066a.5.5 0 0 0 .495-.43l.16-1.117c.377-.16.73-.365 1.05-.61l1.05.42a.5.5 0 0 0 .61-.214l1.033-1.79a.5.5 0 0 0-.115-.637l-.892-.71a5.55 5.55 0 0 0 0-1.224l.892-.71a.5.5 0 0 0 .115-.638L13.31 3.45a.5.5 0 0 0-.61-.213l-1.05.42a5.51 5.51 0 0 0-1.05-.61l-.16-1.117a.5.5 0 0 0-.495-.43H7.05z" />
    </svg>
  );
}
```

- [ ] **Step 2: Re-export from `index.ts`**

Replace the export line with:

```ts
export { PlayIcon, StopIcon, GearIcon } from "./icons";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/ui/icons
git commit -m "feat(ui): add GearIcon"
```

---

## Task 6: `useUpdateAgent` hook

**Files:**
- Create: `src/components/AgentEditDialog/hooks/useUpdateAgent.ts`

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { AgentConfig, UpdateAgentBody } from "@/sdk";

interface UseUpdateAgentResult {
  update: (body: UpdateAgentBody) => Promise<AgentConfig | null>;
  saving: boolean;
  error: string | null;
}

export function useUpdateAgent(agentId: string): UseUpdateAgentResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (body: UpdateAgentBody): Promise<AgentConfig | null> => {
      setSaving(true);
      setError(null);
      try {
        return await api.agentsIdPatch({ id: agentId, updateAgentBody: body });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save agent");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [agentId],
  );

  return { update, saving, error };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/AgentEditDialog/hooks
git commit -m "feat(agents): useUpdateAgent hook for PATCH /agents/:id"
```

---

## Task 7: `AgentEditForm` (form + validation)

**Files:**
- Create: `src/components/AgentEditDialog/components/AgentEditForm/AgentEditForm.tsx`
- Create: `src/components/AgentEditDialog/components/AgentEditForm/index.ts`

- [ ] **Step 1: Write `AgentEditForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/ui/Button";
import { DialogFooter } from "@/ui/Dialog";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { NumberInput } from "@/ui/NumberInput";
import { Textarea } from "@/ui/Textarea";
import type { AgentConfig, UpdateAgentBody } from "@/sdk";

export interface AgentEditFormProps {
  agent: AgentConfig;
  onSubmit: (body: UpdateAgentBody) => void;
  onCancel: () => void;
  saving?: boolean;
  serverError?: string | null;
}

interface FormState {
  name: string;
  prompt: string;
  maxTradeUSD: number | null;
  maxSlippageBps: number | null;
  intervalMs: number | null;
}

interface FormErrors {
  name?: string;
  prompt?: string;
  maxTradeUSD?: string;
  maxSlippageBps?: string;
  intervalMs?: string;
}

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!state.name.trim()) errors.name = "Required";
  if (!state.prompt.trim()) errors.prompt = "Required";
  if (state.maxTradeUSD === null || state.maxTradeUSD <= 0)
    errors.maxTradeUSD = "Must be greater than 0";
  if (
    state.maxSlippageBps === null ||
    !Number.isInteger(state.maxSlippageBps) ||
    state.maxSlippageBps < 0 ||
    state.maxSlippageBps > 10000
  )
    errors.maxSlippageBps = "Integer between 0 and 10000";
  if (
    state.intervalMs !== null &&
    (!Number.isInteger(state.intervalMs) || state.intervalMs < 1000)
  )
    errors.intervalMs = "Integer ≥ 1000ms or empty";
  return errors;
}

export function AgentEditForm({
  agent,
  onSubmit,
  onCancel,
  saving,
  serverError,
}: AgentEditFormProps) {
  const [state, setState] = useState<FormState>({
    name: agent.name,
    prompt: agent.prompt,
    maxTradeUSD: agent.riskLimits.maxTradeUSD,
    maxSlippageBps: agent.riskLimits.maxSlippageBps,
    intervalMs: agent.intervalMs ?? null,
  });
  const errors = validate(state);
  const hasErrors = Object.keys(errors).length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (hasErrors || saving) return;
    onSubmit({
      name: state.name.trim(),
      prompt: state.prompt.trim(),
      riskLimits: {
        maxTradeUSD: state.maxTradeUSD!,
        maxSlippageBps: state.maxSlippageBps!,
      },
      intervalMs: state.intervalMs ?? undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Name" htmlFor="agent-name" error={errors.name}>
        <Input
          id="agent-name"
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          disabled={saving}
        />
      </Field>

      <Field label="Prompt" htmlFor="agent-prompt" error={errors.prompt}>
        <Textarea
          id="agent-prompt"
          rows={5}
          value={state.prompt}
          onChange={(e) => setState((s) => ({ ...s, prompt: e.target.value }))}
          disabled={saving}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Max trade (USD)"
          htmlFor="agent-max-trade"
          error={errors.maxTradeUSD}
        >
          <NumberInput
            id="agent-max-trade"
            value={state.maxTradeUSD}
            onChange={(v) => setState((s) => ({ ...s, maxTradeUSD: v }))}
            min={0.01}
            step={0.01}
            disabled={saving}
          />
        </Field>
        <Field
          label="Max slippage (bps)"
          htmlFor="agent-slippage"
          error={errors.maxSlippageBps}
        >
          <NumberInput
            id="agent-slippage"
            value={state.maxSlippageBps}
            onChange={(v) => setState((s) => ({ ...s, maxSlippageBps: v }))}
            min={0}
            max={10000}
            step={1}
            disabled={saving}
          />
        </Field>
      </div>

      <Field
        label="Interval (ms) — leave empty for chat-only"
        htmlFor="agent-interval"
        error={errors.intervalMs}
      >
        <NumberInput
          id="agent-interval"
          value={state.intervalMs}
          onChange={(v) => setState((s) => ({ ...s, intervalMs: v }))}
          min={1000}
          step={1000}
          disabled={saving}
        />
      </Field>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {serverError}
        </p>
      )}

      <DialogFooter>
        <Button variant="ghost" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={hasErrors || saving}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export { AgentEditForm, type AgentEditFormProps } from "./AgentEditForm";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/AgentEditDialog/components
git commit -m "feat(agents): AgentEditForm with inline validation"
```

---

## Task 8: `AgentEditDialog`

**Files:**
- Create: `src/components/AgentEditDialog/AgentEditDialog.tsx`
- Create: `src/components/AgentEditDialog/index.ts`

- [ ] **Step 1: Write `AgentEditDialog.tsx`**

```tsx
"use client";

import { Dialog } from "@/ui/Dialog";
import type { AgentConfig } from "@/sdk";
import { AgentEditForm } from "./components/AgentEditForm";
import { useUpdateAgent } from "./hooks/useUpdateAgent";

export interface AgentEditDialogProps {
  agent: AgentConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (next: AgentConfig) => void;
}

export function AgentEditDialog({
  agent,
  open,
  onOpenChange,
  onSaved,
}: AgentEditDialogProps) {
  const { update, saving, error } = useUpdateAgent(agent.id);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit agent"
      description={agent.name}
    >
      <AgentEditForm
        agent={agent}
        saving={saving}
        serverError={error}
        onCancel={() => onOpenChange(false)}
        onSubmit={async (body) => {
          const next = await update(body);
          if (next) {
            onSaved(next);
            onOpenChange(false);
          }
        }}
      />
    </Dialog>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export {
  AgentEditDialog,
  type AgentEditDialogProps,
} from "./AgentEditDialog";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/AgentEditDialog
git commit -m "feat(agents): AgentEditDialog wires form + update hook into Dialog"
```

---

## Task 9: Wire gear button into chat header

**Files:**
- Modify: `src/app/agents/[id]/page.tsx`

- [ ] **Step 1: Update the page**

Read the current file first, then replace the body so it adds dialog open state and renders the gear `IconButton` immediately before `AgentRunControl`. The full updated file:

```tsx
"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import { AgentRunControl } from "@/components/AgentRunControl";
import { Chat } from "@/components/Chat";
import { api } from "@/lib/api";
import type { AgentConfig } from "@/sdk";
import { IconButton } from "@/ui/IconButton";
import { GearIcon } from "@/ui/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentChatPage({ params }: PageProps) {
  const { id } = use(params);
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .agentsIdGet({ id })
      .then((a) => {
        if (!cancelled) setAgent(a);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load agent");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex h-dvh w-full flex-col">
      <nav className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800">
        <Link
          href="/agents"
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Agents
        </Link>
        {agent && (
          <span className="truncate text-zinc-400">/ {agent.name}</span>
        )}
        {error && <span className="text-red-600">{error}</span>}
        <div className="flex-1" />
        {agent && (
          <>
            <IconButton
              aria-label="Edit agent"
              icon={<GearIcon />}
              size="sm"
              onClick={() => setEditOpen(true)}
            />
            <AgentRunControl agent={agent} onChange={setAgent} />
          </>
        )}
      </nav>
      <div className="flex min-h-0 flex-1">
        <Chat agentId={id} agentName={agent?.name} />
      </div>
      {agent && (
        <AgentEditDialog
          agent={agent}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={setAgent}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 3: Manual smoke**

Start the dev server (`npm run dev`, port 3001) if not already running. With the agent-loop API on :3000:

1. Visit http://localhost:3001/agents and click any agent.
2. In the chat header, click the gear → dialog opens with current values.
3. Change the prompt, click Save → dialog closes; chat header still shows agent name (or new name if changed); reload preserves the change.
4. Re-open the gear, clear `name`, observe Save disabled.
5. Re-open the gear, type non-numeric in slippage, observe inline error.
6. Re-open the gear, press Esc → closes without saving.

- [ ] **Step 4: Commit**

```bash
git add src/app/agents/[id]/page.tsx
git commit -m "feat(agents): gear icon in chat header opens AgentEditDialog"
```

---

## Task 10: `useCreateAgent` hook

**Files:**
- Create: `src/components/AgentCreateDialog/hooks/useCreateAgent.ts`

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { AgentConfig, AgentsPostRequest } from "@/sdk";

interface UseCreateAgentResult {
  create: (body: AgentsPostRequest) => Promise<AgentConfig | null>;
  creating: boolean;
  error: string | null;
}

export function useCreateAgent(): UseCreateAgentResult {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (body: AgentsPostRequest): Promise<AgentConfig | null> => {
      setCreating(true);
      setError(null);
      try {
        return await api.agentsPost({ agentsPostRequest: body });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create agent");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  return { create, creating, error };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/AgentCreateDialog/hooks
git commit -m "feat(agents): useCreateAgent hook for POST /agents"
```

---

## Task 11: `SeedBalancesEditor`

**Files:**
- Create: `src/components/AgentCreateDialog/components/AgentCreateForm/components/SeedBalancesEditor/SeedBalancesEditor.tsx`
- Create: `src/components/AgentCreateDialog/components/AgentCreateForm/components/SeedBalancesEditor/index.ts`

- [ ] **Step 1: Write `SeedBalancesEditor.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export interface SeedBalancesEditorProps {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  error?: string;
  disabled?: boolean;
}

interface Row {
  id: number;
  token: string;
  amount: string;
}

let nextId = 0;

function rowsFromValue(value: Record<string, string>): Row[] {
  return Object.entries(value).map(([token, amount]) => ({
    id: nextId++,
    token,
    amount,
  }));
}

function rowsToValue(rows: Row[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    if (r.token.trim()) out[r.token.trim()] = r.amount;
  }
  return out;
}

export function SeedBalancesEditor({
  value,
  onChange,
  error,
  disabled,
}: SeedBalancesEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => rowsFromValue(value));

  function emit(next: Row[]) {
    setRows(next);
    onChange(rowsToValue(next));
  }

  function update(id: number, patch: Partial<Row>) {
    emit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: number) {
    emit(rows.filter((r) => r.id !== id));
  }

  function add() {
    emit([...rows, { id: nextId++, token: "", amount: "" }]);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Seed balances
      </div>
      {rows.length === 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No balances. Add a row to seed the dry-run wallet.
        </p>
      )}
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[2fr_3fr_auto] gap-2">
          <Input
            value={row.token}
            placeholder="Token (e.g. USDC)"
            onChange={(e) => update(row.id, { token: e.target.value })}
            disabled={disabled}
            aria-label="Token"
          />
          <Input
            value={row.amount}
            placeholder="Amount"
            onChange={(e) => update(row.id, { amount: e.target.value })}
            disabled={disabled}
            aria-label="Amount"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(row.id)}
            disabled={disabled}
            aria-label="Remove row"
          >
            ×
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={add}
        disabled={disabled}
        className="self-start"
      >
        + Add balance
      </Button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export {
  SeedBalancesEditor,
  type SeedBalancesEditorProps,
} from "./SeedBalancesEditor";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/AgentCreateDialog/components/AgentCreateForm/components
git commit -m "feat(agents): SeedBalancesEditor key-value rows for dry-run seeds"
```

---

## Task 12: `AgentCreateForm` (form + validation)

**Files:**
- Create: `src/components/AgentCreateDialog/components/AgentCreateForm/AgentCreateForm.tsx`
- Create: `src/components/AgentCreateDialog/components/AgentCreateForm/index.ts`

- [ ] **Step 1: Write `AgentCreateForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/ui/Button";
import { DialogFooter } from "@/ui/Dialog";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { NumberInput } from "@/ui/NumberInput";
import { Textarea } from "@/ui/Textarea";
import type { AgentsPostRequest } from "@/sdk";
import { SeedBalancesEditor } from "./components/SeedBalancesEditor";

export interface AgentCreateFormProps {
  onSubmit: (body: AgentsPostRequest) => void;
  onCancel: () => void;
  creating?: boolean;
  serverError?: string | null;
}

interface FormState {
  name: string;
  prompt: string;
  walletAddress: string;
  dryRun: boolean;
  dryRunSeedBalances: Record<string, string>;
  maxTradeUSD: number | null;
  maxSlippageBps: number | null;
  intervalMs: number | null;
}

interface FormErrors {
  name?: string;
  prompt?: string;
  walletAddress?: string;
  maxTradeUSD?: string;
  maxSlippageBps?: string;
  intervalMs?: string;
  dryRunSeedBalances?: string;
}

const INITIAL: FormState = {
  name: "",
  prompt: "",
  walletAddress: "",
  dryRun: true,
  dryRunSeedBalances: {},
  maxTradeUSD: 100,
  maxSlippageBps: 50,
  intervalMs: null,
};

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!state.name.trim()) errors.name = "Required";
  if (!state.prompt.trim()) errors.prompt = "Required";
  if (!state.walletAddress.trim()) errors.walletAddress = "Required";
  if (state.maxTradeUSD === null || state.maxTradeUSD <= 0)
    errors.maxTradeUSD = "Must be greater than 0";
  if (
    state.maxSlippageBps === null ||
    !Number.isInteger(state.maxSlippageBps) ||
    state.maxSlippageBps < 0 ||
    state.maxSlippageBps > 10000
  )
    errors.maxSlippageBps = "Integer between 0 and 10000";
  if (
    state.intervalMs !== null &&
    (!Number.isInteger(state.intervalMs) || state.intervalMs < 1000)
  )
    errors.intervalMs = "Integer ≥ 1000ms or empty";
  if (state.dryRun) {
    for (const [token, amount] of Object.entries(state.dryRunSeedBalances)) {
      if (!token.trim() || !amount.trim()) {
        errors.dryRunSeedBalances = "Token and amount required for each row";
        break;
      }
    }
  }
  return errors;
}

export function AgentCreateForm({
  onSubmit,
  onCancel,
  creating,
  serverError,
}: AgentCreateFormProps) {
  const [state, setState] = useState<FormState>(INITIAL);
  const errors = validate(state);
  const hasErrors = Object.keys(errors).length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (hasErrors || creating) return;
    const base = {
      name: state.name.trim(),
      prompt: state.prompt.trim(),
      walletAddress: state.walletAddress.trim(),
      dryRun: state.dryRun,
      dryRunSeedBalances: state.dryRun
        ? state.dryRunSeedBalances
        : undefined,
      riskLimits: {
        maxTradeUSD: state.maxTradeUSD!,
        maxSlippageBps: state.maxSlippageBps!,
      },
    };
    const body: AgentsPostRequest =
      state.intervalMs != null
        ? { ...base, type: "scheduled", intervalMs: state.intervalMs }
        : { ...base, type: "chat" };
    onSubmit(body);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Name" htmlFor="create-name" error={errors.name}>
        <Input
          id="create-name"
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          disabled={creating}
        />
      </Field>

      <Field label="Prompt" htmlFor="create-prompt" error={errors.prompt}>
        <Textarea
          id="create-prompt"
          rows={5}
          value={state.prompt}
          onChange={(e) =>
            setState((s) => ({ ...s, prompt: e.target.value }))
          }
          disabled={creating}
        />
      </Field>

      <Field
        label="Wallet address"
        htmlFor="create-wallet"
        error={errors.walletAddress}
      >
        <Input
          id="create-wallet"
          value={state.walletAddress}
          onChange={(e) =>
            setState((s) => ({ ...s, walletAddress: e.target.value }))
          }
          disabled={creating}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Max trade (USD)"
          htmlFor="create-max-trade"
          error={errors.maxTradeUSD}
        >
          <NumberInput
            id="create-max-trade"
            value={state.maxTradeUSD}
            onChange={(v) => setState((s) => ({ ...s, maxTradeUSD: v }))}
            min={0.01}
            step={0.01}
            disabled={creating}
          />
        </Field>
        <Field
          label="Max slippage (bps)"
          htmlFor="create-slippage"
          error={errors.maxSlippageBps}
        >
          <NumberInput
            id="create-slippage"
            value={state.maxSlippageBps}
            onChange={(v) => setState((s) => ({ ...s, maxSlippageBps: v }))}
            min={0}
            max={10000}
            step={1}
            disabled={creating}
          />
        </Field>
      </div>

      <Field
        label="Interval (ms) — leave empty for chat-only"
        htmlFor="create-interval"
        error={errors.intervalMs}
      >
        <NumberInput
          id="create-interval"
          value={state.intervalMs}
          onChange={(v) => setState((s) => ({ ...s, intervalMs: v }))}
          min={1000}
          step={1000}
          disabled={creating}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={state.dryRun}
          onChange={(e) =>
            setState((s) => ({ ...s, dryRun: e.target.checked }))
          }
          disabled={creating}
        />
        Dry run (simulated trades)
      </label>

      {state.dryRun && (
        <SeedBalancesEditor
          value={state.dryRunSeedBalances}
          onChange={(v) =>
            setState((s) => ({ ...s, dryRunSeedBalances: v }))
          }
          error={errors.dryRunSeedBalances}
          disabled={creating}
        />
      )}

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {serverError}
        </p>
      )}

      <DialogFooter>
        <Button
          variant="ghost"
          type="button"
          onClick={onCancel}
          disabled={creating}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={creating}
          disabled={hasErrors || creating}
        >
          Create
        </Button>
      </DialogFooter>
    </form>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export {
  AgentCreateForm,
  type AgentCreateFormProps,
} from "./AgentCreateForm";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/AgentCreateDialog/components/AgentCreateForm
git commit -m "feat(agents): AgentCreateForm with dry-run seed balance editor"
```

---

## Task 13: `AgentCreateDialog`

**Files:**
- Create: `src/components/AgentCreateDialog/AgentCreateDialog.tsx`
- Create: `src/components/AgentCreateDialog/index.ts`

- [ ] **Step 1: Write `AgentCreateDialog.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "@/ui/Dialog";
import { AgentCreateForm } from "./components/AgentCreateForm";
import { useCreateAgent } from "./hooks/useCreateAgent";

export interface AgentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentCreateDialog({
  open,
  onOpenChange,
}: AgentCreateDialogProps) {
  const router = useRouter();
  const { create, creating, error } = useCreateAgent();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New agent"
      description="Configure a new runner. You can change name, prompt, risk limits, and interval later."
    >
      <AgentCreateForm
        creating={creating}
        serverError={error}
        onCancel={() => onOpenChange(false)}
        onSubmit={async (body) => {
          const created = await create(body);
          if (created) {
            onOpenChange(false);
            router.push(`/agents/${created.id}`);
          }
        }}
      />
    </Dialog>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export {
  AgentCreateDialog,
  type AgentCreateDialogProps,
} from "./AgentCreateDialog";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/AgentCreateDialog/AgentCreateDialog.tsx src/components/AgentCreateDialog/index.ts
git commit -m "feat(agents): AgentCreateDialog wires form + create hook into Dialog"
```

---

## Task 14: Wire "+ New agent" into agents list page

**Files:**
- Modify: `src/app/agents/page.tsx`

- [ ] **Step 1: Convert page to a client component and wire dialog**

The current file is a server component. Replace it with:

```tsx
"use client";

import { useState } from "react";
import { AgentCreateDialog } from "@/components/AgentCreateDialog";
import { AgentGrid } from "@/components/AgentGrid";
import { Button } from "@/ui/Button";

export default function AgentsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pick an agent to chat with or inspect its activity.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ New agent</Button>
      </header>
      <AgentGrid />
      <AgentCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 3: Manual smoke**

Dev server on :3001, API on :3000:

1. Visit http://localhost:3001/agents → header shows "+ New agent" button.
2. Click → modal opens with default values; Create disabled until valid.
3. Fill name, prompt, wallet, leave dryRun on, add one seed (e.g. `USDC` `1000`), submit → dialog closes; URL becomes `/agents/<new-id>`; chat header shows the new agent's name.
4. Reopen create dialog, set Interval to 5000 (scheduled), submit → same flow; the new card on `/agents` shows interval 5s.
5. Reopen, hit Esc → closes without creating.

- [ ] **Step 4: Commit**

```bash
git add src/app/agents/page.tsx
git commit -m "feat(agents): + New agent button on /agents opens AgentCreateDialog"
```

---

## Task 15: Final verification

- [ ] **Step 1: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 2: End-to-end smoke**

With dev (:3001) and API (:3000) running, walk both flows once more:

1. Create a new agent (chat-only). Land on its chat.
2. Edit it from the gear: change `prompt`, save. Verify persists across reload.
3. Edit again: set `intervalMs` to 5000 → still works (PATCH allows it).
4. Start/stop control still works alongside the gear.
5. From `/agents`, the new card reflects updated name and interval.

- [ ] **Step 3: Confirm with the user**

Report completion and outstanding follow-ups (e.g. test runner addition deferred per spec).

---

## Self-review notes

- All spec sections (Dialog, Field, NumberInput, AgentEditDialog tree, AgentCreateDialog tree with SeedBalancesEditor, validation rules, error handling, manual verification) map to one or more tasks above.
- Validation predicates match the spec table exactly.
- `intervalMs`-derives-`type` logic is in `AgentCreateForm.handleSubmit`, with the body assembled into a typed `AgentsPostRequest` discriminated union.
- The test runner stays out of scope per the spec; manual verification is explicit per task.
