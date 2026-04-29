# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a one-time onboarding screen to new users (localStorage flag) with welcome copy, a Transak top-up link, and a placeholder "Buy AI credits" button; add a persistent "Top up" button in the top bar.

**Architecture:** `OnboardingGate` wraps the authenticated app tree (inside the existing `AuthGate → EnsureUserWallet` chain) and shows `<Onboarding />` on first visit, children otherwise. Wallet data flows via the existing `MeContext` (`useMe()` already returns `MeResponse | null` with wallets). `useUserWallet()` in `src/hooks/` is a thin wrapper over `useMe()` that returns the primary wallet.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, existing `@/ui` atoms (`Card`, `Button`, `IconButton`, `Spinner`), existing `CopyIcon`/`CheckIcon` from `@/ui/icons`, `useMe()` from `@/components/AuthGate`.

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/hooks/useUserWallet.ts` | Extract primary wallet from `useMe()` |
| Create | `src/lib/transak.ts` | Build Transak URL with wallet address |
| Create | `src/components/OnboardingGate/hooks/useOnboardingFlag.ts` | Read/write localStorage flag, SSR-safe |
| Create | `src/components/OnboardingGate/components/Onboarding/components/WelcomeCard/WelcomeCard.tsx` | Welcome card UI |
| Create | `src/components/OnboardingGate/components/Onboarding/components/TopUpCard/TopUpCard.tsx` | Top-up card with Transak link + address copy |
| Create | `src/components/OnboardingGate/components/Onboarding/components/BuyCreditsCard/BuyCreditsCard.tsx` | Credits card with no-op button |
| Create | `src/components/OnboardingGate/components/Onboarding/Onboarding.tsx` | Full-screen layout composing three cards |
| Create | `src/components/OnboardingGate/components/Onboarding/index.ts` | Public surface for Onboarding |
| Create | `src/components/OnboardingGate/OnboardingGate.tsx` | Gate: spinner → onboarding → children |
| Create | `src/components/OnboardingGate/index.ts` | Public surface for OnboardingGate |
| Create | `src/components/TopUpButton/TopUpButton.tsx` | Top-bar "Top up" link button |
| Create | `src/components/TopUpButton/index.ts` | Public surface for TopUpButton |
| Modify | `tsconfig.json` | Add `@/hooks/*` alias |
| Modify | `src/components/AuthGate/AuthGate.tsx` | Wrap EnsureUserWallet children in OnboardingGate |
| Modify | `src/app/agents/page.tsx` | Add TopUpButton next to UserMenu |
| Modify | `src/app/agents/[id]/page.tsx` | Add TopUpButton next to UserMenu in nav |

---

## Task 1: Branch + tsconfig alias

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/onboarding
```

- [ ] **Step 2: Add `@/hooks/*` alias to tsconfig**

In `tsconfig.json`, inside `compilerOptions.paths`, add one entry after `"@/lib/*"`:

```json
"@/hooks/*": ["./src/hooks/*"],
```

Full `paths` block after the change:

```json
"paths": {
  "@/*": ["./src/*"],
  "@/ui/*": ["./src/ui/*"],
  "@/components/*": ["./src/components/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/hooks/*": ["./src/hooks/*"],
  "@/sdk": ["./src/sdk"],
  "@/sdk/*": ["./src/sdk/*"]
}
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add @/hooks/* tsconfig alias"
```

---

## Task 2: `useUserWallet` shared hook

**Files:**
- Create: `src/hooks/useUserWallet.ts`

- [ ] **Step 1: Create the file**

`src/hooks/useUserWallet.ts`:

```ts
import { useMe } from "@/components/AuthGate";
import type { MeWallet } from "@/lib/userApi";

export function useUserWallet(): MeWallet | null {
  const me = useMe();
  return me?.wallets.find((w) => w.isPrimary) ?? null;
}
```

`useMe()` is already exported from `@/components/AuthGate` (see `src/components/AuthGate/index.ts`). It reads from `MeContext` which `EnsureUserWallet` provides — so this hook works anywhere inside the authenticated tree.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUserWallet.ts
git commit -m "feat(hooks): add useUserWallet extracting primary wallet from MeContext"
```

---

## Task 3: Transak URL builder

**Files:**
- Create: `src/lib/transak.ts`

- [ ] **Step 1: Create the file**

`src/lib/transak.ts`:

```ts
const TRANSAK_BASE =
  "https://global.transak.com?environment=PRODUCTION&themeColor=1461db" +
  "&productsAvailed=BUY,SELL&defaultFiatAmount=20&fiatCurrency=GBP" +
  "&defaultNetwork=unichain&network=ethereum&paymentMethod=credit_debit_card" +
  "&defaultCryptoCurrency=USDC&cryptoCurrencyCode=ETH&disableWalletAddressForm=true";

export function buildTransakUrl(walletAddress: string): string {
  return `${TRANSAK_BASE}&walletAddress=${encodeURIComponent(walletAddress)}`;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/transak.ts
git commit -m "feat(lib): add Transak URL builder"
```

---

## Task 4: Onboarding flag hook

**Files:**
- Create: `src/components/OnboardingGate/hooks/useOnboardingFlag.ts`

- [ ] **Step 1: Create the file**

`src/components/OnboardingGate/hooks/useOnboardingFlag.ts`:

```ts
"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "openAgents.onboardingCompleted";

export interface UseOnboardingFlagResult {
  completed: boolean | null;
  markCompleted: () => void;
}

export function useOnboardingFlag(): UseOnboardingFlagResult {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    setCompleted(localStorage.getItem(KEY) === "1");
  }, []);

  const markCompleted = useCallback(() => {
    localStorage.setItem(KEY, "1");
    setCompleted(true);
  }, []);

  return { completed, markCompleted };
}
```

`completed === null` while the `useEffect` hasn't fired (SSR / first render). `OnboardingGate` will show a Spinner in this state.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/OnboardingGate/hooks/useOnboardingFlag.ts
git commit -m "feat(onboarding): add useOnboardingFlag localStorage hook"
```

---

## Task 5: WelcomeCard

**Files:**
- Create: `src/components/OnboardingGate/components/Onboarding/components/WelcomeCard/WelcomeCard.tsx`

- [ ] **Step 1: Create the file**

`src/components/OnboardingGate/components/Onboarding/components/WelcomeCard/WelcomeCard.tsx`:

```tsx
import { Card } from "@/ui/Card";

export function WelcomeCard() {
  return (
    <Card className="gap-2">
      <h2 className="text-xl font-semibold">Welcome to Open Agents</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Your account is ready. Complete the steps below to get started — you
        can always come back to them later from the top bar.
      </p>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/OnboardingGate/components/Onboarding/components/WelcomeCard/WelcomeCard.tsx
git commit -m "feat(onboarding): add WelcomeCard"
```

---

## Task 6: TopUpCard

**Files:**
- Create: `src/components/OnboardingGate/components/Onboarding/components/TopUpCard/TopUpCard.tsx`

- [ ] **Step 1: Create the file**

`src/components/OnboardingGate/components/Onboarding/components/TopUpCard/TopUpCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { buildTransakUrl } from "@/lib/transak";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { IconButton } from "@/ui/IconButton";
import { CheckIcon, CopyIcon } from "@/ui/icons";
import type { MeWallet } from "@/lib/userApi";

export interface TopUpCardProps {
  wallet: MeWallet | null;
}

export function TopUpCard({ wallet }: TopUpCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!wallet) return;
    await navigator.clipboard.writeText(wallet.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Step 1
        </span>
        <h3 className="text-base font-semibold">Top up your account</h3>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Send USDC to your account on Unichain to fund your agents.
      </p>
      <div className="flex flex-col gap-2">
        <a
          href={wallet ? buildTransakUrl(wallet.walletAddress) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
        >
          <Button disabled={!wallet} className="w-full">
            Top up with USDC
          </Button>
        </a>
        {wallet ? (
          <div className="flex items-center gap-1.5">
            <span className="flex-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {wallet.walletAddress}
            </span>
            {typeof navigator !== "undefined" && navigator.clipboard && (
              <IconButton
                aria-label={copied ? "Copied" : "Copy wallet address"}
                icon={copied ? <CheckIcon /> : <CopyIcon />}
                size="sm"
                onClick={() => void handleCopy()}
              />
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Wallet address loading…</p>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/OnboardingGate/components/Onboarding/components/TopUpCard/TopUpCard.tsx
git commit -m "feat(onboarding): add TopUpCard with Transak link and address copy"
```

---

## Task 7: BuyCreditsCard

**Files:**
- Create: `src/components/OnboardingGate/components/Onboarding/components/BuyCreditsCard/BuyCreditsCard.tsx`

- [ ] **Step 1: Create the file**

`src/components/OnboardingGate/components/Onboarding/components/BuyCreditsCard/BuyCreditsCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";

export function BuyCreditsCard() {
  const [clicked, setClicked] = useState(false);

  return (
    <Card className="gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Step 2
        </span>
        <h3 className="text-base font-semibold">Buy AI computation credits</h3>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Convert your USDC into AI computation credits to run agents.
      </p>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={() => setClicked(true)}>
          Buy AI credits
        </Button>
        {clicked && (
          <p className="text-xs text-zinc-400">
            Coming soon — this feature is on its way.
          </p>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/OnboardingGate/components/Onboarding/components/BuyCreditsCard/BuyCreditsCard.tsx
git commit -m "feat(onboarding): add BuyCreditsCard placeholder"
```

---

## Task 8: Onboarding full-screen layout

**Files:**
- Create: `src/components/OnboardingGate/components/Onboarding/Onboarding.tsx`
- Create: `src/components/OnboardingGate/components/Onboarding/index.ts`

- [ ] **Step 1: Create `Onboarding.tsx`**

`src/components/OnboardingGate/components/Onboarding/Onboarding.tsx`:

```tsx
"use client";

import { Button } from "@/ui/Button";
import { useUserWallet } from "@/hooks/useUserWallet";
import { WelcomeCard } from "./components/WelcomeCard/WelcomeCard";
import { TopUpCard } from "./components/TopUpCard/TopUpCard";
import { BuyCreditsCard } from "./components/BuyCreditsCard/BuyCreditsCard";

export interface OnboardingProps {
  onDone: () => void;
}

export function Onboarding({ onDone }: OnboardingProps) {
  const wallet = useUserWallet();

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <WelcomeCard />
        <TopUpCard wallet={wallet} />
        <BuyCreditsCard />
        <Button size="lg" onClick={onDone} className="self-end">
          Get started
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `index.ts`**

`src/components/OnboardingGate/components/Onboarding/index.ts`:

```ts
export { Onboarding, type OnboardingProps } from "./Onboarding";
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/OnboardingGate/components/Onboarding/
git commit -m "feat(onboarding): compose Onboarding full-screen layout"
```

---

## Task 9: OnboardingGate

**Files:**
- Create: `src/components/OnboardingGate/OnboardingGate.tsx`
- Create: `src/components/OnboardingGate/index.ts`

- [ ] **Step 1: Create `OnboardingGate.tsx`**

`src/components/OnboardingGate/OnboardingGate.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/ui/Spinner";
import { Onboarding } from "./components/Onboarding";
import { useOnboardingFlag } from "./hooks/useOnboardingFlag";

export interface OnboardingGateProps {
  children: ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { completed, markCompleted } = useOnboardingFlag();

  if (completed === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!completed) {
    return <Onboarding onDone={markCompleted} />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Create `index.ts`**

`src/components/OnboardingGate/index.ts`:

```ts
export { OnboardingGate, type OnboardingGateProps } from "./OnboardingGate";
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/OnboardingGate/
git commit -m "feat(onboarding): add OnboardingGate (localStorage gate)"
```

---

## Task 10: Wire OnboardingGate into AuthGate

**Files:**
- Modify: `src/components/AuthGate/AuthGate.tsx`

Current file renders `<EnsureUserWallet>{children}</EnsureUserWallet>` in the authenticated branch. Wrap children with `<OnboardingGate>`.

- [ ] **Step 1: Update `AuthGate.tsx`**

`src/components/AuthGate/AuthGate.tsx` — full file after change:

```tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { Spinner } from "@/ui/Spinner";
import { OnboardingGate } from "@/components/OnboardingGate";
import { EnsureUserWallet } from "./components/EnsureUserWallet";
import { SignIn } from "./components/SignIn";

export interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!authenticated) return <SignIn />;

  return (
    <EnsureUserWallet>
      <OnboardingGate>{children}</OnboardingGate>
    </EnsureUserWallet>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

1. Open `http://localhost:3000/agents`.
2. Clear localStorage (`localStorage.clear()` in devtools console), reload.
3. Sign in → onboarding screen should appear with three cards.
4. Card 2 shows wallet address and "Top up with USDC" button.
5. Click "Top up with USDC" → Transak opens in new tab with address pre-filled.
6. Card 3 "Buy AI credits" → inline "Coming soon" appears on click.
7. Click "Get started" → app renders normally.
8. Reload → onboarding does not show again.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthGate/AuthGate.tsx
git commit -m "feat(auth): wire OnboardingGate between EnsureUserWallet and app"
```

---

## Task 11: TopUpButton

**Files:**
- Create: `src/components/TopUpButton/TopUpButton.tsx`
- Create: `src/components/TopUpButton/index.ts`

- [ ] **Step 1: Create `TopUpButton.tsx`**

`src/components/TopUpButton/TopUpButton.tsx`:

```tsx
"use client";

import { buildTransakUrl } from "@/lib/transak";
import { useUserWallet } from "@/hooks/useUserWallet";
import { Button } from "@/ui/Button";

export function TopUpButton() {
  const wallet = useUserWallet();
  if (!wallet) return null;

  return (
    <a
      href={buildTransakUrl(wallet.walletAddress)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="secondary" size="sm">
        Top up
      </Button>
    </a>
  );
}
```

- [ ] **Step 2: Create `index.ts`**

`src/components/TopUpButton/index.ts`:

```ts
export { TopUpButton } from "./TopUpButton";
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/TopUpButton/
git commit -m "feat(ui): add TopUpButton component"
```

---

## Task 12: Wire TopUpButton into page headers

**Files:**
- Modify: `src/app/agents/page.tsx`
- Modify: `src/app/agents/[id]/page.tsx`

- [ ] **Step 1: Update `src/app/agents/page.tsx`**

Add `TopUpButton` import and place it between `Button` (+ New agent) and `UserMenu`:

```tsx
"use client";

import { useState } from "react";
import { AgentCreateDialog } from "@/components/AgentCreateDialog";
import { AgentGrid } from "@/components/AgentGrid";
import { TopUpButton } from "@/components/TopUpButton";
import { UserMenu } from "@/components/UserMenu";
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
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>+ New agent</Button>
          <TopUpButton />
          <UserMenu />
        </div>
      </header>
      <AgentGrid />
      <AgentCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
```

- [ ] **Step 2: Update `src/app/agents/[id]/page.tsx`**

Add `TopUpButton` import and place it just before `<UserMenu />` in the nav:

```tsx
"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import { AgentRunControl } from "@/components/AgentRunControl";
import { Chat } from "@/components/Chat";
import { TopUpButton } from "@/components/TopUpButton";
import { UserMenu } from "@/components/UserMenu";
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
        <TopUpButton />
        <UserMenu />
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

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

1. After completing onboarding (or setting `localStorage.setItem('openAgents.onboardingCompleted','1')`), reload.
2. `/agents` header: "Top up" button visible between "+ New agent" and the account menu.
3. `/agents/<id>`: "Top up" button visible in the nav bar next to the account menu.
4. Click "Top up" → Transak opens in new tab with wallet address pre-filled.
5. No "Top up" button visible when wallet is null (immediately after login before bootstrap completes) — button returns null.

- [ ] **Step 5: Commit**

```bash
git add src/app/agents/page.tsx src/app/agents/[id]/page.tsx
git commit -m "feat(pages): add TopUpButton to agents and agent chat headers"
```
