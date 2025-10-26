"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import type { RebalanceIntent } from "@/lib/types/yield.types";
import { useNexus } from "@/providers/NexusProvider";
import { BridgeExecutor } from "@/services/nexus/BridgeExecutor";
import { MockTransactionService } from "@/services/mock/MockTransactionService";
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
      setIsExecuting(true);
      setError(null);
      setTxHash(null);

      try {
        if (ENV.USE_MOCK_DATA) {
          // Simulate rebalance with stage updates
          setStage("Withdrawing from old protocol...");
          await new Promise((resolve) => setTimeout(resolve, 2000));

          setStage("Bridging assets...");
          await new Promise((resolve) => setTimeout(resolve, 2000));

          setStage("Depositing to new protocol...");
          await new Promise((resolve) => setTimeout(resolve, 2000));

          setStage("Confirming transaction...");

          const result = await MockTransactionService.simulateRebalance(
            intent,
            address || "0x0000000000000000000000000000000000000000"
          );

          setTxHash(result.depositTxHash);
          return result.success;
        }

        // Real rebalance
        if (!nexusSDK || !address) {
          setError("Wallet not connected or Nexus not initialized");
          return false;
        }

        const bridgeExecutor = new BridgeExecutor(nexusSDK);

        setStage("Withdrawing from old protocol...");
        const withdrawResult = await bridgeExecutor.executeYieldWithdraw(
          intent.from.chainId,
          intent.from.protocol,
          intent.from.contractAddress,
          "USDC",
          intent.from.amount,
          address as `0x${string}`
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (intent.from.chainId !== intent.to.chainId) {
          setStage("Bridging assets...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        setStage("Depositing to new protocol...");
        const depositResult = await bridgeExecutor.executeYieldDeposit(
          intent,
          address as `0x${string}`,
          "USDC"
        );

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
