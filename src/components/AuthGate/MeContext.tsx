"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MeResponse } from "@/lib/userApi";

const MeContext = createContext<MeResponse | null>(null);

export function MeProvider({
  value,
  children,
}: {
  value: MeResponse | null;
  children: ReactNode;
}) {
  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe(): MeResponse | null {
  return useContext(MeContext);
}
