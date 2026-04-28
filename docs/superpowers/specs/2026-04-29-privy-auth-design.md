# Privy auth (FE) — design

Date: 2026-04-29

## Goal

Gate the entire frontend behind Privy authentication. Once a user is signed in, attach their access token to every API call and ensure the backend has a server-side Privy wallet provisioned for them.

This is the FE counterpart to the backend "Privy Users + Wallet Module" spec: backend verifies the JWT, upserts a `User` row, and exposes `POST /users/me/wallets` for explicit wallet provisioning. We replace the existing unauthenticated FE with a Privy-gated one.

## Scope

- Auth flow (Privy login, sign-out, identity surface).
- Access token threaded into the generated SDK on every request.
- Wallet bootstrap call after first login.
- A small `UserMenu` for showing identity + sign-out.

## Non-goals

- Client-side wallets (Privy embedded wallets are *not* used; the runtime wallet is server-side).
- Multiple wallets per user, deposit flows, in-app funding UI.
- Profile / account management UI beyond identity display + sign-out.
- Account linking flows (add another email, link Twitter, etc.). Privy's hosted modal supports them, but we don't expose dedicated UI.
- Any SSR auth handling. Pages that consume `usePrivy` are client components.

## Dependencies

- `@privy-io/react-auth` — provider, hooks (`usePrivy`, `useLogin`, `useLogout`, `useAccessToken`), prebuilt login modal.
- `@radix-ui/react-dropdown-menu` — backs a small `Dropdown` atom used by `UserMenu`.

Privy app id is read from `NEXT_PUBLIC_PRIVY_APP_ID`. Login methods (email, Google, etc.) are configured in the Privy dashboard, not in code.

## Architecture

```
RootLayout
└── AuthProvider                     wraps {children} in <PrivyProvider config={...}>
    ├── ApiTokenSync                 keeps the SDK's access-token holder in sync with Privy
    └── AuthGate                     decides what to render based on Privy + bootstrap state
        ├── (loading)                Spinner
        ├── (unauthenticated)        <SignIn />
        └── (authenticated)
            └── EnsureUserWallet     one-shot effect: GET /users/me, POST if no primary wallet
                └── {children}       the existing app
```

Each unit has one responsibility:

- **AuthProvider** — wraps the tree in `PrivyProvider` with our configuration (no embedded wallet creation, app-id from env). Mounts `ApiTokenSync` so the SDK is wired before any child renders.
- **ApiTokenSync** — non-rendering. Subscribes to Privy's auth state and updates a module-level token holder in `@/lib/api`. The SDK config closure reads from this holder for every request.
- **AuthGate** — renders one of three states based on `usePrivy()`. While Privy is bootstrapping, shows a centred Spinner. If unauthenticated, shows `<SignIn />`. If authenticated, mounts `EnsureUserWallet`.
- **EnsureUserWallet** — calls `GET /users/me` once on mount. If `wallets` is empty, calls `POST /users/me/wallets`. The app renders unconditionally once the GET completes — wallet provisioning happens in the background and surfaces as a warning banner on failure.
- **SignIn** — full-screen panel with title, app blurb, and a single "Sign in" button that calls `login()` from `useLogin()`. Privy renders its hosted modal over the page.
- **UserMenu** — top-right button on `/agents` and `/agents/[id]`. Shows the user's primary identifier (email > linked Google name > truncated DID). Click opens a Radix dropdown with one item: "Sign out".

## File layout

```
src/
  lib/
    api.ts                          + module-level token holder; SDK Configuration.accessToken closure reads it
    privy.ts                        Privy config object (appId from env, embedded wallets disabled)
    fetchUserMe.ts                  hand-rolled fetch wrapper for /users/me until SDK regens
    postUserWallet.ts               hand-rolled fetch wrapper for POST /users/me/wallets

  ui/
    Dropdown/
      Dropdown.tsx                  thin wrap over @radix-ui/react-dropdown-menu (own prop surface)
      index.ts

  components/
    AuthProvider/
      AuthProvider.tsx              <PrivyProvider config={...}><ApiTokenSync />{children}</PrivyProvider>
      ApiTokenSync.tsx              null-renderer; subscribes to Privy token, writes to lib/api holder
      index.ts

    AuthGate/
      AuthGate.tsx                  loading | sign-in | <EnsureUserWallet>{children}
      components/
        SignIn/
          SignIn.tsx                full-screen sign-in panel with login button
          index.ts
        EnsureUserWallet/
          EnsureUserWallet.tsx      runs the bootstrap effect; renders {children} + optional warning banner
          index.ts
      hooks/
        useUserBootstrap.ts         encapsulates the GET /users/me + POST /users/me/wallets dance
      index.ts

    UserMenu/
      UserMenu.tsx                  identity + dropdown
      index.ts

  app/
    layout.tsx                      wraps {children} in <AuthProvider><AuthGate>...</AuthGate></AuthProvider>
    agents/
      page.tsx                      adds <UserMenu /> next to "+ New agent"
      [id]/
        page.tsx                    adds <UserMenu /> in the nav bar
```

## Atoms

### Dropdown

`src/ui/Dropdown/Dropdown.tsx` wraps Radix Dropdown Menu. Owns its prop surface — does not re-export Radix props.

```tsx
<Dropdown trigger={<Button>...</Button>} align="end">
  <DropdownItem onSelect={...}>Sign out</DropdownItem>
</Dropdown>
```

Exports: `Dropdown`, `DropdownItem`, `DropdownSeparator` (only if needed; otherwise omit). Items receive their own `onSelect` callback.

## SDK token wiring

The SDK closure calls Privy's `getAccessToken()` on every request, so Privy's own caching/refresh handles freshness. We just install a getter into a module-level slot when auth state changes.

`src/lib/api.ts`:

```ts
type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function setApiAccessTokenGetter(getter: TokenGetter) {
  getToken = getter;
}

export const api = new DefaultApi(
  new Configuration({
    basePath: API_BASE_URL,
    accessToken: async () => (await getToken()) ?? "",
  }),
);
```

`ApiTokenSync` (under `AuthProvider/`) installs the getter when authenticated, clears it otherwise:

```tsx
"use client";
import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { setApiAccessTokenGetter } from "@/lib/api";

export function ApiTokenSync() {
  const { ready, authenticated, getAccessToken } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      setApiAccessTokenGetter(getAccessToken);
    } else {
      setApiAccessTokenGetter(async () => null);
    }
  }, [ready, authenticated, getAccessToken]);

  return null;
}
```

`getAccessToken` is the canonical Privy method on `usePrivy()`; it returns the current access token and refreshes it if near expiry. By passing the function itself (not its result) we avoid stale snapshots.

Hand-rolled fetch helpers (`fetchUserMe`, `postUserWallet`) read the token via the same module slot:

```ts
async function authHeader() {
  const token = await (await import("@/lib/api")).getApiAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

`getApiAccessToken` is a small additional export from `@/lib/api`:

```ts
export async function getApiAccessToken(): Promise<string | null> {
  return getToken();
}
```

EventSource calls (the SSE stream in `useAgentStream`) need the token attached too. EventSource doesn't support custom headers natively; the simplest fix is to query-string the token — out of scope for this spec, deferred until backend protects the SSE route. In v1 the SSE route stays unauthenticated; if the backend changes that contract we'll handle it then.

## Wallet bootstrap

`useUserBootstrap` runs once when `AuthGate` enters its authenticated state. Sequence:

1. `GET /users/me` — returns `{ user, wallets: UserWallet[] }`.
2. If `wallets.length === 0` → `POST /users/me/wallets` (no body).
3. Capture errors into a `bootstrapError: string | null`.

`EnsureUserWallet` always renders `{children}`. If `bootstrapError` is non-null, it also renders a dismissible banner above the page content reading something like "Wallet not ready — `<error>`. The app may have limited functionality." The banner has a "Retry" button that re-runs the bootstrap.

This deliberately does *not* block the app: the BE spec confirms no v1 endpoints need a wallet yet. Once they do, we'll tighten the gate.

Hand-rolled fetch helpers (`src/lib/fetchUserMe.ts`, `src/lib/postUserWallet.ts`) live until the SDK is regenerated to include `/users/me` and `/users/me/wallets`. Drop-in replacement: change one import line per call site.

## Sign-in screen

Centered card on a neutral background. Content:

- App name / logo placeholder.
- One-sentence blurb ("Sign in to your Open Agents account").
- Primary `Button` labeled "Sign in" that calls `login()` from `useLogin()`.

Privy renders its hosted modal over the page; we don't render the auth UI ourselves.

## User menu

Triggered by an `IconButton`-ish trigger that shows the user's primary label. Selection priority:

1. `user.email.address` if available.
2. `user.google.name` (or other linked OAuth account name).
3. Short DID (`did:privy:abc123…`).

Dropdown contents: a single item "Sign out" that calls `logout()` from `useLogout()`. After sign-out the gate flips back to the sign-in screen automatically.

Mounted in:

- `src/app/agents/page.tsx` header right side, next to "+ New agent".
- `src/app/agents/[id]/page.tsx` nav, after `AgentRunControl`.

## Error handling

| Condition | UX |
| --- | --- |
| Privy not yet ready (initial bootstrap) | Centred Spinner |
| Privy login modal cancelled / dismissed | No-op; user stays on sign-in screen |
| `GET /users/me` 401 | Token went stale or invalid — call `logout()`, re-render sign-in screen |
| `GET /users/me` 5xx / network error | Bootstrap warning banner with "Retry" |
| `POST /users/me/wallets` 502 `wallet_provisioning_failed` | Bootstrap warning banner with the backend message + Retry |
| `POST /users/me/wallets` 200/201 | Render app silently |
| Other endpoints 401 | Same as 401 above (uniform handling at SDK level via middleware not in scope; v1 surfaces the existing inline error) |
| Other endpoints 409 `wallet_not_provisioned` | Out of scope for v1 (no endpoint requires a wallet yet); show the raw error if it appears |

## Configuration / env

- `NEXT_PUBLIC_PRIVY_APP_ID` — required. Read once in `lib/privy.ts`. Bootstrap throws if missing in production builds; in dev we surface a runtime banner so local development without Privy is obvious.
- `NEXT_PUBLIC_API_BASE_URL` — already exists. Unchanged.

`PrivyProvider` config (in `lib/privy.ts`):

```ts
{
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  config: {
    embeddedWallets: { createOnLogin: "off" },  // server-side wallet only
    appearance: { theme: "light" },             // matches the rest of the FE
  },
}
```

## Testing

No test runner in this project. Manual verification:

1. Cold visit `/agents` while logged out → sign-in screen renders. Hit sign in → Privy modal → complete email login → app renders.
2. Reload `/agents` → spinner briefly, then app (Privy session restored from local storage).
3. Click `UserMenu` → see your email → "Sign out" → sign-in screen returns.
4. Network tab: every API call has `Authorization: Bearer …`. Token refreshes transparently after Privy session refresh.
5. First-time login: `POST /users/me/wallets` fires once, returns 201 with a wallet address.
6. Second login (same user): `GET /users/me` returns the wallet, no POST fires.
7. Force backend to 502 the POST → banner appears with retry; click Retry → succeeds (after backend recovers).

## Open items

- **SSE auth** — `useAgentStream` opens an EventSource without a token. When the backend protects the stream route, we'll need to either query-string the token or switch to a fetch-based ReadableStream reader (Privy tokens are short enough to embed in the URL safely behind TLS, but it depends on backend logging policy).
- **SDK regen** — `GET /users/me` and `POST /users/me/wallets` arrive in the SDK after the backend ships. Plan task: replace the two hand-rolled fetch helpers with SDK calls; delete `lib/fetchUserMe.ts` and `lib/postUserWallet.ts`.
- **401 universal handler** — if the API returns 401 (token revoked, account deleted), we currently surface a raw error per call site. A future change can add a single SDK middleware that calls `logout()` and forces the sign-in screen.
- **Account linking UI** — Privy's hosted modal exposes "link another account" but we don't surface a dedicated entry point. Add when we have a settings page.
- **Wallet display** — once any user-facing flow needs the wallet (e.g. deposits), the `UserMenu` should show the address.
