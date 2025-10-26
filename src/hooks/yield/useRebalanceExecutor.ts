"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import type { RebalanceIntent } from "@/lib/types/yield.types";
import { useNexus } from "@/providers/NexusProvider";
import { BridgeExecutor } from "@/services/nexus/BridgeExecutor";
import { handleError } from "@/lib/errors/errors";
import { ENV } from "@/lib/config/env";

type ExecutionStage =
  | "Withdrawing from old protocol..."
  | "Bridging assets..."
  | "Depositing to new protocol..."
  | "Confirming transaction...";

export function useRebalanceExecutor() {
  const { address } = useAccount();
  const { nexusSDK } = useNexus();

  const [isExecuting, setIsExecuting] = useState(false);
  const [stage, setStage] = useState<ExecutionStage | "">("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (intent: RebalanceIntent): Promise<boolean> => {
      if (ENV.USE_MOCK_DATA) {
        // Simulate execution in mock mode
        setIsExecuting(true);
        setError(null);

        setStage("Withdrawing from old protocol...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setStage("Bridging assets...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setStage("Depositing to new protocol...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setStage("Confirming transaction...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setTxHash("0x" + "1".repeat(64)); // Mock tx hash
        setIsExecuting(false);
        return true;
      }

      if (!nexusSDK || !address) {
        setError("Wallet not connected or Nexus not initialized");
        return false;
      }

      setIsExecuting(true);
      setError(null);
      setTxHash(null);

      try {
        const bridgeExecutor = new BridgeExecutor(nexusSDK);

        // Step 1: Withdraw
        setStage("Withdrawing from old protocol...");
        const withdrawResult = await bridgeExecutor.executeYieldWithdraw(
          intent.from.chainId,
          intent.from.protocol,
          intent.from.contractAddress,
          "USDC", // Infer from intent
          intent.from.amount,
          address as `0x${string}`
        );

        // Wait for withdrawal confirmation
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Step 2: Bridge (if needed)
        if (intent.from.chainId !== intent.to.chainId) {
          setStage("Bridging assets...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Step 3: Deposit
        setStage("Depositing to new protocol...");
        const depositResult = await bridgeExecutor.executeYieldDeposit(
          intent,
          address as `0x${string}`,
          "USDC"
        );

        // Step 4: Confirm
        setStage("Confirming transaction...");
        setTxHash(depositResult.executeTransactionHash || "");

        return true;
      } catch (error) {
        const errorMsg = handleError(error);
        setError(errorMsg);
        return false;
      } finally {
        setIsExecuting(false);
        setStage("");
      }
    },
    [nexusSDK, address]
  );

  const reset = useCallback(() => {
    setIsExecuting(false);
    setStage("");
    setTxHash(null);
    setError(null);
  }, []);

  return {
    execute,
    isExecuting,
    stage,
    txHash,
    error,
    reset,
  };
}
