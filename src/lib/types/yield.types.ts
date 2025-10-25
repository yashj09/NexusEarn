import type {
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail-project/nexus-core";

// ============= EXTENDED TYPES =============
export type EXTENDED_TOKENS = SUPPORTED_TOKENS | "DAI";

// ============= YIELD OPPORTUNITIES =============
export interface YieldOpportunity {
  id: string;
  protocol: ProtocolName;
  chainId: SUPPORTED_CHAINS_IDS;
  token: EXTENDED_TOKENS;
  apy: number;
  tvl: number;
  riskScore: number;
  contractAddress: `0x${string}`;
  depositFunction: string;
  withdrawFunction: string;
  lastUpdated: number;
  metadata: {
    auditStatus: boolean;
    timeInMarket: number; // in days
    historicalExploits: number;
  };
}

export type ProtocolName = "Aave" | "Compound" | "Yearn" | "Curve" | "Beefy";

// ============= YIELD POSITIONS =============
export interface YieldPosition {
  id: string;
  protocol: ProtocolName;
  chainId: SUPPORTED_CHAINS_IDS;
  token: EXTENDED_TOKENS;
  depositedAmount: string;
  currentValue: string;
  apy: number;
  earnedYield: string;
  depositTimestamp: number;
  contractAddress: `0x${string}`;
}

// ============= REBALANCE =============
export interface RebalanceIntent {
  id: string;
  from: {
    chainId: SUPPORTED_CHAINS_IDS;
    protocol: ProtocolName;
    amount: string;
    contractAddress: `0x${string}`;
  };
  to: {
    chainId: SUPPORTED_CHAINS_IDS;
    protocol: ProtocolName;
    expectedAPY: number;
    contractAddress: `0x${string}`;
  };
  estimatedCost: {
    gasFee: string;
    bridgeFee: string;
    slippage: string;
    totalCostUSD: string;
  };
  netBenefit: {
    yearlyGainUSD: string;
    netYearlyGainUSD: string; // after costs
    breakEvenDays: number;
  };
  guardrailsStatus: GuardrailCheck[];
  status: "pending" | "approved" | "executing" | "completed" | "failed";
}

export interface GuardrailCheck {
  rule: GuardrailRule;
  passed: boolean;
  value: string | number;
  threshold: string | number;
  message: string;
}

export type GuardrailRule =
  | "MAX_SLIPPAGE"
  | "GAS_CEILING"
  | "MIN_APY_DELTA"
  | "MAX_PROTOCOL_ALLOCATION"
  | "PROTOCOL_BLACKLIST"
  | "MIN_BREAKEVEN_DAYS";

// ============= GUARDRAILS CONFIG =============
export interface GuardrailsConfig {
  maxSlippage: number; // 0.5 = 0.5%
  gasCeiling: bigint; // Max gas in wei
  minAPYDelta: number; // Min APY difference to rebalance (e.g., 1 = 1%)
  maxSingleProtocolAllocation: number; // 40 = 40% max in one protocol
  blacklistedProtocols: ProtocolName[];
  minBreakEvenDays: number; // Min days to break even on rebalance costs
  riskTolerance: "conservative" | "moderate" | "aggressive";
}

// ============= REBALANCE ANALYSIS =============
export interface RebalanceAnalysis {
  currentPositions: YieldPosition[];
  opportunities: YieldOpportunity[];
  rebalanceIntents: RebalanceIntent[];
  totalCurrentAPY: number;
  totalProjectedAPY: number;
  totalCostUSD: string;
  totalYearlyGainUSD: string;
  netYearlyGainUSD: string;
  recommendedActions: number;
  timestamp: number;
}

// ============= BALANCE DATA =============
export interface StableBalance {
  token: EXTENDED_TOKENS;
  totalAmount: string;
  totalValueUSD: number;
  breakdown: ChainBalance[];
  isIdle: boolean;
}

export interface ChainBalance {
  chainId: SUPPORTED_CHAINS_IDS;
  chainName: string;
  amount: string;
  valueUSD: number;
  inYieldProtocol: boolean;
  protocolName?: ProtocolName;
}

// ============= API RESPONSES =============
export interface YieldDataResponse {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  rewardTokens: string[];
  underlyingTokens: string[];
  poolMeta: string;
}

export interface DeFiLlamaPoolsResponse {
  status: string;
  data: YieldDataResponse[];
}
