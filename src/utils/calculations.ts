import type { YieldPosition, YieldOpportunity } from "@/lib/types/yield.types";

/**
 * Calculate weighted average APY
 */
export function calculateWeightedAPY(positions: YieldPosition[]): number {
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
 * Calculate APY delta between two values
 */
export function calculateAPYDelta(currentAPY: number, newAPY: number): number {
  return newAPY - currentAPY;
}

/**
 * Calculate break-even days for rebalance
 */
export function calculateBreakEvenDays(
  rebalanceCost: number,
  yearlyGain: number
): number {
  if (yearlyGain <= 0) return Infinity;
  return Math.ceil((rebalanceCost / yearlyGain) * 365);
}

/**
 * Calculate yearly gain from APY improvement
 */
export function calculateYearlyGain(
  principal: number,
  apyDelta: number
): number {
  return principal * (apyDelta / 100);
}

/**
 * Calculate total portfolio value
 */
export function calculateTotalValue(positions: YieldPosition[]): number {
  return positions.reduce((sum, pos) => sum + parseFloat(pos.currentValue), 0);
}

/**
 * Calculate total earned yield
 */
export function calculateTotalYield(positions: YieldPosition[]): number {
  return positions.reduce((sum, pos) => sum + parseFloat(pos.earnedYield), 0);
}

/**
 * Calculate risk-adjusted APY
 */
export function calculateRiskAdjustedAPY(
  apy: number,
  riskScore: number
): number {
  const riskMultiplier = 1 - riskScore / 10;
  return apy * riskMultiplier;
}

/**
 * Calculate opportunity score
 */
export function calculateOpportunityScore(
  opportunity: YieldOpportunity
): number {
  const riskMultiplier = 1 - opportunity.riskScore / 10;
  const tvlScore = Math.min(opportunity.tvl / 1000000, 1); // Max at $1M
  const auditBonus = opportunity.metadata.auditStatus ? 0.2 : 0;

  return opportunity.apy * riskMultiplier * tvlScore + auditBonus * 10;
}

/**
 * Calculate estimated gas cost in USD
 */
export function estimateGasCostUSD(
  gasUnits: bigint,
  gasPrice: bigint,
  ethPriceUSD: number
): string {
  const costInEth = Number(gasUnits * gasPrice) / 1e18;
  return (costInEth * ethPriceUSD).toFixed(2);
}

/**
 * Calculate bridge fee
 */
export function calculateBridgeFee(
  amount: string,
  feePercent: number = 0.001
): string {
  return (parseFloat(amount) * feePercent).toFixed(2);
}

/**
 * Calculate slippage amount
 */
export function calculateSlippage(
  amount: string,
  slippagePercent: number
): string {
  return (parseFloat(amount) * (slippagePercent / 100)).toFixed(2);
}

/**
 * Calculate net benefit after costs
 */
export function calculateNetBenefit(
  yearlyGain: number,
  totalCost: number
): number {
  return yearlyGain - totalCost;
}

/**
 * Calculate diversification score
 */
export function calculateDiversificationScore(
  positions: YieldPosition[]
): number {
  const protocolCounts = new Map<string, number>();

  positions.forEach((pos) => {
    const count = protocolCounts.get(pos.protocol) || 0;
    protocolCounts.set(pos.protocol, count + 1);
  });

  const uniqueProtocols = protocolCounts.size;
  const totalPositions = positions.length;

  // Higher score = better diversification
  return totalPositions > 0 ? (uniqueProtocols / totalPositions) * 100 : 0;
}
