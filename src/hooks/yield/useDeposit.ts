"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import type { YieldOpportunity } from "@/lib/types/yield.types";
import { useNexus } from "@/providers/NexusProvider";
import { BridgeExecutor } from "@/services/nexus/BridgeExecutor";
import {
  getTokenAddress,
  getTokenDecimals,
} from "@/lib/constants/tokenAddresses";
import { parseUnits } from "viem";
import { handleError } from "@/lib/errors/errors";
import { ENV } from "@/lib/config/env";
import { ERC20_ABI } from "@/lib/constants/abis";
import type {
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail-project/nexus-core";

export function useDeposit() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { nexusSDK } = useNexus();

  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if token approval is needed
   */
  const checkApproval = useCallback(
    async (opportunity: YieldOpportunity, amount: string): Promise<boolean> => {
      if (!address || !publicClient) return false;

      try {
        const tokenAddress = getTokenAddress(
          opportunity.token,
          opportunity.chainId
        );
        const decimals = getTokenDecimals(opportunity.token);
        const amountWei = parseUnits(amount, decimals);

        // Check current allowance
        const allowance = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, opportunity.contractAddress],
        });

        const needsApproval = (allowance as bigint) < amountWei;
        setNeedsApproval(needsApproval);
        return needsApproval;
      } catch (error) {
        console.error("Error checking approval:", error);
        return false;
      }
    },
    [address, publicClient]
  );

  /**
   * Approve token spending
   */
  const approve = useCallback(
    async (opportunity: YieldOpportunity, amount: string): Promise<boolean> => {
      if (!walletClient || !address) {
        setError("Wallet not connected");
        return false;
      }

      setIsApproving(true);
      setError(null);

      try {
        const tokenAddress = getTokenAddress(
          opportunity.token,
          opportunity.chainId
        );
        const decimals = getTokenDecimals(opportunity.token);
        const amountWei = parseUnits(amount, decimals);

        // Send approval transaction
        const hash = await walletClient.writeContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [opportunity.contractAddress, amountWei],
        });

        // Wait for confirmation
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        setNeedsApproval(false);
        return true;
      } catch (error) {
        const errorMsg = handleError(error);
        setError(errorMsg);
        return false;
      } finally {
        setIsApproving(false);
      }
    },
    [walletClient, address, publicClient]
  );

  /**
   * Execute deposit
   */
  const deposit = useCallback(
    async (opportunity: YieldOpportunity, amount: string): Promise<boolean> => {
      if (ENV.USE_MOCK_DATA) {
        setError("Cannot execute transactions in mock mode");
        return false;
      }

      if (!nexusSDK || !address) {
        setError("Wallet not connected or Nexus not initialized");
        return false;
      }

      setError(null);
      setTxHash(null);

      try {
        // Check if approval is needed
        const needsApprovalCheck = await checkApproval(opportunity, amount);

        // Approve if needed
        if (needsApprovalCheck) {
          const approved = await approve(opportunity, amount);
          if (!approved) return false;
        }

        // Execute deposit
        setIsDepositing(true);

        const bridgeExecutor = new BridgeExecutor(nexusSDK);

        // If same chain as current, just deposit
        // If different chain, bridge + deposit
        const currentChainId = (chain?.id ?? 1) as SUPPORTED_CHAINS_IDS;

        if (currentChainId === opportunity.chainId) {
          // Direct deposit (would need direct deposit method)
          console.log("Direct deposit on same chain");
          // For now, use bridge executor with same chain
        }

        // Create rebalance intent structure for deposit
        const depositIntent = {
          id: `deposit-${Date.now()}`,
          from: {
            chainId: currentChainId,
            protocol: "Wallet" as any,
            amount,
            contractAddress:
              "0x0000000000000000000000000000000000000000" as `0x${string}`,
          },
          to: {
            chainId: opportunity.chainId,
            protocol: opportunity.protocol,
            expectedAPY: opportunity.apy,
            contractAddress: opportunity.contractAddress,
          },
          estimatedCost: {
            gasFee: "0",
            bridgeFee: "0",
            slippage: "0",
            totalCostUSD: "0",
          },
          netBenefit: {
            yearlyGainUSD: "0",
            netYearlyGainUSD: "0",
            breakEvenDays: 0,
          },
          guardrailsStatus: [],
          status: "pending" as const,
        };

        const result = await bridgeExecutor.executeYieldDeposit(
          depositIntent,
          address as `0x${string}`,
          opportunity.token as unknown as SUPPORTED_TOKENS
        );

        setTxHash(result.executeTransactionHash || "");
        return true;
      } catch (error) {
        const errorMsg = handleError(error);
        setError(errorMsg);
        return false;
      } finally {
        setIsDepositing(false);
      }
    },
    [nexusSDK, address, chain, checkApproval, approve]
  );

  const reset = useCallback(() => {
    setIsDepositing(false);
    setIsApproving(false);
    setNeedsApproval(false);
    setTxHash(null);
    setError(null);
  }, []);

  return {
    deposit,
    isDepositing,
    isApproving,
    needsApproval,
    txHash,
    error,
    reset,
  };
}
