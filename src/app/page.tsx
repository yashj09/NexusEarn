"use client";

import Nexus from "@/components/nexus";
import ConnectWallet from "@/components/blocks/connect-wallet";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            NexusEarn
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Adaptive multi-chain yield aggregator powered by Avail Nexus
          </p>
        </div>

        {/* Wallet Connect */}
        <ConnectWallet />

        {/* Main Content */}
        {isConnected && <Nexus />}
      </main>
    </div>
  );
}
