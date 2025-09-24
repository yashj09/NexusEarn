"use client";

import ConnectWallet from "@/components/blocks/connect-wallet";
import Nexus from "@/components/nexus";
import NexusInitButton from "@/components/nexus-init";
import { useNexus } from "@/providers/NexusProvider";

export default function Home() {
  const { nexusSDK } = useNexus();
  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-y-6 sm:p-20">
      <h1 className="text-3xl font-semibold z-10">
        Avail Nexus Next.js template
      </h1>
      <h2 className="text-lg font-semibold z-10">
        Do you first transaction in seconds
      </h2>
      <div className="flex gap-x-4 items-center justify-center z-10">
        <ConnectWallet />
        <NexusInitButton />
      </div>
      {nexusSDK?.isInitialized() && <Nexus />}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #14b8a6 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />
    </div>
  );
}
