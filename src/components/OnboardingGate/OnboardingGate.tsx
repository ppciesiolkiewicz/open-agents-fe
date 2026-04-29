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
