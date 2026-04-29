# Onboarding flow — design

Date: 2026-04-29

## Goal

Show a one-time onboarding screen to new users immediately after their wallet is provisioned. The screen explains what to do next: welcome, top up with USDC, and buy AI computation credits. Returning users get a persistent "Top up" button in the top bar.

## Scope

- First-time-only full-screen onboarding (localStorage flag).
- Three numbered cards: welcome, top-up, buy credits (no-op).
- Transak top-up link prefilled with user's wallet address and $20.
- Wallet address displayed with copy-to-clipboard affordance.
- Always-visible "Top up" button in the top bar on `/agents` and `/agents/[id]`.
- Wallet propagation to `OnboardingGate` and `TopUpButton` via a small context.
- Minor refactor to `useUserBootstrap` to surface the primary wallet.

## Non-goals

- Multi-step wizard / progress dots.
- Balance checking or balance-aware re-showing of onboarding.
- Transak API key / custom branding.
- Real USDC→0G swap (card 3 is a placeholder, "coming soon" inline note on click).
- Server-side onboarding flag — localStorage only for v1.

## Dependencies

No new packages. Uses existing `@/ui` atoms, Privy hooks, and the `WalletContext` introduced here.

## Architecture

```
RootLayout
└── AuthProvider
    └── AuthGate
        └── EnsureUserWallet                 ← minor change: provides WalletContext
            └── OnboardingGate               ← new
                ├── (null / unknown)         Spinner while localStorage resolves
                ├── (first time)             <Onboarding />
                └── (returning)             {children}
                                                ├── /agents page   → TopUpButton in header
                                                └── /agents/[id]   → TopUpButton in nav
```

Each unit's responsibility:

- **EnsureUserWallet** — unchanged behaviour, now also publishes the primary wallet into `WalletContext`.
- **OnboardingGate** — reads localStorage flag; shows Spinner during hydration, `<Onboarding />` on first visit, `{children}` otherwise.
- **Onboarding** — full-screen centred column, three numbered cards, "Get started" footer CTA that marks the flag and re-renders `{children}`.
- **TopUpButton** — top-bar button, opens Transak URL directly in a new tab.

## File layout

```
src/
  lib/
    transak.ts                                      builds Transak URL from wallet address

  hooks/
    useUserWallet.ts                                ← new: WalletContext + useUserWallet() shared hook

  components/
    AuthGate/
      components/
        EnsureUserWallet/
          EnsureUserWallet.tsx                      ← provides WalletContext
          index.ts

      hooks/
        useUserBootstrap.ts                         ← refactor: return primary wallet

    OnboardingGate/                                 ← new
      OnboardingGate.tsx
      components/
        Onboarding/
          Onboarding.tsx
          components/
            WelcomeCard/
              WelcomeCard.tsx
            TopUpCard/
              TopUpCard.tsx
            BuyCreditsCard/
              BuyCreditsCard.tsx
      hooks/
        useOnboardingFlag.ts
      index.ts

    TopUpButton/                                    ← new
      TopUpButton.tsx
      index.ts
```

## Wallet context

`src/hooks/useUserWallet.ts` — global shared hook, importable via `@/hooks/useUserWallet`:

```ts
import { createContext, useContext } from "react";
import type { MeWallet } from "@/lib/userApi";

export const WalletContext = createContext<MeWallet | null>(null);
export const useUserWallet = () => useContext(WalletContext);
```

`useUserBootstrap` is extended to return `wallet: MeWallet | null` (the first wallet where `isPrimary === true`, or null if none provisioned yet). `EnsureUserWallet` imports `WalletContext` from `@/hooks/useUserWallet` and wraps children in `<WalletContext.Provider value={wallet}>`.

`OnboardingGate` and `TopUpButton` import `useUserWallet` from `@/hooks/useUserWallet` directly — no re-export workaround needed.

## Transak URL builder

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

No API key required. No new env vars.

## Onboarding flag

`src/components/OnboardingGate/hooks/useOnboardingFlag.ts`:

```ts
const KEY = "openAgents.onboardingCompleted";

export function useOnboardingFlag() {
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

`completed === null` during SSR / before hydration. `OnboardingGate` renders a centred Spinner in this state to avoid a flash of either onboarding or app content.

## OnboardingGate

```tsx
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { completed, markCompleted } = useOnboardingFlag();
  if (completed === null) return <CentredSpinner />;
  if (!completed) return <Onboarding onDone={markCompleted} />;
  return <>{children}</>;
}
```

## Onboarding screen

Full-screen centred column (`min-h-dvh`, `max-w-2xl`, centred). Three numbered `Card` atoms stacked with gap. Footer "Get started" button calls `onDone`.

### Card 1 — Welcome

- Heading: **"Welcome to Open Agents"**
- Body: "Your account is ready. You can come back to any of these steps later from the top bar."

### Card 2 — "1. Top up your account"

- Body: "Send USDC to your account on Unichain to fund your agents."
- Primary button: **"Top up with USDC"** → `buildTransakUrl(wallet.walletAddress)` in `target="_blank"`.
- Below button: wallet address in `font-mono text-sm`, with an `IconButton` (clipboard icon) that copies to clipboard. Label: "Your wallet address".
- If `wallet` is null (provisioning still in-flight), button is disabled and address line is replaced with "Wallet address loading…".

### Card 3 — "2. Buy AI computation credits"

- Body: "Convert your USDC into AI computation credits to run agents."
- Primary button: **"Buy AI credits"** — `onClick` sets local `showComingSoon` state; renders an inline note "Coming soon — this feature is on its way." beneath the button. No backend call, no toast.

### Footer

Single `Button` variant="primary": **"Get started"** → calls `onDone()`. No "Skip" label — "Get started" is the skip for users not ready to top up.

## TopUpButton

`src/components/TopUpButton/TopUpButton.tsx`:

```tsx
export function TopUpButton() {
  const wallet = useUserWallet();
  if (!wallet) return null;
  return (
    <a
      href={buildTransakUrl(wallet.walletAddress)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="secondary" size="sm">Top up</Button>
    </a>
  );
}
```

Mounted in:
- `src/app/agents/page.tsx` — next to "+ New agent" and `UserMenu`.
- `src/app/agents/[id]/page.tsx` — in the nav bar after `AgentRunControl`.

## Error handling

| Condition | UX |
| --- | --- |
| localStorage unavailable (SSR) | Spinner until `useEffect` resolves |
| `wallet` null on Card 2 | "Top up" disabled, address line shows "Wallet address loading…" |
| Clipboard API unavailable | Copy button hidden (`navigator.clipboard` guard) |
| "Buy AI credits" clicked | Inline "Coming soon" note, no error state |

## env / config

No new env vars. `NEXT_PUBLIC_TRANSAK_API_KEY` is not used.

## tsconfig alias

Add `"@/hooks/*": ["src/hooks/*"]` to `tsconfig.json` `compilerOptions.paths` alongside the existing aliases.

## New branch

Work happens on a new branch off `feat/privy-auth`.

## Testing (manual)

1. Clear localStorage. Sign in as a new user → onboarding screen renders.
2. Card 2 shows wallet address; "Top up with USDC" opens Transak in new tab with address pre-filled.
3. Card 3 "Buy AI credits" → inline "Coming soon" note appears.
4. "Get started" → app renders normally.
5. Reload → onboarding does not show again.
6. "Top up" button visible in top bar on `/agents` and `/agents/[id]`; click opens Transak.
7. Sign out, sign in as the same user → onboarding does not show (flag persists).
8. Sign in from a different browser → onboarding shows again (localStorage is per-browser).
