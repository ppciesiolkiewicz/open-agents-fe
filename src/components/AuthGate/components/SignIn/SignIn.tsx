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
