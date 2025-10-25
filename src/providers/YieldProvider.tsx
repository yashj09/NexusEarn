"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNexus } from "./NexusProvider";
import { useAccount } from "wagmi";
import type {
  YieldOpportunity,
  YieldPosition,
  RebalanceAnalysis,
  GuardrailsConfig,
  StableBalance,
} from "@/lib/types/yield.types";
import { YieldAggregator } from "@/services/yield/YieldAggregator";
import { BalanceTracker } from "@/services/nexus/BalanceTracker";
import { BridgeExecutor } from "@/services/nexus/BridgeExecutor";

interface YieldContextType {
  // State
  opportunities: YieldOpportunity[];
  positions: YieldPosition[];
  stableBalances: StableBalance[];
  analysis: RebalanceAnalysis | null;
  guardrails: GuardrailsConfig;

  // Loading states
  isLoadingOpportunities: boolean;
  isLoadingPositions: boolean;
  isLoadingBalances: boolean;
  isCalculating: boolean;

  // Actions
  refreshOpportunities: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  calculateRebalance: () => Promise<void>;
  executeRebalance: (intentId: string) => Promise<void>;
  updateGuardrails: (config: Partial<GuardrailsConfig>) => void;

  // Helpers
  getTotalValue: () => number;
  getTotalYield: () => number;
  getIdleBalance: () => number;
}

const YieldContext = createContext<YieldContextType | null>(null);

const DEFAULT_GUARDRAILS: GuardrailsConfig = {
  maxSlippage: 0.5,
  gasCeiling: BigInt("100000000000000000"), // 0.1 ETH
  minAPYDelta: 1.0,
  maxSingleProtocolAllocation: 40,
  blacklistedProtocols: [],
  minBreakEvenDays: 30,
  riskTolerance: "moderate",
};

export function YieldProvider({ children }: { children: ReactNode }) {
  const { nexusSDK } = useNexus();
  const { address } = useAccount();

  // State
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [positions, setPositions] = useState<YieldPosition[]>([]);
  const [stableBalances, setStableBalances] = useState<StableBalance[]>([]);
  const [analysis, setAnalysis] = useState<RebalanceAnalysis | null>(null);
  const [guardrails, setGuardrails] =
    useState<GuardrailsConfig>(DEFAULT_GUARDRAILS);

  // Loading states
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Services
  const aggregator = useMemo(
    () => new YieldAggregator(guardrails),
    [guardrails]
  );
  const balanceTracker = useMemo(
    () => (nexusSDK ? new BalanceTracker(nexusSDK) : null),
    [nexusSDK]
  );
  const bridgeExecutor = useMemo(
    () => (nexusSDK ? new BridgeExecutor(nexusSDK) : null),
    [nexusSDK]
  );

  // Refresh opportunities
  const refreshOpportunities = useCallback(async () => {
    setIsLoadingOpportunities(true);
    try {
      const data = await aggregator.findOptimalOpportunities(positions, "0");
      setOpportunities(data);
    } catch (error) {
      console.error("Failed to refresh opportunities:", error);
    } finally {
      setIsLoadingOpportunities(false);
    }
  }, [aggregator, positions]);

  // Refresh positions
  const refreshPositions = useCallback(async () => {
    if (!balanceTracker || !address) return;

    setIsLoadingPositions(true);
    try {
      const data = await balanceTracker.fetchYieldPositions(
        address as `0x${string}`
      );
      setPositions(data);
    } catch (error) {
      console.error("Failed to refresh positions:", error);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [balanceTracker, address]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (!balanceTracker) return;

    setIsLoadingBalances(true);
    try {
      const data = await balanceTracker.getStableBalances();
      setStableBalances(data);
    } catch (error) {
      console.error("Failed to refresh balances:", error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [balanceTracker]);

  // Calculate rebalance
  const calculateRebalance = useCallback(async () => {
    setIsCalculating(true);
    try {
      const idleBalance = stableBalances
        .filter((b) => b.isIdle)
        .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0)
        .toString();

      const result = await aggregator.calculateRebalanceAnalysis(
        positions,
        idleBalance
      );
      setAnalysis(result);
    } catch (error) {
      console.error("Failed to calculate rebalance:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [aggregator, positions, stableBalances]);

  // Execute rebalance
  const executeRebalance = useCallback(
    async (intentId: string) => {
      if (!bridgeExecutor || !address || !analysis) {
        throw new Error("Missing required dependencies for rebalance");
      }

      const intent = analysis.rebalanceIntents.find((i) => i.id === intentId);
      if (!intent) {
        throw new Error("Intent not found");
      }

      try {
        await bridgeExecutor.executeRebalance(
          intent,
          address as `0x${string}`,
          "USDC" // Would determine from intent
        );

        // Refresh data after execution
        await Promise.all([refreshPositions(), refreshBalances()]);
        await calculateRebalance();
      } catch (error) {
        console.error("Failed to execute rebalance:", error);
        throw error;
      }
    },
    [
      bridgeExecutor,
      address,
      analysis,
      refreshPositions,
      refreshBalances,
      calculateRebalance,
    ]
  );

  // Update guardrails
  const updateGuardrails = useCallback(
    (config: Partial<GuardrailsConfig>) => {
      setGuardrails((prev) => ({ ...prev, ...config }));
      aggregator.updateGuardrails(config);
    },
    [aggregator]
  );

  // Helpers
  const getTotalValue = useCallback(() => {
    return positions.reduce(
      (sum, pos) => sum + parseFloat(pos.currentValue),
      0
    );
  }, [positions]);

  const getTotalYield = useCallback(() => {
    return positions.reduce((sum, pos) => sum + parseFloat(pos.earnedYield), 0);
  }, [positions]);

  const getIdleBalance = useCallback(() => {
    return stableBalances
      .filter((b) => b.isIdle)
      .reduce((sum, b) => sum + b.totalValueUSD, 0);
  }, [stableBalances]);

  // Auto-refresh on mount and when address changes
  useEffect(() => {
    if (nexusSDK && address) {
      Promise.all([
        refreshOpportunities(),
        refreshPositions(),
        refreshBalances(),
      ]);
    }
  }, [nexusSDK, address]);

  const value = useMemo(
    () => ({
      opportunities,
      positions,
      stableBalances,
      analysis,
      guardrails,
      isLoadingOpportunities,
      isLoadingPositions,
      isLoadingBalances,
      isCalculating,
      refreshOpportunities,
      refreshPositions,
      refreshBalances,
      calculateRebalance,
      executeRebalance,
      updateGuardrails,
      getTotalValue,
      getTotalYield,
      getIdleBalance,
    }),
    [
      opportunities,
      positions,
      stableBalances,
      analysis,
      guardrails,
      isLoadingOpportunities,
      isLoadingPositions,
      isLoadingBalances,
      isCalculating,
      refreshOpportunities,
      refreshPositions,
      refreshBalances,
      calculateRebalance,
      executeRebalance,
      updateGuardrails,
      getTotalValue,
      getTotalYield,
      getIdleBalance,
    ]
  );

  return (
    <YieldContext.Provider value={value}>{children}</YieldContext.Provider>
  );
}

export function useYield() {
  const context = useContext(YieldContext);
  if (!context) {
    throw new Error("useYield must be used within a YieldProvider");
  }
  return context;
}
