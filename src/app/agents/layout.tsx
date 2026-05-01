"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/components/QueryProvider";

export default function AgentsLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
