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
