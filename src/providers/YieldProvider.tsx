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
import { AvailDAService } from "@/services/avail/AvailDAService";
import { handleError } from "@/lib/errors/errors";
import { ENV } from "@/lib/config/env";
import {
  MOCK_YIELD_OPPORTUNITIES,
  MOCK_YIELD_POSITIONS,
  MOCK_STABLE_BALANCES,
} from "@/lib/mock/mockData";

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

  // Error state
  error: string | null;

  // Actions
  refreshOpportunities: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  calculateRebalance: () => Promise<void>;
  executeRebalance: (intentId: string) => Promise<void>;
  updateGuardrails: (config: Partial<GuardrailsConfig>) => void;
  clearError: () => void;

  // Helpers
  getTotalValue: () => number;
  getTotalYield: () => number;
  getIdleBalance: () => number;
}

const YieldContext = createContext<YieldContextType | null>(null);

const DEFAULT_GUARDRAILS: GuardrailsConfig = {
  maxSlippage: 0.5,
  gasCeiling: BigInt("100000000000000000"),
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
  const [error, setError] = useState<string | null>(null);

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
  const availDA = useMemo(() => new AvailDAService(), []);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Refresh opportunities
  const refreshOpportunities = useCallback(async () => {
    if (ENV.USE_MOCK_DATA) {
      setOpportunities(MOCK_YIELD_OPPORTUNITIES);
      return;
    }

    setIsLoadingOpportunities(true);
    setError(null);
    try {
      const data = await aggregator.findOptimalOpportunities(positions, "0");
      setOpportunities(data);

      // Post to Avail DA
      await availDA.postYieldSnapshot({
        timestamp: Date.now(),
        opportunities: data,
        totalTVL: data.reduce((sum, opp) => sum + opp.tvl, 0),
      });
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      console.error("Failed to refresh opportunities:", err);
    } finally {
      setIsLoadingOpportunities(false);
    }
  }, [aggregator, positions, availDA]);

  // Refresh positions
  const refreshPositions = useCallback(async () => {
    if (!balanceTracker || !address) return;

    if (ENV.USE_MOCK_DATA) {
      setPositions(MOCK_YIELD_POSITIONS);
      return;
    }

    setIsLoadingPositions(true);
    setError(null);
    try {
      const data = await balanceTracker.fetchYieldPositions(
        address as `0x${string}`
      );
      setPositions(data);
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      console.error("Failed to refresh positions:", err);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [balanceTracker, address]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (!balanceTracker) return;

    if (ENV.USE_MOCK_DATA) {
      setStableBalances(MOCK_STABLE_BALANCES);
      return;
    }

    setIsLoadingBalances(true);
    setError(null);
    try {
      const data = await balanceTracker.getStableBalances();
      setStableBalances(data);
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      console.error("Failed to refresh balances:", err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [balanceTracker]);

  // Calculate rebalance
  const calculateRebalance = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
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
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      console.error("Failed to calculate rebalance:", err);
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

      setError(null);
      try {
        const result = await bridgeExecutor.executeRebalance(
          intent,
          address as `0x${string}`,
          "USDC"
        );

        // Post event to Avail DA
        await availDA.postRebalanceEvent({
          timestamp: Date.now(),
          userAddress: address,
          fromProtocol: intent.from.protocol,
          toProtocol: intent.to.protocol,
          amount: intent.from.amount,
          txHash: result.depositResult.executeTransactionHash || "",
        });

        // Refresh data after execution
        await Promise.all([refreshPositions(), refreshBalances()]);
        await calculateRebalance();
      } catch (err) {
        const errorMsg = handleError(err);
        setError(errorMsg);
        console.error("Failed to execute rebalance:", err);
        throw err;
      }
    },
    [
      bridgeExecutor,
      address,
      analysis,
      refreshPositions,
      refreshBalances,
      calculateRebalance,
      availDA,
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

  // Auto-refresh on mount
  useEffect(() => {
    if (nexusSDK && address && !ENV.USE_MOCK_DATA) {
      Promise.all([
        refreshOpportunities(),
        refreshPositions(),
        refreshBalances(),
      ]);
    } else if (ENV.USE_MOCK_DATA) {
      setOpportunities(MOCK_YIELD_OPPORTUNITIES);
      setPositions(MOCK_YIELD_POSITIONS);
      setStableBalances(MOCK_STABLE_BALANCES);
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
      error,
      refreshOpportunities,
      refreshPositions,
      refreshBalances,
      calculateRebalance,
      executeRebalance,
      updateGuardrails,
      clearError,
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
      error,
      refreshOpportunities,
      refreshPositions,
      refreshBalances,
      calculateRebalance,
      executeRebalance,
      updateGuardrails,
      clearError,
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

export default YieldProvider;
