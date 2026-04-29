"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Spinner } from "@/ui/Spinner";
import { Onboarding } from "./components/Onboarding";
import { useOnboardingFlag } from "./hooks/useOnboardingFlag";

export interface OnboardingGateProps {
  children: ReactNode;
}

interface OnboardingContextValue {
  open: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingGate");
  return ctx;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { completed, markCompleted } = useOnboardingFlag();
  const [forceOpen, setForceOpen] = useState(false);

  const open = useCallback(() => setForceOpen(true), []);

  const handleDone = useCallback(() => {
    setForceOpen(false);
    markCompleted();
  }, [markCompleted]);

  if (completed === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const showOnboarding = forceOpen || !completed;

  return (
    <OnboardingContext.Provider value={{ open }}>
      {showOnboarding ? <Onboarding onDone={handleDone} /> : children}
    </OnboardingContext.Provider>
  );
}
