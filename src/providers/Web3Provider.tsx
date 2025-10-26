"use client";
import type { State } from "wagmi";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/web3/wagmiConfig";

type Web3ProviderProps = {
  children: React.ReactNode;
  initialState?: State | undefined;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const Web3Provider = ({ children, initialState }: Web3ProviderProps) => {
  return (
    <WagmiProvider
      config={config}
      initialState={initialState}
      reconnectOnMount={true}
    >
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="soft" mode="light">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
