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
