"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AllowedTokensSelector } from "@/components/AllowedTokensSelector";
import { ConnectedAgentsSelector } from "@/components/ConnectedAgentsSelector";
import { ToolsSelector } from "@/components/ToolsSelector";
import { api } from "@/lib/api";
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
    state.intervalMin === null ||
    !Number.isFinite(state.intervalMin) ||
    state.intervalMin < 1
  )
    errors.intervalMin = "At least 1 minute";
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
    intervalMin:
      typeof agent.intervalMs === "number" ? agent.intervalMs / 60_000 : null,
    allowedTokens: agent.allowedTokens,
    toolIds: [...agent.toolIds],
    connectedAgentIds: [...agent.connectedAgentIds],
  });
  useEffect(() => {
    let active = true;
    async function loadResolvedAllowedTokens() {
      try {
        const response = await api.agentsIdAllowedTokensGet({ id: agent.id });
        if (!active) return;
        const addresses = response.tokens.map((token) => token.address);
        setState((current) => ({ ...current, allowedTokens: addresses }));
      } catch {
        // Keep existing values from AgentConfig when resolved endpoint fails.
      }
    }
    void loadResolvedAllowedTokens();
    return () => {
      active = false;
    };
  }, [agent.id]);
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
      allowedTokens: state.allowedTokens,
      toolIds: state.toolIds,
      connectedAgentIds: state.connectedAgentIds,
      intervalMs: Math.round(state.intervalMin! * 60_000),
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

      <Field
        label="System prompt"
        htmlFor="agent-prompt"
        error={errors.prompt}
        helper="What this agent should do — its role, goals, and any constraints. Sent at the start of every run."
      >
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
        label="Allowed tokens"
        helper="Only selected tokens can be traded by this agent."
      >
        <AllowedTokensSelector
          value={state.allowedTokens}
          onChange={(allowedTokens) => setState((s) => ({ ...s, allowedTokens }))}
          disabled={saving}
        />
      </Field>

      <Field
        label="Tools"
        helper="Select tools available to this agent. Hover a tool to see its description."
      >
        <ToolsSelector
          value={state.toolIds}
          onChange={(toolIds) => setState((s) => ({ ...s, toolIds }))}
          disabled={saving}
        />
      </Field>

      <Field label="Connected agents">
        <ConnectedAgentsSelector
          value={state.connectedAgentIds}
          onChange={(connectedAgentIds) =>
            setState((s) => ({ ...s, connectedAgentIds }))
          }
          excludeAgentId={agent.id}
          disabled={saving}
        />
      </Field>

      <Field
        label="Interval (min)"
        htmlFor="agent-interval"
        error={errors.intervalMin}
        helper="How often the agent runs when started. Only used after you click Start."
      >
        <NumberInput
          id="agent-interval"
          value={state.intervalMin}
          onChange={(v) => setState((s) => ({ ...s, intervalMin: v }))}
          min={1}
          step={1}
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
