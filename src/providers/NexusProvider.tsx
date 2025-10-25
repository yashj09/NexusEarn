"use client";
/* eslint-disable react-refresh/only-export-components */
import useInitNexus from "@/hooks/useInitNexus";
import {
  NexusSDK,
  type OnAllowanceHookData,
  type OnIntentHookData,
} from "@avail-project/nexus-core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useAccount } from "wagmi";

interface NexusContextType {
  nexusSDK: NexusSDK | null;
  intentRefCallback: React.RefObject<OnIntentHookData | null>;
  allowanceRefCallback: React.RefObject<OnAllowanceHookData | null>;
  handleInit: () => Promise<void>;
  isInitialized: boolean; // NEW
}

const NexusContext = createContext<NexusContextType | null>(null);

const NexusProvider = ({ children }: { children: React.ReactNode }) => {
  const sdk = useMemo(
    () =>
      new NexusSDK({
        network: "testnet", // Change to 'testnet' for testing
        debug: true,
      }),
    []
  );
  const { status } = useAccount();
  const {
    nexusSDK,
    initializeNexus,
    deinitializeNexus,
    attachEventHooks,
    intentRefCallback,
    allowanceRefCallback,
  } = useInitNexus(sdk);

  const handleInit = useCallback(async () => {
    if (sdk.isInitialized()) {
      console.log("Nexus already initialized");
      return;
    }
    await initializeNexus();
    attachEventHooks();
  }, [sdk, attachEventHooks, initializeNexus]);

  useEffect(() => {
    // AUTO-INITIALIZE when wallet connects (defer a tick to avoid wallet races)
    if (status === "connected" && !sdk.isInitialized()) {
      const t = setTimeout(() => {
        console.log("Wallet connected, initializing Nexus...");
        handleInit();
      }, 50);
      return () => clearTimeout(t);
    }

    return () => {
      // Cleanup on unmount only if disconnected
      if (status === "disconnected" && sdk.isInitialized()) {
        deinitializeNexus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const value = useMemo(
    () => ({
      nexusSDK,
      intentRefCallback,
      allowanceRefCallback,
      handleInit,
      isInitialized: sdk.isInitialized(), // NEW
    }),
    [nexusSDK, intentRefCallback, allowanceRefCallback, handleInit, sdk]
  );

  return (
    <NexusContext.Provider value={value}>{children}</NexusContext.Provider>
  );
};

export function useNexus() {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error("useNexus must be used within a NexusProvider");
  }
  return context;
}

export default NexusProvider;
