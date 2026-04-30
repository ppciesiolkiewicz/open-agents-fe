"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useMe } from "@/components/AuthGate";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {title}
      </h2>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="break-all text-right font-mono text-xs text-zinc-900 dark:text-zinc-100">
        {value ?? "—"}
      </span>
    </div>
  );
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-zinc-800 dark:text-zinc-200">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function DebugPage() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const me = useMe();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Debug</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Privy session and backend user state.
        </p>
      </header>

      <Section title="Status">
        <Field label="Privy ready" value={String(ready)} />
        <Field label="Authenticated" value={String(authenticated)} />
        <Field label="Wallets ready" value={String(walletsReady)} />
      </Section>

      <Section title="Privy user">
        <Field label="DID" value={user?.id ?? null} />
        <Field label="Created at" value={user?.createdAt?.toString() ?? null} />
        <Field label="Email" value={user?.email?.address ?? null} />
        <Field label="Phone" value={user?.phone?.number ?? null} />
        <Field label="Google" value={user?.google?.email ?? null} />
        <Field label="Wallet (primary)" value={user?.wallet?.address ?? null} />
      </Section>

      <Section title="Privy linked accounts">
        <Json value={user?.linkedAccounts ?? []} />
      </Section>

      <Section title="Privy wallets (useWallets)">
        {wallets.length === 0 ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            No wallets
          </span>
        ) : (
          <Json
            value={wallets.map((w) => ({
              address: w.address,
              chainId: w.chainId,
              walletClientType: w.walletClientType,
              connectorType: w.connectorType,
              imported: w.imported,
            }))}
          />
        )}
      </Section>

      <Section title="Backend /users/me">
        {me ? <Json value={me} /> : (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Not loaded
          </span>
        )}
      </Section>

      <Section title="Privy user (raw)">
        <Json value={user} />
      </Section>
    </div>
  );
}
