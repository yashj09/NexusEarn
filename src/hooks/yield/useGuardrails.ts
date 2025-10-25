"use client";

import { useState, useCallback } from "react";
import type { GuardrailsConfig } from "@/lib/types/yield.types";

const DEFAULT_GUARDRAILS: GuardrailsConfig = {
  maxSlippage: 0.5, // 0.5%
  gasCeiling: BigInt("100000000000000000"), // 0.1 ETH
  minAPYDelta: 1.0, // 1% minimum improvement
  maxSingleProtocolAllocation: 40, // 40% max in one protocol
  blacklistedProtocols: [],
  minBreakEvenDays: 30, // Must break even within 30 days
  riskTolerance: "moderate",
};

export function useGuardrails(initial?: Partial<GuardrailsConfig>) {
  const [config, setConfig] = useState<GuardrailsConfig>({
    ...DEFAULT_GUARDRAILS,
    ...initial,
  });

  const updateGuardrails = useCallback((updates: Partial<GuardrailsConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_GUARDRAILS);
  }, []);

  const setRiskTolerance = useCallback(
    (tolerance: "conservative" | "moderate" | "aggressive") => {
      const profiles: Record<typeof tolerance, Partial<GuardrailsConfig>> = {
        conservative: {
          maxSlippage: 0.3,
          minAPYDelta: 2.0,
          maxSingleProtocolAllocation: 25,
          minBreakEvenDays: 20,
          riskTolerance: "conservative",
        },
        moderate: {
          maxSlippage: 0.5,
          minAPYDelta: 1.0,
          maxSingleProtocolAllocation: 40,
          minBreakEvenDays: 30,
          riskTolerance: "moderate",
        },
        aggressive: {
          maxSlippage: 1.0,
          minAPYDelta: 0.5,
          maxSingleProtocolAllocation: 60,
          minBreakEvenDays: 45,
          riskTolerance: "aggressive",
        },
      };

      updateGuardrails(profiles[tolerance]);
    },
    [updateGuardrails]
  );

  return {
    config,
    updateGuardrails,
    resetToDefaults,
    setRiskTolerance,
  };
}
