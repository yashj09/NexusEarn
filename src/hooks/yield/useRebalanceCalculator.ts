"use client";

import { useState, useCallback } from "react";
import type {
  RebalanceAnalysis,
  YieldPosition,
  GuardrailsConfig,
} from "@/lib/types/yield.types";
import { YieldAggregator } from "@/services/yield/YieldAggregator";

const DEFAULT_GUARDRAILS: GuardrailsConfig = {
  maxSlippage: 0.5,
  gasCeiling: BigInt("100000000000000000"), // 0.1 ETH
  minAPYDelta: 1.0,
  maxSingleProtocolAllocation: 40,
  blacklistedProtocols: [],
  minBreakEvenDays: 30,
  riskTolerance: "moderate",
};

export function useRebalanceCalculator(
  customGuardrails?: Partial<GuardrailsConfig>
) {
  const [analysis, setAnalysis] = useState<RebalanceAnalysis | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardrails = { ...DEFAULT_GUARDRAILS, ...customGuardrails };
  const aggregator = new YieldAggregator(guardrails);

  const calculateRebalance = useCallback(
    async (currentPositions: YieldPosition[], idleBalance: string) => {
      setIsCalculating(true);
      setError(null);

      try {
        const result = await aggregator.calculateRebalanceAnalysis(
          currentPositions,
          idleBalance
        );
        setAnalysis(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Calculation failed";
        setError(errorMessage);
        console.error("Rebalance calculation error:", err);
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    [guardrails]
  );

  const updateGuardrails = useCallback(
    (newGuardrails: Partial<GuardrailsConfig>) => {
      aggregator.updateGuardrails(newGuardrails);
    },
    [aggregator]
  );

  return {
    analysis,
    isCalculating,
    error,
    calculateRebalance,
    updateGuardrails,
    currentGuardrails: guardrails,
  };
}
