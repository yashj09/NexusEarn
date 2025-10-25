import type {
  GuardrailsConfig,
  GuardrailCheck,
  RebalanceIntent,
  YieldOpportunity,
} from "@/lib/types/yield.types";

export class GuardrailsChecker {
  private config: GuardrailsConfig;

  constructor(config: GuardrailsConfig) {
    this.config = config;
  }

  /**
   * Check all guardrails for a rebalance intent
   */
  checkGuardrails(intent: RebalanceIntent): GuardrailCheck[] {
    const checks: GuardrailCheck[] = [];

    // Check 1: Max Slippage
    checks.push(this.checkMaxSlippage(intent));

    // Check 2: Gas Ceiling
    checks.push(this.checkGasCeiling(intent));

    // Check 3: Min APY Delta
    checks.push(this.checkMinAPYDelta(intent));

    // Check 4: Protocol Blacklist
    checks.push(this.checkProtocolBlacklist(intent));

    // Check 5: Min Break Even Days
    checks.push(this.checkBreakEvenDays(intent));

    return checks;
  }

  /**
   * Check if opportunity passes all guardrails
   */
  checkOpportunity(
    opportunity: YieldOpportunity,
    currentAPY: number,
    totalAllocation: number
  ): GuardrailCheck[] {
    const checks: GuardrailCheck[] = [];

    // APY Delta check
    const apyDelta = opportunity.apy - currentAPY;
    checks.push({
      rule: "MIN_APY_DELTA",
      passed: apyDelta >= this.config.minAPYDelta,
      value: apyDelta,
      threshold: this.config.minAPYDelta,
      message: `APY improvement: ${apyDelta.toFixed(2)}% (min: ${
        this.config.minAPYDelta
      }%)`,
    });

    // Protocol allocation check
    checks.push({
      rule: "MAX_PROTOCOL_ALLOCATION",
      passed: totalAllocation <= this.config.maxSingleProtocolAllocation,
      value: totalAllocation,
      threshold: this.config.maxSingleProtocolAllocation,
      message: `Protocol allocation: ${totalAllocation}% (max: ${this.config.maxSingleProtocolAllocation}%)`,
    });

    // Blacklist check
    const isBlacklisted = this.config.blacklistedProtocols.includes(
      opportunity.protocol
    );
    checks.push({
      rule: "PROTOCOL_BLACKLIST",
      passed: !isBlacklisted,
      value: opportunity.protocol,
      threshold: "Not blacklisted",
      message: isBlacklisted
        ? `Protocol ${opportunity.protocol} is blacklisted`
        : "Protocol is allowed",
    });

    return checks;
  }

  private checkMaxSlippage(intent: RebalanceIntent): GuardrailCheck {
    const slippage = parseFloat(intent.estimatedCost.slippage);
    return {
      rule: "MAX_SLIPPAGE",
      passed: slippage <= this.config.maxSlippage,
      value: slippage,
      threshold: this.config.maxSlippage,
      message: `Slippage: ${slippage.toFixed(2)}% (max: ${
        this.config.maxSlippage
      }%)`,
    };
  }

  private checkGasCeiling(intent: RebalanceIntent): GuardrailCheck {
    const gasFee = BigInt(intent.estimatedCost.gasFee);
    return {
      rule: "GAS_CEILING",
      passed: gasFee <= this.config.gasCeiling,
      value: gasFee.toString(),
      threshold: this.config.gasCeiling.toString(),
      message: `Gas fee: ${gasFee.toString()} wei (max: ${this.config.gasCeiling.toString()} wei)`,
    };
  }

  private checkMinAPYDelta(intent: RebalanceIntent): GuardrailCheck {
    // Would need to calculate current APY vs new APY
    // For now using expected APY directly
    const apyDelta = intent.to.expectedAPY - 5; // Placeholder: assuming current is 5%
    return {
      rule: "MIN_APY_DELTA",
      passed: apyDelta >= this.config.minAPYDelta,
      value: apyDelta,
      threshold: this.config.minAPYDelta,
      message: `APY improvement: ${apyDelta.toFixed(2)}% (min: ${
        this.config.minAPYDelta
      }%)`,
    };
  }

  private checkProtocolBlacklist(intent: RebalanceIntent): GuardrailCheck {
    const isBlacklisted = this.config.blacklistedProtocols.includes(
      intent.to.protocol
    );
    return {
      rule: "PROTOCOL_BLACKLIST",
      passed: !isBlacklisted,
      value: intent.to.protocol,
      threshold: "Not blacklisted",
      message: isBlacklisted
        ? `Protocol ${intent.to.protocol} is blacklisted`
        : "Protocol is allowed",
    };
  }

  private checkBreakEvenDays(intent: RebalanceIntent): GuardrailCheck {
    const breakEvenDays = intent.netBenefit.breakEvenDays;
    return {
      rule: "MIN_BREAKEVEN_DAYS",
      passed: breakEvenDays <= this.config.minBreakEvenDays,
      value: breakEvenDays,
      threshold: this.config.minBreakEvenDays,
      message: `Break-even in ${breakEvenDays} days (max: ${this.config.minBreakEvenDays} days)`,
    };
  }

  /**
   * Update guardrails configuration
   */
  updateConfig(config: Partial<GuardrailsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): GuardrailsConfig {
    return { ...this.config };
  }
}
