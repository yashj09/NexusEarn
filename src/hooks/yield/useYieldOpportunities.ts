"use client";

import { useState, useEffect, useCallback } from "react";
import type { YieldOpportunity } from "@/lib/types/yield.types";
import { YieldDataFetcher } from "@/services/yield/YieldDataFetcher";

export function useYieldOpportunities() {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const dataFetcher = new YieldDataFetcher();

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await dataFetcher.fetchYieldOpportunities();
      setOpportunities(data);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch opportunities"
      );
      console.error("Error fetching opportunities:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Get top N opportunities
  const getTopOpportunities = useCallback(
    (count: number = 5) => {
      return opportunities.slice(0, count);
    },
    [opportunities]
  );

  // Filter by token
  const getOpportunitiesByToken = useCallback(
    (token: import("@/lib/types/yield.types").EXTENDED_TOKENS) => {
      return opportunities.filter((opp) => opp.token === token);
    },
    [opportunities]
  );

  // Filter by chain
  const getOpportunitiesByChain = useCallback(
    (chainId: number) => {
      return opportunities.filter((opp) => opp.chainId === chainId);
    },
    [opportunities]
  );

  // Get best opportunity for token
  const getBestOpportunity = useCallback(
    (token?: import("@/lib/types/yield.types").EXTENDED_TOKENS) => {
      const filtered = token
        ? opportunities.filter((opp) => opp.token === token)
        : opportunities;
      return filtered[0] || null;
    },
    [opportunities]
  );

  return {
    opportunities,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchOpportunities,
    getTopOpportunities,
    getOpportunitiesByToken,
    getOpportunitiesByChain,
    getBestOpportunity,
  };
}
