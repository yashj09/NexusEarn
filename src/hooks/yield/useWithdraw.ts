"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import type { YieldPosition } from "@/lib/types/yield.types";
import { useNexus } from "@/providers/NexusProvider";
import { BridgeExecutor } from "@/services/nexus/BridgeExecutor";
import { handleError } from "@/lib/errors/errors";
import { ENV } from "@/lib/config/env";

export function useWithdraw() {
  const { address } = useAccount();
  const { nexusSDK } = useNexus();

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const withdraw = useCallback(
    async (position: YieldPosition, amount: string): Promise<boolean> => {
      if (ENV.USE_MOCK_DATA) {
        setError("Cannot execute transactions in mock mode");
        return false;
      }

      if (!nexusSDK || !address) {
        setError("Wallet not connected or Nexus not initialized");
        return false;
      }

      setIsWithdrawing(true);
      setError(null);
      setTxHash(null);

      try {
        const bridgeExecutor = new BridgeExecutor(nexusSDK);

        const result = await bridgeExecutor.executeYieldWithdraw(
          position.chainId,
          position.protocol,
          position.contractAddress,
          position.token,
          amount,
          address as `0x${string}`
        );

        setTxHash(result.transactionHash || "");
        return true;
      } catch (error) {
        const errorMsg = handleError(error);
        setError(errorMsg);
        return false;
      } finally {
        setIsWithdrawing(false);
      }
    },
    [nexusSDK, address]
  );

  const reset = useCallback(() => {
    setIsWithdrawing(false);
    setTxHash(null);
    setError(null);
  }, []);

  return {
    withdraw,
    isWithdrawing,
    txHash,
    error,
    reset,
  };
}
