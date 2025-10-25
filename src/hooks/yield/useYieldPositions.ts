"use client";

import { useState, useEffect, useCallback } from "react";
import type { YieldPosition } from "@/lib/types/yield.types";
import { useNexus } from "@/providers/NexusProvider";
import { BalanceTracker } from "@/services/nexus/BalanceTracker";
import { useAccount } from "wagmi";

export function useYieldPositions() {
  const { nexusSDK } = useNexus();
  const { address } = useAccount();
  const [positions, setPositions] = useState<YieldPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalYield, setTotalYield] = useState<number>(0);

  const fetchPositions = useCallback(async () => {
    if (!nexusSDK || !address) return;

    setIsLoading(true);
    try {
      const tracker = new BalanceTracker(nexusSDK);
      const fetchedPositions = await tracker.fetchYieldPositions(
        address as `0x${string}`
      );

      setPositions(fetchedPositions);

      // Calculate totals
      const value = fetchedPositions.reduce(
        (sum, pos) => sum + parseFloat(pos.currentValue),
        0
      );
      const earned = fetchedPositions.reduce(
        (sum, pos) => sum + parseFloat(pos.earnedYield),
        0
      );

      setTotalValue(value);
      setTotalYield(earned);
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [nexusSDK, address]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Get positions by protocol
  const getPositionsByProtocol = useCallback(
    (protocol: string) => {
      return positions.filter((pos) => pos.protocol === protocol);
    },
    [positions]
  );

  // Get positions by token
  const getPositionsByToken = useCallback(
    (token: string) => {
      return positions.filter((pos) => pos.token === token);
    },
    [positions]
  );

  // Get weighted average APY
  const getWeightedAPY = useCallback(() => {
    if (totalValue === 0) return 0;

    const weightedSum = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.currentValue) * pos.apy,
      0
    );

    return weightedSum / totalValue;
  }, [positions, totalValue]);

  return {
    positions,
    isLoading,
    totalValue,
    totalYield,
    refresh: fetchPositions,
    getPositionsByProtocol,
    getPositionsByToken,
    getWeightedAPY,
  };
}
