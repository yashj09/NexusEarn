import type {
  YieldOpportunity,
  YieldPosition,
  RebalanceIntent,
  RebalanceAnalysis,
  GuardrailsConfig,
} from "@/lib/types/yield.types";
import { YieldDataFetcher } from "./YieldDataFetcher";
import { GuardrailsChecker } from "./GuardrailsChecker";
import { PROTOCOL_CONFIGS } from "@/lib/config/protocols";
import type {
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail-project/nexus-core";

export class YieldAggregator {
  private dataFetcher: YieldDataFetcher;
  private guardrailsChecker: GuardrailsChecker;

  constructor(guardrailsConfig: GuardrailsConfig) {
    this.dataFetcher = new YieldDataFetcher();
    this.guardrailsChecker = new GuardrailsChecker(guardrailsConfig);
  }

  /**
   * Find optimal yield opportunities for given positions
   */
  async findOptimalOpportunities(
    currentPositions: YieldPosition[],
    totalAvailableAmount: string
  ): Promise<YieldOpportunity[]> {
    // Fetch all available opportunities
    const allOpportunities = await this.dataFetcher.fetchYieldOpportunities();

    // Filter and rank opportunities
    const rankedOpportunities = this.rankOpportunities(
      allOpportunities,
      currentPositions,
      totalAvailableAmount
    );

    return rankedOpportunities;
  }

  /**
   * Calculate complete rebalance analysis
   */
  async calculateRebalanceAnalysis(
    currentPositions: YieldPosition[],
    idleBalance: string
  ): Promise<RebalanceAnalysis> {
    console.log("🔄 Starting rebalance analysis...");

    // Get optimal opportunities
    const opportunities = await this.findOptimalOpportunities(
      currentPositions,
      idleBalance
    );

    // Generate rebalance intents
    const rebalanceIntents = this.generateRebalanceIntents(
      currentPositions,
      opportunities
    );

    // Filter by guardrails
    const approvedIntents = rebalanceIntents.filter((intent) =>
      intent.guardrailsStatus.every((check) => check.passed)
    );

    // Calculate metrics
    const currentAPY = this.calculateWeightedAPY(currentPositions);
    const projectedAPY = this.calculateProjectedAPY(
      currentPositions,
      approvedIntents
    );
    const totalCost = this.calculateTotalCost(approvedIntents);
    const yearlyGain = this.calculateYearlyGain(
      currentPositions,
      approvedIntents
    );

    console.log(
      `✅ Analysis complete: ${approvedIntents.length} recommended actions`
    );

    return {
      currentPositions,
      opportunities: opportunities.slice(0, 10), // Top 10
      rebalanceIntents: approvedIntents,
      totalCurrentAPY: currentAPY,
      totalProjectedAPY: projectedAPY,
      totalCostUSD: totalCost,
      totalYearlyGainUSD: yearlyGain,
      netYearlyGainUSD: (
        parseFloat(yearlyGain) - parseFloat(totalCost)
      ).toFixed(2),
      recommendedActions: approvedIntents.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Rank opportunities by multiple factors
   */
  private rankOpportunities(
    opportunities: YieldOpportunity[],
    currentPositions: YieldPosition[],
    totalAmount: string
  ): YieldOpportunity[] {
    // Calculate risk-adjusted scores
    const scored = opportunities.map((opp) => {
      const riskMultiplier = 1 - opp.riskScore / 10; // Lower risk = higher multiplier
      const tvlScore = Math.min(opp.tvl / 1000000, 1); // Max score at $1M TVL
      const auditBonus = opp.metadata.auditStatus ? 0.2 : 0;

      const score = opp.apy * riskMultiplier * tvlScore + auditBonus * 10;

      return { ...opp, score };
    });

    // Sort by score (descending)
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate rebalance intents from current positions to better opportunities
   */
  private generateRebalanceIntents(
    currentPositions: YieldPosition[],
    opportunities: YieldOpportunity[]
  ): RebalanceIntent[] {
    const intents: RebalanceIntent[] = [];

    for (const position of currentPositions) {
      // Find better opportunities for this token
      const betterOpps = opportunities.filter(
        (opp) =>
          opp.token === position.token &&
          opp.apy > position.apy &&
          (opp.chainId !== position.chainId ||
            opp.protocol !== position.protocol)
      );

      for (const opportunity of betterOpps.slice(0, 3)) {
        // Top 3 better options
        const intent = this.createRebalanceIntent(position, opportunity);
        intents.push(intent);
      }
    }

    return intents;
  }

  /**
   * Create a single rebalance intent
   */
  private createRebalanceIntent(
    from: YieldPosition,
    to: YieldOpportunity
  ): RebalanceIntent {
    // Estimate costs (simplified)
    const gasFee = this.estimateGasFee(from.chainId, to.chainId);
    const bridgeFee = this.estimateBridgeFee(
      from.chainId,
      to.chainId,
      from.depositedAmount
    );
    const slippage = this.estimateSlippage(from.depositedAmount);

    const totalCost = (
      parseFloat(gasFee) +
      parseFloat(bridgeFee) +
      parseFloat(slippage)
    ).toFixed(2);

    // Calculate benefits
    const apyDelta = to.apy - from.apy;
    const yearlyGain = (
      parseFloat(from.depositedAmount) *
      (apyDelta / 100)
    ).toFixed(2);
    const netYearlyGain = (
      parseFloat(yearlyGain) - parseFloat(totalCost)
    ).toFixed(2);
    const breakEvenDays = Math.ceil(
      (parseFloat(totalCost) / parseFloat(yearlyGain)) * 365
    );

    const intent: RebalanceIntent = {
      id: `${from.id}-to-${to.id}`,
      from: {
        chainId: from.chainId,
        protocol: from.protocol,
        amount: from.depositedAmount,
        contractAddress: from.contractAddress,
      },
      to: {
        chainId: to.chainId,
        protocol: to.protocol,
        expectedAPY: to.apy,
        contractAddress: to.contractAddress,
      },
      estimatedCost: {
        gasFee,
        bridgeFee,
        slippage,
        totalCostUSD: totalCost,
      },
      netBenefit: {
        yearlyGainUSD: yearlyGain,
        netYearlyGainUSD: netYearlyGain,
        breakEvenDays,
      },
      guardrailsStatus: [],
      status: "pending",
    };

    // Check guardrails
    intent.guardrailsStatus = this.guardrailsChecker.checkGuardrails(intent);

    return intent;
  }

  /**
   * Calculate weighted APY across all positions
   */
  private calculateWeightedAPY(positions: YieldPosition[]): number {
    const totalValue = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.currentValue),
      0
    );

    if (totalValue === 0) return 0;

    const weightedSum = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.currentValue) * pos.apy,
      0
    );

    return weightedSum / totalValue;
  }

  /**
   * Calculate projected APY after rebalancing
   */
  private calculateProjectedAPY(
    positions: YieldPosition[],
    intents: RebalanceIntent[]
  ): number {
    // Clone positions
    const projected = [...positions];

    // Apply rebalance intents
    for (const intent of intents) {
      const fromIndex = projected.findIndex(
        (p) => p.id === intent.from.protocol
      );
      if (fromIndex !== -1) {
        // Update position with new APY
        projected[fromIndex] = {
          ...projected[fromIndex],
          apy: intent.to.expectedAPY,
        };
      }
    }

    return this.calculateWeightedAPY(projected);
  }

  /**
   * Calculate total cost of all rebalance intents
   */
  private calculateTotalCost(intents: RebalanceIntent[]): string {
    const total = intents.reduce(
      (sum, intent) => sum + parseFloat(intent.estimatedCost.totalCostUSD),
      0
    );
    return total.toFixed(2);
  }

  /**
   * Calculate total yearly gain
   */
  private calculateYearlyGain(
    positions: YieldPosition[],
    intents: RebalanceIntent[]
  ): string {
    const total = intents.reduce(
      (sum, intent) => sum + parseFloat(intent.netBenefit.yearlyGainUSD),
      0
    );
    return total.toFixed(2);
  }

  // Estimation helpers (simplified - would use actual on-chain data)
  private estimateGasFee(
    fromChain: SUPPORTED_CHAINS_IDS,
    toChain: SUPPORTED_CHAINS_IDS
  ): string {
    // Simplified gas estimation
    const baseGas = fromChain === toChain ? 5 : 15;
    return baseGas.toFixed(2);
  }

  private estimateBridgeFee(
    fromChain: SUPPORTED_CHAINS_IDS,
    toChain: SUPPORTED_CHAINS_IDS,
    amount: string
  ): string {
    if (fromChain === toChain) return "0";
    const bridgeFeePercent = 0.001; // 0.1%
    return (parseFloat(amount) * bridgeFeePercent).toFixed(2);
  }

  private estimateSlippage(amount: string): string {
    const slippagePercent = 0.0005; // 0.05%
    return (parseFloat(amount) * slippagePercent).toFixed(2);
  }

  /**
   * Update guardrails configuration
   */
  updateGuardrails(config: Partial<GuardrailsConfig>): void {
    this.guardrailsChecker.updateConfig(config);
  }
}
