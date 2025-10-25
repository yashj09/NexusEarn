"use client";

import { useState, useCallback, useEffect } from "react";
import { usePublicClient, useWatchPendingTransactions } from "wagmi";
import type { Hash } from "viem";

interface TransactionStatus {
  hash: Hash;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  blockNumber?: bigint;
  gasUsed?: bigint;
  explorerUrl?: string;
  error?: string;
}

export function useTransactionMonitor() {
  const [transactions, setTransactions] = useState<
    Map<Hash, TransactionStatus>
  >(new Map());
  const publicClient = usePublicClient();

  /**
   * Add transaction to monitor
   */
  const addTransaction = useCallback(
    (hash: Hash, chainId: number) => {
      const explorerUrls: Record<number, string> = {
        1: "https://etherscan.io",
        137: "https://polygonscan.com",
        42161: "https://arbiscan.io",
        10: "https://optimistic.etherscan.io",
        8453: "https://basescan.org",
      };

      setTransactions((prev) => {
        const newMap = new Map(prev);
        newMap.set(hash, {
          hash,
          status: "pending",
          confirmations: 0,
          explorerUrl: `${explorerUrls[chainId]}/tx/${hash}`,
        });
        return newMap;
      });

      // Start monitoring
      monitorTransaction(hash);
    },
    [publicClient]
  );

  /**
   * Monitor transaction status
   */
  const monitorTransaction = useCallback(
    async (hash: Hash) => {
      if (!publicClient) return;

      try {
        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        setTransactions((prev) => {
          const newMap = new Map(prev);
          const tx = newMap.get(hash);
          if (tx) {
            newMap.set(hash, {
              ...tx,
              status: receipt.status === "success" ? "confirmed" : "failed",
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed,
              confirmations: 1,
            });
          }
          return newMap;
        });

        // Continue monitoring for more confirmations
        let confirmations = 1;
        const interval = setInterval(async () => {
          try {
            const currentBlock = await publicClient.getBlockNumber();
            confirmations = Number(currentBlock - receipt.blockNumber) + 1;

            setTransactions((prev) => {
              const newMap = new Map(prev);
              const tx = newMap.get(hash);
              if (tx) {
                newMap.set(hash, { ...tx, confirmations });
              }
              return newMap;
            });

            // Stop after 12 confirmations
            if (confirmations >= 12) {
              clearInterval(interval);
            }
          } catch (error) {
            clearInterval(interval);
          }
        }, 15000); // Check every 15 seconds

        // Cleanup after 5 minutes
        setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
      } catch (error) {
        console.error("Transaction failed:", error);
        setTransactions((prev) => {
          const newMap = new Map(prev);
          const tx = newMap.get(hash);
          if (tx) {
            newMap.set(hash, {
              ...tx,
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
          return newMap;
        });
      }
    },
    [publicClient]
  );

  /**
   * Get transaction status
   */
  const getTransaction = useCallback(
    (hash: Hash): TransactionStatus | undefined => {
      return transactions.get(hash);
    },
    [transactions]
  );

  /**
   * Remove transaction from monitor
   */
  const removeTransaction = useCallback((hash: Hash) => {
    setTransactions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(hash);
      return newMap;
    });
  }, []);

  /**
   * Clear all transactions
   */
  const clearTransactions = useCallback(() => {
    setTransactions(new Map());
  }, []);

  return {
    transactions: Array.from(transactions.values()),
    addTransaction,
    getTransaction,
    removeTransaction,
    clearTransactions,
  };
}
