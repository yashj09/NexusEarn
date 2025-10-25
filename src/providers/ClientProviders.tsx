"use client";

import NexusProvider from "./NexusProvider";
import { YieldProvider } from "./YieldProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <NexusProvider>
      <YieldProvider>{children}</YieldProvider>
    </NexusProvider>
  );
}
