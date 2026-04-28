# Privy auth (FE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the FE behind Privy auth, attach the user's access token to every API call, and bootstrap a server-side wallet via `POST /users/me/wallets`.

**Architecture:** A `PrivyProvider` wraps the root layout; an `ApiTokenSync` non-renderer keeps the SDK's token getter pointed at Privy's `getAccessToken`; an `AuthGate` flips between a `<SignIn />` screen and an `<EnsureUserWallet>{children}</EnsureUserWallet>` once authenticated. Bootstrap calls `/users/me` and conditionally `POST /users/me/wallets` via hand-rolled fetch (until the SDK is regenerated). A small `UserMenu` (Radix Dropdown) shows identity and sign-out in the top-right of the existing pages.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, generated `typescript-fetch` SDK in `src/sdk/`, `@privy-io/react-auth`, `@radix-ui/react-dropdown-menu`.

**Spec:** [docs/superpowers/specs/2026-04-29-privy-auth-design.md](../specs/2026-04-29-privy-auth-design.md)

**Note on testing:** Project has no test runner. Per the spec, verification is manual (browser smoke + `tsc` + `eslint`). Each task ends with the same verification trio.

**Note on Privy SDK API:** This plan assumes `usePrivy()` exposes `ready`, `authenticated`, `getAccessToken`, `user`, `login`, `logout`. If the installed `@privy-io/react-auth` version differs, the only adjustments are at the call sites in `ApiTokenSync.tsx` and `SignIn.tsx` / `UserMenu.tsx` — confirm against the installed version's `node_modules/@privy-io/react-auth/README.md` before coding those tasks.

---

## Task 1: Install Privy + Dropdown deps

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install**

Run: `npm install @privy-io/react-auth @radix-ui/react-dropdown-menu`
Expected: both packages added; no audit errors that affect them.

- [ ] **Step 2: Sanity check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @privy-io/react-auth and @radix-ui/react-dropdown-menu"
```

---

## Task 2: Document the Privy app id env var

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Write `.env.example`**

```
# Privy app id (FE-only; required for auth)
NEXT_PUBLIC_PRIVY_APP_ID=

# Optional override; defaults to http://localhost:3000
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: document NEXT_PUBLIC_PRIVY_APP_ID and API base URL env vars"
```

---

## Task 3: Token-getter slot in the API client

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Replace `src/lib/api.ts` with the version below**

```ts
import { Configuration, DefaultApi } from "@/sdk";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function setApiAccessTokenGetter(getter: TokenGetter) {
  getToken = getter;
}

export async function getApiAccessToken(): Promise<string | null> {
  return getToken();
}

export const api = new DefaultApi(
  new Configuration({
    basePath: API_BASE_URL,
    accessToken: async () => (await getToken()) ?? "",
  }),
);
```

Re-export from `src/lib/index.ts` (already exports `api`, `API_BASE_URL`):

- [ ] **Step 2: Update `src/lib/index.ts`**

```ts
export { cn } from "./cn";
export {
  api,
  API_BASE_URL,
  getApiAccessToken,
  setApiAccessTokenGetter,
} from "./api";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.ts src/lib/index.ts
git commit -m "feat(lib): expose access-token getter slot for the API client"
```

---

## Task 4: Privy config module

**Files:**
- Create: `src/lib/privy.ts`

- [ ] **Step 1: Write `src/lib/privy.ts`**

```ts
const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

if (!APP_ID && process.env.NODE_ENV !== "test") {
  console.warn(
    "[privy] NEXT_PUBLIC_PRIVY_APP_ID is missing — sign-in will fail.",
  );
}

export const PRIVY_APP_ID = APP_ID ?? "";

export const PRIVY_CONFIG = {
  embeddedWallets: { createOnLogin: "off" as const },
  appearance: { theme: "light" as const },
};
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/privy.ts
git commit -m "feat(lib): centralize Privy app config (no embedded wallets)"
```

---

## Task 5: `Dropdown` atom

**Files:**
- Create: `src/ui/Dropdown/Dropdown.tsx`
- Create: `src/ui/Dropdown/index.ts`

- [ ] **Step 1: Write `Dropdown.tsx`**

```tsx
"use client";

import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
}: DropdownProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={4}
          className={cn(
            "z-50 min-w-40 rounded-md border border-zinc-200 bg-white p-1 text-sm shadow-md outline-none",
            "dark:border-zinc-800 dark:bg-zinc-950",
            className,
          )}
        >
          {children}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps>(
  function DropdownItem({ children, onSelect, disabled, className }, ref) {
    return (
      <RadixMenu.Item
        ref={ref}
        disabled={disabled}
        onSelect={onSelect}
        className={cn(
          "flex cursor-pointer select-none items-center rounded px-2 py-1.5 outline-none",
          "data-[highlighted]:bg-zinc-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          "dark:data-[highlighted]:bg-zinc-800",
          className,
        )}
      >
        {children}
      </RadixMenu.Item>
    );
  },
);
```

- [ ] **Step 2: Write `index.ts`**

```ts
export {
  Dropdown,
  DropdownItem,
  type DropdownProps,
  type DropdownItemProps,
} from "./Dropdown";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Dropdown
git commit -m "feat(ui): add Dropdown atom wrapping Radix Dropdown Menu"
```

---

## Task 6: `ApiTokenSync` — non-renderer that wires Privy → SDK

**Files:**
- Create: `src/components/AuthProvider/ApiTokenSync.tsx`

- [ ] **Step 1: Write `ApiTokenSync.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { setApiAccessTokenGetter } from "@/lib/api";

export function ApiTokenSync() {
  const { ready, authenticated, getAccessToken } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      setApiAccessTokenGetter(async () => (await getAccessToken()) ?? null);
    } else {
      setApiAccessTokenGetter(async () => null);
    }
  }, [ready, authenticated, getAccessToken]);

  return null;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthProvider/ApiTokenSync.tsx
git commit -m "feat(auth): ApiTokenSync points the SDK token getter at Privy"
```

---

## Task 7: `AuthProvider`

**Files:**
- Create: `src/components/AuthProvider/AuthProvider.tsx`
- Create: `src/components/AuthProvider/index.ts`

- [ ] **Step 1: Write `AuthProvider.tsx`**

```tsx
"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { PRIVY_APP_ID, PRIVY_CONFIG } from "@/lib/privy";
import { ApiTokenSync } from "./ApiTokenSync";

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={PRIVY_CONFIG}>
      <ApiTokenSync />
      {children}
    </PrivyProvider>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export { AuthProvider, type AuthProviderProps } from "./AuthProvider";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthProvider
git commit -m "feat(auth): AuthProvider wraps the tree in PrivyProvider + token sync"
```

---

## Task 8: Hand-rolled fetch helpers for `/users/me` and `POST /users/me/wallets`

**Files:**
- Create: `src/lib/userApi.ts`

These are temporary — they go away when the SDK is regenerated to include the `/users/me` routes.

- [ ] **Step 1: Write `src/lib/userApi.ts`**

```ts
import { API_BASE_URL, getApiAccessToken } from "@/lib/api";

export interface MeUser {
  id: string;
  privyDid: string;
  email: string | null;
  createdAt: number;
}

export interface MeWallet {
  id: string;
  walletAddress: string;
  isPrimary: boolean;
  createdAt: number;
}

export interface MeResponse {
  user: MeUser;
  wallets: MeWallet[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getApiAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchUserMe(): Promise<MeResponse> {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MeResponse;
}

export async function postUserWallet(): Promise<MeWallet> {
  const res = await fetch(`${API_BASE_URL}/users/me/wallets`, {
    method: "POST",
    headers: {
      ...(await authHeaders()),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MeWallet;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/userApi.ts
git commit -m "feat(lib): hand-rolled fetch helpers for /users/me until SDK regen"
```

---

## Task 9: `useUserBootstrap` hook

**Files:**
- Create: `src/components/AuthGate/hooks/useUserBootstrap.ts`

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUserMe, postUserWallet } from "@/lib/userApi";

export type BootstrapStatus = "idle" | "loading" | "ready" | "error";

interface UseUserBootstrapResult {
  status: BootstrapStatus;
  error: string | null;
  retry: () => void;
}

export function useUserBootstrap(enabled: boolean): UseUserBootstrapResult {
  const [status, setStatus] = useState<BootstrapStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setStatus("loading");
    setError(null);

    (async () => {
      try {
        const me = await fetchUserMe();
        if (cancelled) return;
        const hasPrimary = me.wallets.some((w) => w.isPrimary);
        if (!hasPrimary) {
          await postUserWallet();
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Bootstrap failed");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  const retry = useCallback(() => setTick((n) => n + 1), []);

  return { status, error, retry };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthGate/hooks/useUserBootstrap.ts
git commit -m "feat(auth): useUserBootstrap fetches /users/me and provisions wallet"
```

---

## Task 10: `SignIn` screen

**Files:**
- Create: `src/components/AuthGate/components/SignIn/SignIn.tsx`
- Create: `src/components/AuthGate/components/SignIn/index.ts`

- [ ] **Step 1: Write `SignIn.tsx`**

```tsx
"use client";

import { useLogin } from "@privy-io/react-auth";
import { Button } from "@/ui/Button";

export function SignIn() {
  const { login } = useLogin();

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Open Agents</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to manage and chat with your agents.
          </p>
        </div>
        <Button onClick={() => login()} size="lg">
          Sign in
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export { SignIn } from "./SignIn";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthGate/components/SignIn
git commit -m "feat(auth): SignIn screen with Privy login trigger"
```

---

## Task 11: `EnsureUserWallet`

**Files:**
- Create: `src/components/AuthGate/components/EnsureUserWallet/EnsureUserWallet.tsx`
- Create: `src/components/AuthGate/components/EnsureUserWallet/index.ts`

- [ ] **Step 1: Write `EnsureUserWallet.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { Button } from "@/ui/Button";
import { useUserBootstrap } from "../../hooks/useUserBootstrap";

export interface EnsureUserWalletProps {
  children: ReactNode;
}

export function EnsureUserWallet({ children }: EnsureUserWalletProps) {
  const { status, error, retry } = useUserBootstrap(true);

  return (
    <>
      {status === "error" && error && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <span>Wallet bootstrap failed: {error}</span>
          <Button size="sm" variant="secondary" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export {
  EnsureUserWallet,
  type EnsureUserWalletProps,
} from "./EnsureUserWallet";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthGate/components/EnsureUserWallet
git commit -m "feat(auth): EnsureUserWallet runs bootstrap and surfaces failures inline"
```

---

## Task 12: `AuthGate`

**Files:**
- Create: `src/components/AuthGate/AuthGate.tsx`
- Create: `src/components/AuthGate/index.ts`

- [ ] **Step 1: Write `AuthGate.tsx`**

```tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { Spinner } from "@/ui/Spinner";
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

  return <EnsureUserWallet>{children}</EnsureUserWallet>;
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export { AuthGate, type AuthGateProps } from "./AuthGate";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthGate/AuthGate.tsx src/components/AuthGate/index.ts
git commit -m "feat(auth): AuthGate flips between Spinner, SignIn, and EnsureUserWallet"
```

---

## Task 13: `UserMenu`

**Files:**
- Create: `src/components/UserMenu/UserMenu.tsx`
- Create: `src/components/UserMenu/index.ts`

- [ ] **Step 1: Write `UserMenu.tsx`**

```tsx
"use client";

import { useLogout, usePrivy } from "@privy-io/react-auth";
import { Dropdown, DropdownItem } from "@/ui/Dropdown";
import { Button } from "@/ui/Button";

function shortDid(did: string): string {
  if (did.length <= 16) return did;
  return `${did.slice(0, 12)}…${did.slice(-4)}`;
}

function identityLabel(user: ReturnType<typeof usePrivy>["user"]): string {
  if (!user) return "Account";
  const email = user.email?.address;
  if (email) return email;
  // Privy linked-account names sit on the typed `linkedAccounts` array;
  // fall back to a short DID when none of those are populated.
  const name = user.google?.name ?? user.twitter?.name ?? user.discord?.username;
  if (name) return name;
  return shortDid(user.id);
}

export function UserMenu() {
  const { user, ready, authenticated } = usePrivy();
  const { logout } = useLogout();

  if (!ready || !authenticated) return null;

  const label = identityLabel(user);

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm" aria-label="Account menu">
          <span className="max-w-40 truncate">{label}</span>
        </Button>
      }
    >
      <DropdownItem onSelect={() => void logout()}>Sign out</DropdownItem>
    </Dropdown>
  );
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
export { UserMenu } from "./UserMenu";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

If the typecheck flags `user.google.name` / `user.twitter.name` / `user.discord.username` because the installed Privy SDK shapes those differently, simplify the helper to only use `user.email?.address` and the short DID:

```ts
function identityLabel(user: ReturnType<typeof usePrivy>["user"]): string {
  if (!user) return "Account";
  return user.email?.address ?? shortDid(user.id);
}
```

Re-run `npx tsc --noEmit` until clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/UserMenu
git commit -m "feat(auth): UserMenu shows identity and sign-out"
```

---

## Task 14: Wire `AuthProvider` + `AuthGate` into the root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace `src/app/layout.tsx` with**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGate } from "@/components/AuthGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Agents",
  description: "Chat with Open Agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(auth): gate the whole app with AuthProvider + AuthGate"
```

---

## Task 15: Mount `UserMenu` on `/agents`

**Files:**
- Modify: `src/app/agents/page.tsx`

- [ ] **Step 1: Update the file**

Replace the entire file with:

```tsx
"use client";

import { useState } from "react";
import { AgentCreateDialog } from "@/components/AgentCreateDialog";
import { AgentGrid } from "@/components/AgentGrid";
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
          <UserMenu />
        </div>
      </header>
      <AgentGrid />
      <AgentCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/page.tsx
git commit -m "feat(auth): show UserMenu on the agents list page"
```

---

## Task 16: Mount `UserMenu` on `/agents/[id]`

**Files:**
- Modify: `src/app/agents/[id]/page.tsx`

- [ ] **Step 1: Update the nav block**

Read the current file. Locate the `<div className="flex-1" />` spacer in the `<nav>` element. Insert `<UserMenu />` immediately after `<AgentRunControl ... />`. Add the import.

The full updated file:

```tsx
"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import { AgentRunControl } from "@/components/AgentRunControl";
import { Chat } from "@/components/Chat";
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

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/[id]/page.tsx
git commit -m "feat(auth): show UserMenu on the agent chat page"
```

---

## Task 17: Final verification

- [ ] **Step 1: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc clean; lint shows only the existing 3 SDK warnings.

- [ ] **Step 2: Browser smoke**

With dev (`:3001`) and API (`:3000`) running, and `NEXT_PUBLIC_PRIVY_APP_ID` set in `.env.local`:

1. Cold visit `http://localhost:3001/agents` while logged out → sign-in screen renders.
2. Click "Sign in" → Privy modal opens. Complete an email login → app renders.
3. Open the network tab. Confirm:
   - `GET /users/me` fires once on first authenticated render.
   - On a brand-new account, `POST /users/me/wallets` fires next, returns 201.
   - Subsequent requests to `/agents` carry `Authorization: Bearer …`.
4. Reload the page → spinner briefly, then app (Privy session restored from local storage). `GET /users/me` fires; no `POST /users/me/wallets` (already provisioned).
5. Click `UserMenu` → see your email → "Sign out" → sign-in screen returns.
6. Stop the API. Reload after authenticating → `GET /users/me` fails. Bootstrap warning banner appears with the error and a Retry button. Restart API. Click Retry → banner disappears.

- [ ] **Step 3: Confirm with the user**

Report completion. Outstanding follow-ups:
- Replace hand-rolled `fetchUserMe` / `postUserWallet` with SDK calls once `/users/me` is regenerated into the SDK.
- Add token to the SSE stream URL when the backend protects that route (currently unauthenticated).

---

## Self-review notes

- Spec coverage: each spec section maps to at least one task — Dependencies (Tasks 1, 2), AuthProvider/ApiTokenSync (Tasks 6, 7), AuthGate + SignIn + EnsureUserWallet + useUserBootstrap (Tasks 9, 10, 11, 12), UserMenu + Dropdown (Tasks 5, 13), SDK token wiring (Task 3), Privy config (Task 4), wiring (Tasks 14, 15, 16), manual verification (Task 17).
- Type signatures:
  - `setApiAccessTokenGetter(getter)` introduced in Task 3 → consumed verbatim in Task 6.
  - `getApiAccessToken()` added in Task 3 → used by Task 8's `authHeaders`.
  - `useUserBootstrap(enabled)` returns `{ status, error, retry }` (Task 9) → consumed unchanged in Task 11.
  - `MeResponse.wallets[].isPrimary` (Task 8) → checked in Task 9's bootstrap.
- Privy SDK uncertainty (acknowledged in the plan header) is contained to Tasks 6, 10, 13. Task 13 includes a fallback path for `identityLabel` if the linked-account fields don't exist on the installed SDK.
