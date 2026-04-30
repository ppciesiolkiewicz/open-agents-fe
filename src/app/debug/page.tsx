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
        <Json
          value={{
            ready,
            authenticated,
            walletsReady,
          }}
        />
      </Section>

      <Section title="usePrivy().user">
        <Json value={user} />
      </Section>

      <Section title="usePrivy().user.linkedAccounts">
        <Json value={user?.linkedAccounts} />
      </Section>

      <Section title="useWallets().wallets">
        <Json value={wallets} />
      </Section>

      <Section title="Backend server wallets">
        {me ? (
          <ServerWalletList me={me} />
        ) : (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Not loaded
          </span>
        )}
      </Section>

      <Section title="Backend /users/me (raw)">
        <Json value={me} />
      </Section>
    </div>
  );
}

function formatTs(n: number): string {
  const ms = n < 1e12 ? n * 1000 : n;
  return new Date(ms).toISOString();
}

function ServerWalletList({ me }: { me: NonNullable<ReturnType<typeof useMe>> }) {
  if (me.wallets.length === 0) {
    return (
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        No server wallets
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        count: {me.wallets.length}
      </div>
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {me.wallets.map((w) => (
          <div key={w.id} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className="break-all font-mono text-xs text-zinc-900 dark:text-zinc-100">
                {w.walletAddress}
              </span>
              {w.isPrimary && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  primary
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span>id: {w.id}</span>
              <span>created: {formatTs(w.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
