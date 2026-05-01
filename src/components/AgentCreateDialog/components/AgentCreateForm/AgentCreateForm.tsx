"use client";

import { useState, type FormEvent } from "react";
import { AllowedTokensSelector } from "@/components/AllowedTokensSelector";
import { ConnectedAgentsSelector } from "@/components/ConnectedAgentsSelector";
import { ToolsSelector } from "@/components/ToolsSelector";
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
  intervalMin: number | null;
  allowedTokens: string[];
  toolIds: string[];
  connectedAgentIds: string[];
}

interface FormErrors {
  name?: string;
  prompt?: string;
  maxTradeUSD?: string;
  maxSlippageBps?: string;
  intervalMin?: string;
  dryRunSeedBalances?: string;
}

const INITIAL: FormState = {
  name: "",
  prompt: "",
  dryRun: true,
  dryRunSeedBalances: {},
  maxTradeUSD: 100,
  maxSlippageBps: 50,
  intervalMin: 5,
  allowedTokens: [],
  toolIds: [],
  connectedAgentIds: [],
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
    state.intervalMin === null ||
    !Number.isFinite(state.intervalMin) ||
    state.intervalMin < 1
  )
    errors.intervalMin = "At least 1 minute";
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
      allowedTokens: state.allowedTokens,
      toolIds: state.toolIds,
      connectedAgentIds:
        state.connectedAgentIds.length > 0 ? state.connectedAgentIds : undefined,
      intervalMs: Math.round(state.intervalMin! * 60_000),
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

      <Field
        label="System prompt"
        htmlFor="create-prompt"
        error={errors.prompt}
        helper="Describe how you want this agent to behave in plain language: what it should do, what to avoid, and your preferred style. Think of it like giving instructions to a teammate."
      >
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
        label="Allowed tokens"
        helper="Only selected tokens can be traded by this agent."
      >
        <AllowedTokensSelector
          value={state.allowedTokens}
          onChange={(allowedTokens) => setState((s) => ({ ...s, allowedTokens }))}
          disabled={creating}
        />
      </Field>

      <Field
        label="Tools"
        helper="Select tools available to this agent. Hover a tool to see its description."
      >
        <ToolsSelector
          value={state.toolIds}
          onChange={(toolIds) => setState((s) => ({ ...s, toolIds }))}
          disabled={creating}
        />
      </Field>

      <Field label="Connected agents">
        <ConnectedAgentsSelector
          value={state.connectedAgentIds}
          onChange={(connectedAgentIds) =>
            setState((s) => ({ ...s, connectedAgentIds }))
          }
          disabled={creating}
        />
      </Field>

      <Field
        label="Interval (min)"
        htmlFor="create-interval"
        error={errors.intervalMin}
        helper="How often the agent runs when started. Only used after you click Start."
      >
        <NumberInput
          id="create-interval"
          value={state.intervalMin}
          onChange={(v) => setState((s) => ({ ...s, intervalMin: v }))}
          min={1}
          step={1}
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
