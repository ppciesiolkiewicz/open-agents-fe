"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/ui/Button";
import { DialogFooter } from "@/ui/Dialog";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { NumberInput } from "@/ui/NumberInput";
import { Textarea } from "@/ui/Textarea";
import type { CreateAgentBody } from "@/sdk";
import { SeedBalancesEditor } from "./components/SeedBalancesEditor";

export interface AgentCreateFormProps {
  onSubmit: (body: CreateAgentBody) => void;
  onCancel: () => void;
  creating?: boolean;
  serverError?: string | null;
}

interface FormState {
  name: string;
  prompt: string;
  dryRun: boolean;
  dryRunSeedBalances: Record<string, string>;
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
  dryRunSeedBalances?: string;
}

const INITIAL: FormState = {
  name: "",
  prompt: "",
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
    const body: CreateAgentBody = {
      name: state.name.trim(),
      prompt: state.prompt.trim(),
      dryRun: state.dryRun,
      dryRunSeedBalances: state.dryRun
        ? state.dryRunSeedBalances
        : undefined,
      riskLimits: {
        maxTradeUSD: state.maxTradeUSD!,
        maxSlippageBps: state.maxSlippageBps!,
      },
      intervalMs: state.intervalMs ?? undefined,
    };
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
