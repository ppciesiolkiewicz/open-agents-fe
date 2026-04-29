"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { PRIVY_APP_ID, PRIVY_CONFIG } from "@/lib/privy";
import { ApiTokenSync } from "./ApiTokenSync";

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={PRIVY_CONFIG}>
      <ApiTokenSync />
      {children}
    </PrivyProvider>
  );
}
