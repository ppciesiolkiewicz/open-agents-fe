# Agent config + creation — design

Date: 2026-04-28

## Goal

Two related FE features that share form atoms and validation logic:

1. **Edit agent config from the chat view.** A gear `IconButton` next to
   the start/stop control on `/agents/[id]` opens a modal that lets the
   user change the runner's editable properties.
2. **Create a new agent from the agents list.** A "+ New agent" `Button`
   on `/agents` opens a modal with the full creation form. On success,
   redirect to the new agent's chat.

Both flows write to the existing API and surface errors inline. No new
backend work.

## Editable surface

Per the regenerated SDK:

- **PATCH `/agents/{id}`** — `UpdateAgentBody` accepts `name`, `prompt`,
  `riskLimits`, `intervalMs`. Anything else (wallet, dryRun, seed
  balances) cannot be edited post-creation.
- **POST `/agents`** — discriminated union keyed on `type`
  (`chat | scheduled`). Both share `name`, `prompt`, `walletAddress`,
  `dryRun`, `dryRunSeedBalances?`, `riskLimits`. The scheduled variant
  additionally requires `intervalMs`. The FE no longer surfaces the
  chat/scheduled distinction in UI; we derive `type` from whether the
  user provides `intervalMs`.

`AgentConfigRiskLimits` is `{ maxTradeUSD: number, maxSlippageBps: number }`.
`dryRunSeedBalances` is `Record<string, string>` — token symbol to
amount (string to keep precision).

## New atoms

### `Dialog`

`src/ui/Dialog/` wraps `@radix-ui/react-dialog` (new dep). Owns its prop
surface — Radix props do not leak.

```tsx
<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Edit agent"
  description?="…"
>
  {form}
  <DialogFooter>{actions}</DialogFooter>
</Dialog>
```

Renders portal, overlay, animated panel, close button, focus trap.
`title` is required for a11y and rendered visually in the panel header.
Exports `Dialog` and `DialogFooter`.

### `Field`

`src/ui/Field/Field.tsx` — wraps a label + input slot + optional
helper/error. Props: `label`, `htmlFor`, `error?`, `helper?`, `children`.
App-agnostic. Errors override helpers.

### `NumberInput`

`src/ui/NumberInput/NumberInput.tsx` — thin wrapper over `Input` that
emits `number | null` (not strings). Props: `value: number | null`,
`onChange(next: number | null)`, `min?`, `max?`, `step?`, plus the
common `Input` subset. Avoids string ↔ number juggling at every
callsite.

## Domain components

```
src/components/AgentEditDialog/
  AgentEditDialog.tsx       open state + Dialog + AgentEditForm
  index.ts
  components/
    AgentEditForm/
      AgentEditForm.tsx     fields: name, prompt, riskLimits, intervalMs?
      index.ts
  hooks/
    useUpdateAgent.ts       PATCH /agents/:id, onSuccess(updated)

src/components/AgentCreateDialog/
  AgentCreateDialog.tsx     open state + Dialog + AgentCreateForm
  index.ts
  components/
    AgentCreateForm/
      AgentCreateForm.tsx   above fields + walletAddress, dryRun,
                            dryRunSeedBalances?
      index.ts
      components/
        SeedBalancesEditor/
          SeedBalancesEditor.tsx   KV row list, only when dryRun=true
          index.ts
  hooks/
    useCreateAgent.ts       POST /agents (derives type from intervalMs)
```

Each Dialog owns the open state. The trigger lives in the parent (gear
`IconButton` in chat header; "+ New agent" `Button` on `/agents`). Edit
and Create share **no code** at the component level — different field
sets, different mutations, different success behaviours. They share
**atoms** (`Dialog`, `Field`, `NumberInput`, `Input`, `Textarea`,
`Button`).

`SeedBalancesEditor`'s public surface:

```tsx
<SeedBalancesEditor
  value={Record<string, string>}
  onChange={(next) => …}
  error?: string
/>
```

Rows are kept in local order in component state (array of
`{ key, value }` pairs); `onChange` is called with the rebuilt object
on each edit. Add row, remove row, edit token, edit amount. The
component is only mounted when `dryRun=true` so it's a no-op while
dryRun is off.

## Triggers and wiring

### Chat header (`src/app/agents/[id]/page.tsx`)

The header currently renders `← Agents · {name}` on the left and
`AgentRunControl` on the right. Add a gear `IconButton` (uses the
existing `IconButton` atom; new `GearIcon` in `src/ui/icons/icons.tsx`)
**immediately before** `AgentRunControl`. Click opens
`AgentEditDialog`, seeded with the page's current `agent` state. On
save, the dialog calls the same `setAgent` already used by
`AgentRunControl`, so name/prompt/intervalMs/risk reflect immediately
without a refetch.

### Agents page (`src/app/agents/page.tsx`)

Add a "+ New agent" `Button` (variant `primary`, size `md`) in the page
header, right side. Click opens `AgentCreateDialog`. On success, the
dialog calls `router.push('/agents/' + created.id)`; the dialog itself
does not need to invalidate the grid because we navigate away.

## Data flow

### Edit

1. Gear opens `AgentEditDialog` with `agent` prop. Dialog seeds the
   form's initial values from `agent`.
2. Save → `useUpdateAgent` calls `api.agentsIdPatch({ id,
   updateAgentBody })`. Form is disabled while in flight.
3. Success → call `onChange(updated)` (passed from the page),
   close the dialog.
4. Error → render an inline banner above `DialogFooter`; form stays
   open with values intact.

`UpdateAgentBody` accepts partials, so we always send all currently
edited fields (no client-side diffing).

### Create

1. "+ New agent" opens `AgentCreateDialog`. Defaults: `dryRun=true`,
   `riskLimits={ maxTradeUSD: 100, maxSlippageBps: 50 }`, no
   `intervalMs`.
2. Save → `useCreateAgent` builds the discriminated body
   (`type: intervalMs != null ? 'scheduled' : 'chat'`) and calls
   `api.agentsPost`.
3. Success → `router.push('/agents/' + created.id)`. The grid revalidates
   on next mount of `/agents`.
4. Error → inline banner; form stays open.

## Validation

Client-side checks before enabling Save:

| Field                          | Rule                                                 |
| ------------------------------ | ---------------------------------------------------- |
| `name`                         | required, non-empty after trim                       |
| `prompt`                       | required, non-empty after trim                       |
| `walletAddress` (create)       | required, non-empty after trim                       |
| `riskLimits.maxTradeUSD`       | required, finite number > 0                          |
| `riskLimits.maxSlippageBps`    | required, integer ≥ 0, ≤ 10000                       |
| `intervalMs`                   | optional; if set, integer ≥ 1000                     |
| `dryRunSeedBalances` row       | each: token non-empty, amount non-empty; no duplicate token keys |

Errors render under each field via `Field`'s `error` prop. Save button
is disabled until the form is valid. Validation lives in a small
function next to each form (`validateEdit`, `validateCreate`); no shared
schema library.

## Error handling

- Mutation hooks (`useUpdateAgent`, `useCreateAgent`) catch and store
  the error message; forms render it as a single inline banner above
  `DialogFooter`.
- `Esc` and clicking the overlay close the dialog (Radix default).
  Closing while in flight is allowed; the in-flight promise's result is
  dropped.
- The dialog never closes automatically on error — only on explicit
  user action or successful save.

## Testing

No runner is installed. Verification is manual for v1:

- Edit: open dialog from chat header, change prompt, save → chat header
  name and prompt reflect change; reload preserves it.
- Create — chat: name + prompt + wallet + risk limits; submit → land on
  `/agents/{id}`.
- Create — scheduled: above + intervalMs ≥ 1000; submit → same outcome,
  the new agent shows interval on its card.
- Create — dryRun seed: toggle dryRun, add two rows with distinct
  tokens, submit → request body includes `dryRunSeedBalances`.
- Errors: invalid input keeps Save disabled; server 4xx surfaces inline
  and the form stays open.
- A11y: focus trapped inside dialog; Esc closes; Tab cycles through
  fields and footer buttons; gear and "+ New agent" buttons have
  meaningful labels.

A test runner can be added in a separate change if/when the form logic
grows.

## Out of scope

- Editing `walletAddress`, `dryRun`, or `dryRunSeedBalances` after
  creation. The API does not allow it.
- Bulk operations (creating multiple agents, cloning).
- Real-time list invalidation for create (we navigate away on success).
- Confirmation prompts. Save commits immediately; mistakes are corrected
  by editing again.
