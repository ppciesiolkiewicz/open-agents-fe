# 0G Balances Detail Page — Design

## Goal

Surface the per-provider 0G balance breakdown (already exposed by the new `GET /users/me/zerog/balances` endpoint) in a dedicated page accessible from the navbar's `BalancePill` and the `UserMenu` dropdown's balance section.

## Scope

**In scope:**
- New `/balances` route showing 0G breakdown only.
- Make the navbar `BalancePill` and the `UserMenu` dropdown wallet-balance section clickable links to `/balances`.
- Add `InfoIcon` to indicate "details available" at both entry points.
- Use the already-generated SDK method `api.usersMeZerogBalancesGet()`.

**Out of scope (future stages):**
- USDC and other tokens on Unichain (placeholder — not displayed yet).
- Any backend API changes — `/me` keeps its current 2 base balances.

## SDK shape

`ZeroGBalancesResponse`:

- `providers: ProviderBalance[]` — each `{ address, balanceRaw, balanceFormatted }`
- `ledger: LedgerBalance` — `{ totalRaw/Formatted, availableRaw/Formatted, lockedRaw/Formatted }`
- `onChainWalletRaw, onChainWalletFormatted` — wallet balance on 0G chain

## Components

### `src/ui/icons/icons.tsx` — add `InfoIcon`

A simple circle-with-i icon, matching the existing icon styling (16×16, currentColor stroke). Reused at both entry points.

### `src/components/BalancePill/BalancePill.tsx`

- Wrap the existing pill body in a Next.js `<Link href="/balances">`.
- Append `InfoIcon` (zinc-400 / dark:zinc-500) at the end of the pill, inside the link.
- Add `cursor-pointer` and a subtle `hover:` background change (consistent with existing interactive atoms).
- No prop API change.

### `src/components/UserMenu/UserMenu.tsx`

The dropdown currently has two stacked sub-areas inside the `walletObj` block:

1. Wallet address button (copies on click) — **unchanged**. `CopyIcon` already serves as the visual cue.
2. Balance rows (`USDC` / `0G`) — wrap this block in `<Link href="/balances">`, append `InfoIcon` on the trailing edge of the rows container, add `hover:bg-zinc-100 dark:hover:bg-zinc-800`, `cursor-pointer`.

`Link` must close the dropdown on click; use Radix's `DropdownMenu.Item asChild` pattern (or our `Dropdown` atom's equivalent) so keyboard nav and auto-close still work. If the existing `Dropdown` atom does not yet expose a way to render an item as a `Link`, extend it minimally (add `asChild` passthrough on `DropdownItem` or a new `DropdownLinkItem`).

### `src/components/Balances/` (new domain component)

Folder shape:

```
components/Balances/
  index.ts          # re-exports Balances
  Balances.tsx      # client component, fetches + renders
  components/
    LedgerCard.tsx     # total / available / locked
    ProvidersTable.tsx # one row per provider
    WalletCard.tsx     # on-chain wallet balance + address (with copy)
```

`Balances.tsx`:

- `"use client"`.
- On mount, calls `api.usersMeZerogBalancesGet()` once. Stores `data | null`, `error | null`, `loading`.
- Renders three sections in order:
  1. **On-chain wallet** — `onChainWalletFormatted` + the wallet address (reuse the same copy interaction shape from `UserMenu`).
  2. **0G account (ledger)** — total / available / locked, monospace numbers, labelled.
  3. **Providers** — table or row list: `address` (truncated, with `CopyIcon` button) and `balanceFormatted`.
- Loading: skeleton blocks for each section. Error: inline message + retry button.
- All numeric formatting goes through `truncateAmount` from `@/lib/formatBalance`.

### `src/app/balances/page.tsx`

- Thin route file. Renders `<AppShell>` (already wrapping other routes) with `<Balances />` as the page body.
- Page header: title `"Balances"` and a back link to `/` (the agents list). Match the header layout used by sibling pages under `src/app/agents/`.

## Data flow

```
/balances page
  └─ <Balances />               (client)
      └─ api.usersMeZerogBalancesGet()
          ├─ providers[]   → ProvidersTable
          ├─ ledger        → LedgerCard
          └─ onChainWallet → WalletCard
```

No global state, no provider — the data is page-local. If we later need it elsewhere (e.g. live navbar total), we lift it into a context similar to `TransactionsProvider`.

## Navigation flow

- User sees `BalancePill` in navbar → clicks anywhere on it → routed to `/balances`.
- User opens `UserMenu` dropdown → clicks balance rows area → dropdown closes, routed to `/balances`.
- The wallet address button inside `UserMenu` retains its copy-on-click behaviour and does **not** navigate.

## Error handling

- Fetch failure on `/balances`: render an error block with the message and a retry button. Do not throw.
- `BalancePill` and `UserMenu` already render gracefully when balances are missing; their links remain wired regardless (the page handles its own empty states).

## Testing

- Manual: log in, verify the pill is clickable and highlights, dropdown rows are clickable, page renders the three sections with real data, copy buttons still work.
- Type-check (`tsc --noEmit` via existing project script) must pass after additions.

## Files added / changed

**Added:**
- `src/app/balances/page.tsx`
- `src/components/Balances/index.ts`
- `src/components/Balances/Balances.tsx`
- `src/components/Balances/components/WalletCard.tsx`
- `src/components/Balances/components/LedgerCard.tsx`
- `src/components/Balances/components/ProvidersTable.tsx`

**Changed:**
- `src/ui/icons/icons.tsx` — add `InfoIcon`
- `src/ui/icons/index.ts` — export `InfoIcon` (if barrel re-exports icons by name)
- `src/components/BalancePill/BalancePill.tsx` — wrap in `Link`, append `InfoIcon`
- `src/components/UserMenu/UserMenu.tsx` — wrap balance rows in `Link`, append `InfoIcon`
- `src/ui/Dropdown/Dropdown.tsx` — only if needed to support `Link` rendering inside an item

## Open questions

None — proceed to plan.
